import { Button } from "@mantine/core";
import EventEmitter from "events";
import { useCallback, useEffect, useRef, useState } from "react";
import { split } from 'sentence-splitter';
import { cloneArrayBuffer, md5, sleep } from "../utils";
import * as idb from '../idb';
import { useAppDispatch, useAppSelector } from "../store";
import { selectElevenLabsApiKey } from "../store/api-keys";
import { selectVoice } from "../store/voices";
import { openElevenLabsApiKeyPanel } from "../store/settings-ui";
import { defaultElevenLabsVoiceID } from "./defaults";
import { FormattedMessage, useIntl } from "react-intl";

const endpoint = 'https://api.elevenlabs.io';

let currentReader: ElevenLabsReader | null = null;

const cache = new Map<string, ArrayBuffer>();

export function createHeaders(apiKey = localStorage.getItem('elevenlabs-api-key') || '') {
    return {
        'xi-api-key': apiKey,
        'content-type': 'application/json',
    };
}

export async function getVoices() {
    const response = await fetch(`${endpoint}/v1/voices`, {
        headers: createHeaders(),
    });
    const json = await response.json();
    return json;
}

const audioContext = new AudioContext();

export default class ElevenLabsReader extends EventEmitter {
    private apiKey: string;
    private initialized = false;
    private cancelled = false;
    private textSegments: string[] = [];
    private currentTrack: number = -1;
    private nextTrack: number = 0;
    private audios: (AudioBuffer | null)[] = [];
    private element: HTMLElement | undefined | null;
    private voiceID = defaultElevenLabsVoiceID;
    currentSource: AudioBufferSourceNode | undefined;

    constructor() {
        super();
        this.apiKey = localStorage.getItem('elevenlabs-api-key') || '';
    }

    private async createAudio() {
        if (this.initialized) {
            return;
        }
        this.initialized = true;

        const chunkSize = 3;
        for (let i = 0; i < this.textSegments.length && !this.cancelled; i += chunkSize) {
            const chunk = this.textSegments.slice(i, i + chunkSize);
            await Promise.all(chunk.map((_, index) => this.createAudioForTextSegment(i + index)));
        }
    }

    private async createAudioForTextSegment(index: number) {
        if (this.audios[index] || this.cancelled) {
            return;
        }

        const hash = await md5(this.textSegments[index]);
        const cacheKey = `audio:${this.voiceID}:${hash}`;

        let buffer = cache.get(cacheKey);

        if (!buffer) {
            buffer = await idb.get(cacheKey);
        }

        if (!buffer) {
            const url = endpoint + '/v1/text-to-speech/' + this.voiceID;
            const maxAttempts = 3;

            for (let i = 0; i < maxAttempts && !this.cancelled; i++) {
                try {
                    const response = await fetch(url, {
                        headers: createHeaders(this.apiKey),
                        method: 'POST',
                        body: JSON.stringify({
                            text: this.textSegments[index],
                        }),
                    });

                    if (response.ok) {
                        buffer = await response.arrayBuffer();
                        cache.set(cacheKey, cloneArrayBuffer(buffer));
                        idb.set(cacheKey, cloneArrayBuffer(buffer));
                        break;
                    }
                } catch (e) {
                    console.error(e);
                }

                await sleep(2000 + i * 5000); // increasing backoff time
            }
        }

        if (buffer) {
            const data = await audioContext.decodeAudioData(buffer);
            this.audios[index] = data;
        }
    }

    private async waitForAudio(index: number, timeoutSeconds = 30) {
        if (!this.initialized) {
            this.createAudio().then(() => { });
        }

        const timeoutAt = Date.now() + timeoutSeconds * 1000;
        while (Date.now() < timeoutAt && !this.cancelled) {
            if (this.audios[index]) {
                return;
            }
            this.emit('buffering');
            await sleep(100);
        }

        this.cancelled = true;
        this.emit('error', new Error('Timed out waiting for audio'));
    }

    public async play(element: HTMLElement, voiceID: string = defaultElevenLabsVoiceID, apiKey = this.apiKey) {
        this.element = element;
        this.voiceID = voiceID;
        this.apiKey = apiKey;

        if (!this.element || !this.voiceID) {
            return;
        }

        this.emit('init');

        if (currentReader != null) {
            await currentReader.stop();
        }
        currentReader = this;

        this.cancelled = false;

        if (!this.textSegments?.length) {
            this.textSegments = this.extractTextSegments();
        }

        await this.next(true);
    }

    private async next(play = false) {
        if (this.cancelled) {
            return;
        }

        if (!play && this.nextTrack === 0) {
            this.emit('done');
            return;
        }

        const currentTrack = this.nextTrack;
        this.currentTrack = currentTrack;

        const nextTrack = (this.nextTrack + 1) % this.textSegments.length;
        this.nextTrack = nextTrack;

        await this.waitForAudio(currentTrack);

        if (this.cancelled) {
            return;
        }

        this.emit('playing');

        try {
            this.currentSource = audioContext.createBufferSource();
            this.currentSource.buffer = this.audios[currentTrack];
            this.currentSource.connect(audioContext.destination);
            this.currentSource.onended = () => {
                this.next();
            };
            this.currentSource.start();
        } catch (e) {
            console.error('failed to play', e);
            this.emit('done');
        }
    }

    public stop() {
        if (this.currentSource) {
            this.currentSource.stop();
        }
        this.audios = [];
        this.textSegments = [];
        this.nextTrack = 0;
        this.cancelled = true;
        this.initialized = false;
        this.emit('done');
    }

    private extractTextSegments() {
        const selector = 'p, li, th, td, blockquote, pre code, h1, h2, h3, h3, h5, h6';
        const nodes = Array.from(this.element?.querySelectorAll(selector) || []);
        const lines: string[] = [];
        const blocks = nodes.filter(node => !node.parentElement?.closest(selector) && node.textContent);
        for (const block of blocks) {
            const tagName = block.tagName.toLowerCase();
            if (tagName === 'p' || tagName === 'li' || tagName === 'blockquote') {
                const sentences = split(block.textContent!);
                for (const sentence of sentences) {
                    lines.push(sentence.raw.trim());
                }
            } else {
                lines.push(block.textContent!.trim());
            }
        }
        return lines.filter(line => line.length);
    }
}

export function ElevenLabsReaderButton(props: { selector: string }) {
    const elevenLabsApiKey = useAppSelector(selectElevenLabsApiKey);
    const dispatch = useAppDispatch();
    const intl = useIntl();

    const voice = useAppSelector(selectVoice);
    
    const [status, setStatus] = useState<'idle' | 'init' | 'playing' | 'buffering'>('idle');
    // const [error, setError] = useState(false);
    const reader = useRef(new ElevenLabsReader());

    useEffect(() => {
        const currentReader = reader.current;

        currentReader.on('init', () => setStatus('init'));
        currentReader.on('playing', () => setStatus('playing'));
        currentReader.on('buffering', () => setStatus('buffering'));
        currentReader.on('error', () => {
            setStatus('idle');
            // setError(true);
        });
        currentReader.on('done', () => setStatus('idle'));

        return () => {
            currentReader.removeAllListeners();
            currentReader.stop();
        };
    }, [props.selector]);

    const onClick = useCallback(() => {
        if (status === 'idle') {
            if (!elevenLabsApiKey?.length) {
                dispatch(openElevenLabsApiKeyPanel());
                return;
            }

            audioContext.resume();
            reader.current.play(document.querySelector(props.selector)!, voice, elevenLabsApiKey);
        } else {
            reader.current.stop();
        }
    }, [dispatch, status, props.selector, elevenLabsApiKey, voice]);

    return (
        <Button variant="subtle" size="sm" compact onClickCapture={onClick} loading={status === 'init'}>
            {status !== 'init' && <i className="fa fa-headphones" />}
            {status === 'idle' && <span>
                <FormattedMessage defaultMessage="Play" description="Label for the button that starts text-to-speech playback" />
            </span>}
            {status === 'buffering' && <span>
                <FormattedMessage defaultMessage="Loading audio..." description="Message indicating that text-to-speech audio is buffering" />
            </span>}
            {status !== 'idle' && status !== 'buffering' && <span>
                <FormattedMessage defaultMessage="Stop" description="Label for the button that stops text-to-speech playback" />
            </span>}
        </Button>
    );
}

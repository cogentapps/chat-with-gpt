import { Button } from "@mantine/core";
import EventEmitter from "events";
import { useCallback, useEffect, useRef, useState } from "react";
import { split } from 'sentence-splitter';
import { cloneArrayBuffer, md5, sleep } from "./utils";
import * as idb from './idb';
import { useAppContext } from "./context";

const endpoint = 'https://api.elevenlabs.io';

export const defaultVoiceList = [
    {
        "voice_id": "21m00Tcm4TlvDq8ikWAM",
        "name": "Rachel",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/6edb9076-c3e4-420c-b6ab-11d43fe341c8.mp3",
    },
    {
        "voice_id": "AZnzlk1XvdvUeBnXmlld",
        "name": "Domi",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/69c5373f-0dc2-4efd-9232-a0140182c0a9.mp3",
    },
    {
        "voice_id": "EXAVITQu4vr4xnSDxMaL",
        "name": "Bella",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/04365bce-98cc-4e99-9f10-56b60680cda9.mp3",
    },
    {
        "voice_id": "ErXwobaYiN019PkySvjV",
        "name": "Antoni",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/38d8f8f0-1122-4333-b323-0b87478d506a.mp3",
    },
    {
        "voice_id": "MF3mGyEYCl7XYWbV9V6O",
        "name": "Elli",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/MF3mGyEYCl7XYWbV9V6O/f9fd64c3-5d62-45cd-b0dc-ad722ee3284e.mp3",
    },
    {
        "voice_id": "TxGEqnHWrfWFTfGW9XjX",
        "name": "Josh",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/TxGEqnHWrfWFTfGW9XjX/c6c80dcd-5fe5-4a4c-a74c-b3fec4c62c67.mp3",
    },
    {
        "voice_id": "VR6AewLTigWG4xSOukaG",
        "name": "Arnold",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/VR6AewLTigWG4xSOukaG/66e83dc2-6543-4897-9283-e028ac5ae4aa.mp3",
    },
    {
        "voice_id": "pNInz6obpgDQGcFmaJgB",
        "name": "Adam",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/e0b45450-78db-49b9-aaa4-d5358a6871bd.mp3",
    },
    {
        "voice_id": "yoZ06aMxZJJ28mfd3POQ",
        "name": "Sam",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/yoZ06aMxZJJ28mfd3POQ/1c4d417c-ba80-4de8-874a-a1c57987ea63.mp3",
    }
];

export const defaultElevenLabsVoiceID = defaultVoiceList.find(voice => voice.name === "Bella")!.voice_id;

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
    const context = useAppContext();
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
            if (!context.apiKeys.elevenlabs?.length) {
                context.settings.open('speech', 'elevenlabs-api-key');
                return;
            }

            const voice = context.voice.id;
            audioContext.resume();
            reader.current.play(document.querySelector(props.selector)!, voice, context.apiKeys.elevenlabs);
        } else {
            reader.current.stop();
        }
    }, [status, props.selector, context.apiKeys.elevenlabs]);

    return (
        <Button variant="subtle" size="sm" compact onClickCapture={onClick} loading={status === 'init'}>
            {status !== 'init' && <i className="fa fa-headphones" />}
            {status === 'idle' && <span>Play</span>}
            {status === 'buffering' && <span>Loading audio...</span>}
            {status !== 'idle' && status !== 'buffering' && <span>Stop</span>}
        </Button>
    );
}

import { AbstractTTSPlayer, TTSPlayerState } from './types';
import { cloneArrayBuffer, md5, sleep } from '../utils';
import { AsyncLoop } from "../utils/async-loop";
import * as idb from '../utils/idb';
import TTSPlugin from './tts-plugin';

export let audioContext = new AudioContext();
export let audioContextInUse = false;

export function resetAudioContext() {
    if (audioContextInUse) {
        const previousAudioContext = audioContext;
        audioContext = new AudioContext();
        audioContextInUse = false;
        setTimeout(() => previousAudioContext.close(), 0);
        setTimeout(() => audioContext.suspend(), 100);
    }
    audioContext.resume();
}

const cache = new Map<string, ArrayBuffer>();

async function getAudioFile(plugin: TTSPlugin<any>, text: string) {
    const voice = await plugin.getCurrentVoice();

    const hash = await md5(text);
    const cacheKey = `audio:${voice?.service}:${voice?.id}:${hash}`;

    let buffer = cache.get(cacheKey);

    if (!buffer) {
        buffer = await idb.get(cacheKey);
    }

    if (!buffer) {
        try {
            const result = await plugin.speakToBuffer(text);
            if (result) {
                buffer = result;
                cache.set(cacheKey, cloneArrayBuffer(buffer));
                idb.set(cacheKey, cloneArrayBuffer(buffer));
                return buffer;
            }
        } catch (e) {
            console.error(e);
        }
    }

    return buffer || null;
}

export default class ExternalTTSAudioFilePlayer extends AbstractTTSPlayer {
    private playing = true;
    private ended = false;
    private requestedSentenceIndex = 0; // sentence index requested by user
    private currentSentenceIndex = 0;
    private startTime = 0;

    private audioArrayBuffers: ArrayBuffer[] = [];

    private downloadLoop: AsyncLoop;
    private schedulerLoop: AsyncLoop;

    private sourceNodes: AudioBufferSourceNode[] = [];
    private durations: number[] = [];
    private duration = 0;

    private destroyed = false;

    constructor(private plugin: TTSPlugin) {
        super();

        this.downloadLoop = new AsyncLoop(this.download, 1000);
        this.schedulerLoop = new AsyncLoop(this.schedule, 100);

        audioContext.resume();

        requestAnimationFrame(async () => {
            audioContext.suspend();

            this.downloadLoop.start();
            this.schedulerLoop.start();
        });

        (window as any).player = this;
    }

    private download = async () => {
        const sentences = [...this.sentences];
        if (!this.complete) {
            sentences.pop();
        }

        const maxSentencesToDownload = this.sourceNodes[this.currentSentenceIndex] ? 2 : 1;

        const sentencesToDownload: number[] = [];
        for (let i = 0; i < sentences.length; i++) {
            if (sentencesToDownload.length >= maxSentencesToDownload) {
                break;
            }
            if (!this.audioArrayBuffers[i]) {
                sentencesToDownload.push(i);
            }
        }

        const files = await Promise.all(sentencesToDownload.map(async sentenceIndex => {
            try {
                const text = sentences[sentenceIndex];
                return await getAudioFile(this.plugin, text);
            } catch (e) {
                console.warn('error downloading tts audio', e);
            }
        }));

        for (let i = 0; i < sentencesToDownload.length; i++) {
            const sentenceIndex = sentencesToDownload[i];
            const file = files[i];
            if (file) {
                this.audioArrayBuffers[sentenceIndex] = file;
            } else {
                await sleep(5000); // back off
            }
        }

        this.emit('state', this.getState());
    }

    private schedule = async () => {
        let time = this.startTime;

        if (this.playing && this.sourceNodes[this.currentSentenceIndex] && audioContext.state === 'suspended') {

            try {
                await this.resumeAudioContext();
            } catch (e: any) {
                console.error(e);
            }
        }

        try {
            for (let i = this.requestedSentenceIndex; i < this.sentences.length; i++) {
                if (this.destroyed) {
                    return;
                }

                const audioArrayBuffer = this.audioArrayBuffers[i];

                if (!audioArrayBuffer) {
                    break;
                }

                if (!this.sourceNodes[i]) {
                    const audioBuffer = await audioContext.decodeAudioData(cloneArrayBuffer(audioArrayBuffer));
                    this.durations[i] = audioBuffer.duration;

                    const sourceNode = audioContext.createBufferSource();
                    sourceNode.buffer = audioBuffer;

                    if (i === this.requestedSentenceIndex) {
                        this.startTime = audioContext.currentTime;
                        time = this.startTime;
                    }

                    sourceNode.start(time);
                    this.duration = time + this.durations[i] - this.startTime;
                    audioContextInUse = true;

                    this.sourceNodes[i] = sourceNode;

                    sourceNode.connect(audioContext.destination);

                    if (this.playing) {
                        await this.resumeAudioContext();
                    }

                    sourceNode.onended = async () => {
                        if (this.destroyed) {
                            return;
                        }

                        this.currentSentenceIndex = i + 1;

                        this.ended = this.complete && this.currentSentenceIndex === this.sentences.length;
                        const isBuffering = !this.ended && !this.sourceNodes[this.currentSentenceIndex];

                        if (this.ended || isBuffering) {
                            await this.suspendAudioContext();
                        }

                        if (this.ended) {
                            this.playing = false;
                        }

                        this.emit('state', this.getState());
                    };

                    this.emit('state', this.getState());
                }

                time += this.durations[i] + 0.25;
            }
        } catch (e: any) {
            console.error(e);
        }
    }

    private async resumeAudioContext() {
        try {
            audioContext.resume();
            await sleep(10);
        } catch (e) {
            console.warn('error resuming audio context', e);
        }
    }

    private async suspendAudioContext() {
        try {
            await audioContext.suspend();
        } catch (e) {
            console.warn('error suspending audio context', e);
        }
    }

    public getState(): TTSPlayerState {
        return {
            playing: this.playing,
            ended: this.ended,
            buffering: this.playing && !this.ended && !this.sourceNodes[this.currentSentenceIndex],
            duration: this.duration,
            length: this.sentences.length,
            ready: this.audioArrayBuffers.filter(Boolean).length,
            index: this.currentSentenceIndex,
            downloadable: this.complete && this.sourceNodes.length === this.sentences.length,
        } as any;
    }

    public async pause() {
        this.playing = false;
        await this.suspendAudioContext();
        this.emit('state', this.getState());
    }

    public async play(index?: number) {
        this.playing = true;

        if (typeof index === 'number') {
            this.requestedSentenceIndex = index;
            this.currentSentenceIndex = index;

            resetAudioContext();

            if (this.sourceNodes.length) {
                resetAudioContext();

                this.sourceNodes = [];
                this.durations = [];
                this.duration = 0;

                this.ended = false;
            }
        } else if (this.ended) {
            await this.play(0);
        } else if (audioContext.currentTime < this.duration) {
            await this.resumeAudioContext();
        } else {
            await this.play(Math.max(0, this.sourceNodes.length - 1));
        }
        this.emit('state', this.getState());
    }

    public destroy() {
        this.playing = false;
        this.destroyed = true;

        this.downloadLoop.cancelled = true;
        this.schedulerLoop.cancelled = true;

        resetAudioContext();

        this.sourceNodes = [];
        this.durations = [];
        this.duration = 0;

        this.removeAllListeners();
    }
}

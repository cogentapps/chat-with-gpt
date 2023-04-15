import EventEmitter from "events";
import { split } from "sentence-splitter";

export interface TTSPlayerState {
    playing: boolean;
    ended: boolean;
    buffering: boolean;
    duration?: number;
    index: number;
    length: number;
    ready?: number;
    downloadable: boolean;
}

export abstract class AbstractTTSPlayer extends EventEmitter {
    private lines: string[] = [];
    protected sentences: string[] = [];
    protected complete = false;

    abstract play(index?: number): Promise<any>;
    abstract pause(): Promise<any>;
    abstract getState(): TTSPlayerState;
    abstract destroy(): any;

    public setText(lines: string[], complete: boolean) {
        this.lines = lines;
        this.complete = complete;
        this.updateSentences();
    }

    private updateSentences() {
        const output: string[] = [];
        for (const line of this.lines) {
            const sentences = split(line);
            for (const sentence of sentences) {
                output.push(sentence.raw.trim());
            }
        }
        this.sentences = output.filter(s => s.length > 0);
    }
}

export interface Voice {
    service: string;
    id: string;
    name?: string;
    sampleAudioURL?: string;
}
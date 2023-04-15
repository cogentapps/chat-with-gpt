import DirectTTSPlugin from "./direct-tts-plugin";
import { AsyncLoop } from "../utils/async-loop";
import { AbstractTTSPlayer } from "./types";
import WebSpeechPlugin from "../../tts-plugins/web-speech";

export default class DirectTTSPlayer extends AbstractTTSPlayer {
    playing = false;
    ended = false;

    private loop: AsyncLoop;
    private currentIndex = 0;
    private currentPlaybackIndex = 0;

    private promises: any[] = [];

    constructor(private plugin: WebSpeechPlugin) {
        super();
        console.log('tts init, directttsplayer');

        this.emit('state', this.getState());

        this.loop = new AsyncLoop(() => this.tick(), 100);
        this.loop.start();
    }

    private async tick() {
        if (!this.playing) {
            return;
        }

        const sentences = [...this.sentences];
        if (!this.complete) {
            sentences.pop();
        }

        if (this.currentPlaybackIndex >= sentences.length) {
            if (this.complete) {
                console.log(`tts finished 1, current index: ${this.currentPlaybackIndex}, sentences length: ${sentences.length}`);
                try {
                    await Promise.all(this.promises);
                } catch (e) {
                    console.error('an error occured while reading text aloud', e);
                }
                console.log(`tts finished 2, current index: ${this.currentPlaybackIndex}, sentences length: ${sentences.length}`);
                this.playing = false;
                this.ended = true;
                this.currentIndex = 0;
                this.currentPlaybackIndex = 0;
                this.promises = [];
                this.emit('state', this.getState());
                return;
            }
        }

        if (this.currentIndex >= sentences.length) {
            return;
        }

        this.ended = false;

        try {
            this.emit('state', this.getState());
            const text = sentences[this.currentIndex];
            console.log(`tts speaking`, text);
            const p = this.plugin.speak(text);
            p.then(() => {
                this.currentPlaybackIndex = this.currentIndex + 1;
            });
            this.promises.push(p);
            this.currentIndex += 1;
        } catch (e) {
            console.error('an error occured while reading text aloud', e);
        }
    }

    async play(index?: number): Promise<any> {
        if (this.playing) {
            await this.plugin.stop();
            this.promises = [];
        }
        
        this.playing = true;
        this.ended = false;
        
        if (typeof index === 'number') {
            this.currentIndex = index;
            this.currentPlaybackIndex = index;
        }

        await this.plugin.resume();

        this.emit('state', this.getState());
    }

    async pause(): Promise<any> {
        await this.plugin.pause();
        this.playing = false;
        this.emit('state', this.getState());
    }

    getState() {
        return {
            playing: this.playing,
            ended: this.ended,
            buffering: this.playing && !this.plugin.isSpeaking(),
            index: this.currentPlaybackIndex,
            length: this.sentences.length,
            downloadable: false,
        }
    }

    async destroy() {
        if (this.playing) {
            this.plugin.stop();
        }
        this.loop.cancelled = true;
        this.playing = false;
        this.removeAllListeners();
    }
}
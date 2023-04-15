import { Voice } from "../core/tts/types";
import DirectTTSPlugin from "../core/tts/direct-tts-plugin";
import { PluginDescription } from "../core/plugins/plugin-description";

export interface WebSpeechPluginOptions {
    voice: string | null;
}

/**
 * Plugin for integrating with the built-in Text-to-Speech service on the user's device via
 * the Web Speech Synthesis API.
 * 
 * If you want to add a plugin to support a cloud-based TTS service, this class is probably
 * not relevant. Consider using ElevenLabsPlugin as an example instead.
 */
export default class WebSpeechPlugin extends DirectTTSPlugin<WebSpeechPluginOptions> {
    static voices: Voice[] = [];

    private rejections: any[] = [];
    private speaking = 0;

    async initialize() {
        await this.getVoices();
        speechSynthesis.onvoiceschanged = () => this.getVoices();
    }

    describe(): PluginDescription {
        const id = "web-speech";
        return {
            id,
            name: "Your Browser's Built-In Text-to-Speech",
            options: [
                {
                    id: "voice",
                    defaultValue: null,

                    displayOnSettingsScreen: "speech",
                    displayAsSeparateSection: true,
                    
                    renderProps: (value, options) => ({
                        type: "select",
                        label: "Voice",
                        options: WebSpeechPlugin.voices.map(v => ({
                            label: v.name!,
                            value: v.id,
                        })),
                        hidden: options.getOption('tts', 'service') !== id,
                    }),
                },
            ],
        }
    }

    async getVoices() {
        WebSpeechPlugin.voices = window.speechSynthesis.getVoices().map(v => ({
            service: 'web-speech',
            id: v.name,
            name: v.name,
        }));
        return WebSpeechPlugin.voices;
    }

    async getCurrentVoice(): Promise<Voice> {
        let voiceID = this.options?.voice;

        const voice = WebSpeechPlugin.voices.find(v => v.id === voiceID);

        if (voice) {
            return voice;
        }

        return WebSpeechPlugin.voices[0];
    }

    speak(text: string, voice?: Voice) {
        return new Promise<void>(async (resolve, reject) => {
            // this.stop();
            this.rejections.push(reject);

            if (!voice) {
                voice = await this.getCurrentVoice();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = window.speechSynthesis.getVoices().find(v => v.name === voice!.id)!;
            
            utterance.onstart = () => {
                this.speaking++;
            };
            utterance.onend = () => {
                this.speaking--;
                resolve();
            }

            speechSynthesis.speak(utterance);
        });
    }

    async pause() {
        if (!speechSynthesis.paused) {
            speechSynthesis.pause();
        }
    }

    async resume() {
        if (speechSynthesis.paused) {
            speechSynthesis.resume();
        }
    }

    async stop() {
        speechSynthesis.cancel();
        this.speaking = 0;
        for (const reject of this.rejections) {
            reject('cancelled');
        }
        this.rejections = [];
    }

    async isSpeaking() {
        return this.speaking > 0;
    }
}
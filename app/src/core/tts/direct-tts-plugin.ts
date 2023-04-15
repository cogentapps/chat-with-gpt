import { Voice } from "./types";
import TTSPlugin from "./tts-plugin";

export default class DirectTTSPlugin<T=any> extends TTSPlugin<T> {
    async speak(text: string, voice?: Voice) {
    }

    async stop() {
    }
}
import Plugin from "../plugins";
import { Voice } from "../tts/types";

export default class TTSPlugin<T=any> extends Plugin<T> {
    async getVoices(): Promise<Voice[]> {
        return [];
    }

    async getCurrentVoice(): Promise<Voice> {
        throw new Error("not implemented");
    }

    async speakToBuffer(text: string, voice?: Voice): Promise<ArrayBuffer | null | undefined> {
        throw new Error("not implemented");
    }
}
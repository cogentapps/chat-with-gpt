import { OptionGroup } from "../core/options/option-group";
import { supportsSpeechRecognition } from "../core/speech-recognition-types";

export const whisperOptions: OptionGroup = {
    id: 'speech-recognition',
    name: "Microphone",
    hidden: !supportsSpeechRecognition,
    options: [
        {
            id: 'use-whisper',
            defaultValue: false,
            displayOnSettingsScreen: "speech",
            displayAsSeparateSection: false,
            renderProps: {
                type: "checkbox",
                label: "Use the OpenAI Whisper API for speech recognition",
                hidden: !supportsSpeechRecognition,
            },
        },
        {
            id: 'show-microphone',
            defaultValue: true,
            displayOnSettingsScreen: "speech",
            displayAsSeparateSection: false,
            renderProps: {
                type: "checkbox",
                label: "Show microphone in message input",
            },
        },
    ],
}
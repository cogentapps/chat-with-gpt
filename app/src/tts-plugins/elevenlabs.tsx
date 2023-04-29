import { FormattedMessage } from "react-intl";
import { PluginDescription } from "../core/plugins/plugin-description";
import TTSPlugin from "../core/tts/tts-plugin";
import { Voice } from "../core/tts/types";
import { defaultElevenLabsVoiceID, defaultVoiceList } from "./elevenlabs-defaults";
import { backend } from "../core/backend";

function isProxySupported() {
    return !!backend.current?.services?.includes('elevenlabs');
}

function shouldUseProxy(apiKey: string | undefined | null) {
    return !apiKey && isProxySupported();
}

function getEndpoint(proxied = false) {
    return proxied ? '/chatapi/proxies/elevenlabs' : 'https://api.elevenlabs.io';
}

function getVoiceFromElevenlabsVoiceObject(v: any) {
    return {
        service: "elevenlabs",
        id: v.voice_id,
        name: v.name,
        sampleAudioURL: v.preview_url,
    };
}

export interface ElevenLabsPluginOptions {
    apiKey: string | null;
    voice: string;
    customVoiceID: string | null;
}

/**
 * Plugin for integrating with ElevenLabs Text-to-Speech service.
 * 
 * If you want to add a plugin to support another cloud-based TTS service, this is a good example
 * to use as a reference.
 */
export default class ElevenLabsPlugin extends TTSPlugin<ElevenLabsPluginOptions> {
    static voices: Voice[] = defaultVoiceList.map(getVoiceFromElevenlabsVoiceObject);

    private proxied = shouldUseProxy(this.options?.apiKey);
    private endpoint = getEndpoint(this.proxied);

    /**
     * The `describe` function is responsible for providing a description of the ElevenLabsPlugin class,
     * including its ID, name, and options.
     * 
     * This information is used to configure the plugin and display its settings on the user interface.
     *
     * In this specific implementation, the `describe` function returns an object containing the plugin's
     * ID ("elevenlabs"), name ("ElevenLabs Text-to-Speech"), and an array of options that can be
     * configured by the user. These options include the API key, voice selection, and custom voice ID.
     * 
     * Each option has its own set of properties, such as default values, display settings, and validation
     * rules, which are used to render the plugin's settings on the user interface and ensure proper
     * configuration.
     */
    describe(): PluginDescription {
        return {
            id: "elevenlabs",
            name: "ElevenLabs Text-to-Speech",
            options: [
                {
                    id: "apiKey",
                    defaultValue: null,

                    displayOnSettingsScreen: "speech",
                    displayAsSeparateSection: true,
                    resettable: false,

                    renderProps: (value, options, context) => ({
                        type: "password",
                        label: context.intl.formatMessage({ defaultMessage: "Your ElevenLabs API Key" }),
                        placeholder: context.intl.formatMessage({ defaultMessage: "Paste your API key here" }),
                        description: <>
                            <p>
                                <FormattedMessage
                                    defaultMessage="Give ChatGPT a realisic human voice by connecting your ElevenLabs account (preview the available voices below). <a>Click here to sign up.</a>"
                                    values={{
                                        a: (chunks: any) => <a href="https://beta.elevenlabs.io" target="_blank" rel="noreferrer">{chunks}</a>
                                    }} />
                            </p>
                            <p>
                                <FormattedMessage defaultMessage="You can find your API key by clicking your avatar or initials in the top right of the ElevenLabs website, then clicking Profile. Your API key is stored only on this device and never transmitted to anyone except ElevenLabs." />
                            </p>
                        </>,
                        hidden: options.getOption('tts', 'service') !== 'elevenlabs',
                    }),
                },
                {
                    id: "voice",
                    defaultValue: defaultElevenLabsVoiceID,

                    displayOnSettingsScreen: "speech",
                    displayAsSeparateSection: true,

                    renderProps: (value, options, context) => {
                        return {
                            type: "select",
                            label: "Voice",
                            disabled: !options.getOption('elevenlabs', 'apiKey') && !isProxySupported(),
                            hidden: options.getOption('tts', 'service') !== 'elevenlabs',
                            options: [
                                ...ElevenLabsPlugin.voices.map(v => ({
                                    label: v.name!,
                                    value: v.id,
                                })),
                                {
                                    label: context.intl.formatMessage({ defaultMessage: "Custom Voice ID" }),
                                    value: 'custom',
                                }
                            ],
                        };
                    },
                },
                {
                    id: "customVoiceID",
                    defaultValue: null,
                    displayOnSettingsScreen: "speech",
                    renderProps: (value, options, context) => {
                        return {
                            type: "text",
                            label: context.intl.formatMessage({ defaultMessage: "Custom Voice ID" }),

                            // hide when custom voice is not selected:
                            disabled: options.getOption('elevenlabs', 'voice') !== 'custom',
                            hidden: options.getOption('elevenlabs', 'voice') !== 'custom' || options.getOption('tts', 'service') !== 'elevenlabs',
                        };
                    },
                    validate: (value, options) => options.getOption('elevenlabs', 'voice') !== 'custom',
                },
            ],
        }
    }

    /**
     * Initializes the plugin by fetching available voices.
     */
    async initialize() {
        await this.getVoices();
    }

    /**
     * Fetches and returns the available voices from ElevenLabs API.
     * This function stores the list of voices in a static variable, which is used elsewhere.
     * @returns {Promise<Voice[]>} A promise that resolves to an array of Voice objects.
     */
    async getVoices(): Promise<Voice[]> {
        const response = await fetch(`${this.endpoint}/v1/voices`, {
            headers: this.createHeaders(),
        });
        const json = await response.json();
        if (json?.voices?.length) {
            ElevenLabsPlugin.voices = json.voices.map(getVoiceFromElevenlabsVoiceObject);
        }
        return ElevenLabsPlugin.voices;
    }

    /**
     * Returns the current voice based on the plugin options.
     * @returns {Promise<Voice>} A promise that resolves to a Voice object.
     */
    async getCurrentVoice(): Promise<Voice> {
        let voiceID = this.options?.voice;

        // If using a custom voice ID, construct a voice object with the provided voice ID
        if (voiceID === 'custom' && this.options?.customVoiceID) {
            return {
                service: 'elevenlabs',
                id: this.options.customVoiceID,
                name: 'Custom Voice',
            };
        }

        // Search for a matching voice object
        const voice = ElevenLabsPlugin.voices.find(v => v.id === voiceID);
        if (voice) {
            return voice;
        }

        // If no matching voice is found, return a default Voice object
        // with the defaultElevenLabsVoiceID and 'elevenlabs' as the service
        return {
            service: 'elevenlabs',
            id: defaultElevenLabsVoiceID,
        };
    }

    /**
     * Converts the given text into speech using the specified voice and returns an audio file as a buffer.
     * @param {string} text The text to be converted to speech.
     * @param {Voice} [voice] The voice to be used for text-to-speech conversion. If not provided, the current voice will be used.
     * @returns {Promise<ArrayBuffer | null>} A promise that resolves to an ArrayBuffer containing the audio data, or null if the conversion fails.
     */
    async speakToBuffer(text: string, voice?: Voice): Promise<ArrayBuffer | null> {
        if (!voice) {
            voice = await this.getCurrentVoice();
        }

        const url = this.endpoint + '/v1/text-to-speech/' + voice.id;

        const response = await fetch(url, {
            headers: this.createHeaders(),
            method: 'POST',
            body: JSON.stringify({
                text,
            }),
        });

        if (response.ok) {
            return await response.arrayBuffer();
        } else {
            return null;
        }
    }

    /**
     * Creates and returns the headers required for ElevenLabs API requests.
     */
    private createHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        }

        if (!this.proxied && this.options?.apiKey) {
            headers['xi-api-key'] = this.options.apiKey;
        }

        return headers;
    }
}
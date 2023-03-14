import SettingsTab from "./tab";
import SettingsOption from "./option";
import { Button, Select, TextInput } from "@mantine/core";
import { useAppDispatch, useAppSelector } from "../../store";
import { selectElevenLabsApiKey, setElevenLabsApiKey } from "../../store/api-keys";
import { useCallback, useEffect, useMemo, useState } from "react";
import { selectVoice, setVoice } from "../../store/voices";
import { getVoices } from "../../tts/elevenlabs";
import { selectSettingsOption } from "../../store/settings-ui";
import { defaultVoiceList } from "../../tts/defaults";
import { FormattedMessage, useIntl } from "react-intl";

export default function SpeechOptionsTab() {
    const intl = useIntl();

    const option = useAppSelector(selectSettingsOption);
    const elevenLabsApiKey = useAppSelector(selectElevenLabsApiKey);
    const voice = useAppSelector(selectVoice);

    const dispatch = useAppDispatch();
    const onElevenLabsApiKeyChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => dispatch(setElevenLabsApiKey(event.target.value)), [dispatch]);
    const onVoiceChange = useCallback((value: string) => dispatch(setVoice(value)), [dispatch]);

    const [voices, setVoices] = useState<any[]>(defaultVoiceList);
    useEffect(() => {
        if (elevenLabsApiKey) {
            getVoices().then(data => {
                if (data?.voices?.length) {
                    setVoices(data.voices);
                }
            });
        }
    }, [elevenLabsApiKey]);

    const apiKeyOption = useMemo(() => (
        <SettingsOption heading={intl.formatMessage({ defaultMessage: 'Your ElevenLabs Text-to-Speech API Key (optional)' })}
                        focused={option === 'elevenlabs-api-key'}>
            <TextInput placeholder={intl.formatMessage({ defaultMessage: "Paste your API key here" })}
                value={elevenLabsApiKey || ''} onChange={onElevenLabsApiKeyChange} />
            <p>
                <FormattedMessage defaultMessage="Give ChatGPT a realisic human voice by connecting your ElevenLabs account (preview the available voices below). <a>Click here to sign up.</a>"
                    values={{
                        a: (chunks: any) => <a href="https://beta.elevenlabs.io" target="_blank" rel="noreferrer">{chunks}</a>
                    }} />
            </p>
            <p>
                <FormattedMessage defaultMessage="You can find your API key by clicking your avatar or initials in the top right of the ElevenLabs website, then clicking Profile. Your API key is stored only on this device and never transmitted to anyone except ElevenLabs." />
            </p>
        </SettingsOption>
    ), [option, elevenLabsApiKey, onElevenLabsApiKeyChange]);

    const voiceOption = useMemo(() => (
        <SettingsOption heading={intl.formatMessage({ defaultMessage: 'Voice' })}
                        focused={option === 'elevenlabs-voice'}>
            <Select
                value={voice}
                onChange={onVoiceChange}
                data={[
                    ...voices.map(v => ({ label: v.name, value: v.voice_id })),
                ]} />
            <audio controls style={{ display: 'none' }} id="voice-preview" key={voice}>
                <source src={voices.find(v => v.voice_id === voice)?.preview_url} type="audio/mpeg" />
            </audio>
            <Button onClick={() => (document.getElementById('voice-preview') as HTMLMediaElement)?.play()} variant='light' compact style={{ marginTop: '1rem' }}>
                <i className='fa fa-headphones' />
                <span>
                    <FormattedMessage defaultMessage="Preview voice" />
                </span>
            </Button>
        </SettingsOption>
    ), [option, voice, voices, onVoiceChange]);

    const elem = useMemo(() => (
        <SettingsTab name="speech">
            {apiKeyOption}
            {voices.length > 0 && voiceOption}
        </SettingsTab>
    ), [apiKeyOption, voiceOption, voices.length]);

    return elem;
}
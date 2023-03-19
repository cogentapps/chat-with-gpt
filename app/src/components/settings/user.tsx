import SettingsTab from "./tab";
import SettingsOption from "./option";
import { Checkbox, TextInput } from "@mantine/core";
import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { selectOpenAIApiKey, setOpenAIApiKeyFromEvent, selectUseOpenAIWhisper, setUseOpenAIWhisperFromEvent } from "../../store/api-keys";
import { selectSettingsOption } from "../../store/settings-ui";
import { FormattedMessage, useIntl } from "react-intl";

export default function UserOptionsTab(props: any) {
    const option = useAppSelector(selectSettingsOption);
    const openaiApiKey = useAppSelector(selectOpenAIApiKey);
    const useOpenAIWhisper = useAppSelector(selectUseOpenAIWhisper);
    const intl = useIntl()

    const dispatch = useAppDispatch();
    const onOpenAIApiKeyChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => dispatch(setOpenAIApiKeyFromEvent(event)), [dispatch]);
    const onUseOpenAIWhisperChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => dispatch(setUseOpenAIWhisperFromEvent(event)), [dispatch]);

    const elem = useMemo(() => (
        <SettingsTab name="user">
            <SettingsOption heading={intl.formatMessage({ defaultMessage: "Your OpenAI API Key", description: "Heading for the OpenAI API key setting on the settings screen" })}
                focused={option === 'openai-api-key'}>
                <TextInput
                    placeholder={intl.formatMessage({ defaultMessage: "Paste your API key here" })}
                    value={openaiApiKey || ''}
                    onChange={onOpenAIApiKeyChange} />
                <p>
                    <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noreferrer">
                        <FormattedMessage defaultMessage="Find your API key here." description="Label for the link that takes the user to the page on the OpenAI website where they can find their API key." />
                    </a>
                </p>

                <Checkbox
                    style={{ marginTop: '1rem' }}
                    id="use-openai-whisper-api" checked={useOpenAIWhisper!} onChange={onUseOpenAIWhisperChange}
                    label="Use the OpenAI Whisper API for speech recognition."
                />

                <p>
                    <FormattedMessage defaultMessage="Your API key is stored only on this device and never transmitted to anyone except OpenAI." />
                </p>
                <p>
                    <FormattedMessage defaultMessage="OpenAI API key usage is billed at a pay-as-you-go rate, separate from your ChatGPT subscription." />
                </p>
            </SettingsOption>
        </SettingsTab>
    ), [option, openaiApiKey, useOpenAIWhisper, onOpenAIApiKeyChange]);

    return elem;
}
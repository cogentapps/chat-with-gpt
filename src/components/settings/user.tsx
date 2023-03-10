import SettingsTab from "./tab";
import SettingsOption from "./option";
import { TextInput } from "@mantine/core";
import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { selectOpenAIApiKey, setOpenAIApiKeyFromEvent } from "../../store/api-keys";
import { selectSettingsOption } from "../../store/settings-ui";

export default function UserOptionsTab(props: any) {
    const option = useAppSelector(selectSettingsOption);
    const openaiApiKey = useAppSelector(selectOpenAIApiKey);

    const dispatch = useAppDispatch();
    const onOpenAIApiKeyChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => dispatch(setOpenAIApiKeyFromEvent(event)), [dispatch]);

    const elem = useMemo(() => (
        <SettingsTab name="user">
            <SettingsOption heading="Your OpenAI API Key" focused={option === 'openai-api-key'}>
                <TextInput
                    placeholder="Paste your API key here"
                    value={openaiApiKey || ''}
                    onChange={onOpenAIApiKeyChange} />
                <p><a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noreferrer">Find your API key here.</a> Your API key is stored only on this device and never transmitted to anyone except OpenAI.</p>
                <p>OpenAI API key usage is billed at a pay-as-you-go rate, separate from your ChatGPT subscription.</p>
            </SettingsOption>
        </SettingsTab>
    ), [option, openaiApiKey, onOpenAIApiKeyChange]);

    return elem;
}
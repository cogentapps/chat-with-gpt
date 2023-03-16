import SettingsTab from "./tab";
import SettingsOption from "./option";
import { Button, Select, Slider, Textarea } from "@mantine/core";
import { useCallback, useMemo } from "react";
import { defaultSystemPrompt, defaultModel } from "../../openai";
import { useAppDispatch, useAppSelector } from "../../store";
import { resetModel, setModel, selectModel, resetSystemPrompt, selectSystemPrompt, selectTemperature, setSystemPrompt, setTemperature } from "../../store/parameters";
import { selectSettingsOption } from "../../store/settings-ui";
import { FormattedMessage, useIntl } from "react-intl";

export default function GenerationOptionsTab(props: any) {
    const intl = useIntl();
    
    const option = useAppSelector(selectSettingsOption);
    const initialSystemPrompt = useAppSelector(selectSystemPrompt);
    const model = useAppSelector(selectModel);
    const temperature = useAppSelector(selectTemperature);

    const dispatch = useAppDispatch();
    const onSystemPromptChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => dispatch(setSystemPrompt(event.target.value)), [dispatch]);
    const onModelChange = useCallback((value: string) => dispatch(setModel(value)), [dispatch]);
    const onResetSystemPrompt = useCallback(() => dispatch(resetSystemPrompt()), [dispatch]);
    const onResetModel = useCallback(() => dispatch(resetModel()), [dispatch]);
    const onTemperatureChange = useCallback((value: number) => dispatch(setTemperature(value)), [dispatch]);

    const resettableSystemPromopt = initialSystemPrompt
        && (initialSystemPrompt?.trim() !== defaultSystemPrompt.trim());

    const resettableModel = model
        && (model?.trim() !== defaultModel.trim());

    const systemPromptOption = useMemo(() => (
        <SettingsOption heading={intl.formatMessage({ defaultMessage: "System Prompt", description: "Heading for the setting that lets users customize the System Prompt, on the settings screen" })}
                        focused={option === 'system-prompt'}>
            <Textarea
                value={initialSystemPrompt || defaultSystemPrompt}
                onChange={onSystemPromptChange}
                minRows={5}
                maxRows={10}
                autosize />
            <p style={{ marginBottom: '0.7rem' }}>
                <FormattedMessage defaultMessage="The System Prompt is shown to ChatGPT by the &quot;System&quot; before your first message. The <code>'{{ datetime }}'</code> tag is automatically replaced by the current date and time."
                    values={{ code: chunk => <code style={{ whiteSpace: 'nowrap' }}>{chunk}</code> }} />
            </p>
            {resettableSystemPromopt && <Button size="xs" compact variant="light" onClick={onResetSystemPrompt}>
                <FormattedMessage defaultMessage="Reset to default" />
            </Button>}
        </SettingsOption>
    ), [option, initialSystemPrompt, resettableSystemPromopt, onSystemPromptChange, onResetSystemPrompt]);

    const modelOption = useMemo(() => (
        <SettingsOption heading={intl.formatMessage({ defaultMessage: "Model", description: "Heading for the setting that lets users choose a model to interact with, on the settings screen" })}
                        focused={option === 'model'}>
            <Select
                value={model || defaultModel}
                data={[
                    {
                        label: intl.formatMessage({ defaultMessage: "GPT 3.5 Turbo (default)" }),
                        value: "gpt-3.5-turbo",
                    },
                    {
                        label: intl.formatMessage({ defaultMessage: "GPT 4 (requires invite)" }),
                        value: "gpt-4",
                    },
                ]}
                onChange={onModelChange} />
            {model === 'gpt-4' && (
                <p style={{ marginBottom: '0.7rem' }}>
                    <FormattedMessage defaultMessage="Note: GPT-4 will only work if your OpenAI account has been granted access to the new model. <a>Request access here.</a>"
                        values={{ a: chunk => <a href="https://openai.com/waitlist/gpt-4-api" target="_blank" rel="noreferer">{chunk}</a> }} />
                </p>
            )}
            {resettableModel && <Button size="xs" compact variant="light" onClick={onResetModel}>
                <FormattedMessage defaultMessage="Reset to default" />
            </Button>}
        </SettingsOption>
    ), [option, model, resettableModel, onModelChange, onResetModel]);

    const temperatureOption = useMemo(() => (
        <SettingsOption heading={intl.formatMessage({
                            defaultMessage: "Temperature: {temperature, number, ::.0}", 
                            description: "Label for the button that opens a modal for setting the 'temperature' (randomness) of AI responses",
                        }, { temperature })}
                        focused={option === 'temperature'}>
            <Slider value={temperature} onChange={onTemperatureChange} step={0.1} min={0} max={1} precision={3} />
            <p>
                <FormattedMessage defaultMessage="The temperature parameter controls the randomness of the AI's responses. Lower values will make the AI more predictable, while higher values will make it more creative." />
            </p>
        </SettingsOption>
    ), [temperature, option, onTemperatureChange]);

    const elem = useMemo(() => (
        <SettingsTab name="options">
            {systemPromptOption}
            {modelOption}
            {temperatureOption}
        </SettingsTab>
    ), [systemPromptOption, modelOption, temperatureOption]);

    return elem;
}
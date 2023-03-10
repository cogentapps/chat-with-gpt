import SettingsTab from "./tab";
import SettingsOption from "./option";
import { Button, Slider, Textarea } from "@mantine/core";
import { useCallback, useMemo } from "react";
import { defaultSystemPrompt } from "../../openai";
import { useAppDispatch, useAppSelector } from "../../store";
import { resetSystemPrompt, selectSystemPrompt, selectTemperature, setSystemPrompt, setTemperature } from "../../store/parameters";
import { selectSettingsOption } from "../../store/settings-ui";

export default function GenerationOptionsTab(props: any) {
    const option = useAppSelector(selectSettingsOption);
    const initialSystemPrompt = useAppSelector(selectSystemPrompt);
    const temperature = useAppSelector(selectTemperature);

    const dispatch = useAppDispatch();
    const onSystemPromptChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => dispatch(setSystemPrompt(event.target.value)), [dispatch]);
    const onResetSystemPrompt = useCallback(() => dispatch(resetSystemPrompt()), [dispatch]);
    const onTemperatureChange = useCallback((value: number) => dispatch(setTemperature(value)), [dispatch]);

    const resettable = initialSystemPrompt
        && (initialSystemPrompt?.trim() !== defaultSystemPrompt.trim());

    const systemPromptOption = useMemo(() => (
        <SettingsOption heading="System Prompt" focused={option === 'system-prompt'}>
            <Textarea
                value={initialSystemPrompt || defaultSystemPrompt}
                onChange={onSystemPromptChange}
                minRows={5}
                maxRows={10}
                autosize />
            <p style={{ marginBottom: '0.7rem' }}>
                The System Prompt is shown to ChatGPT by the "System" before your first message. The <code style={{ whiteSpace: 'nowrap' }}>{'{{ datetime }}'}</code> tag is automatically replaced by the current date and time.
            </p>
            {resettable && <Button size="xs" compact variant="light" onClick={onResetSystemPrompt}>
                Reset to default
            </Button>}
        </SettingsOption>
    ), [option, initialSystemPrompt, resettable, onSystemPromptChange, onResetSystemPrompt]);

    const temperatureOption = useMemo(() => (
        <SettingsOption heading={`Temperature (${temperature.toFixed(1)})`} focused={option === 'temperature'}>
            <Slider value={temperature} onChange={onTemperatureChange} step={0.1} min={0} max={1} precision={3} />
            <p>The temperature parameter controls the randomness of the AI's responses. Lower values will make the AI more predictable, while higher values will make it more creative.</p>
        </SettingsOption>
    ), [temperature, option, onTemperatureChange]);

    const elem = useMemo(() => (
        <SettingsTab name="options">
            {systemPromptOption}
            {temperatureOption}
        </SettingsTab>
    ), [systemPromptOption, temperatureOption]);

    return elem;
}
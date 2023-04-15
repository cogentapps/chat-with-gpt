import { defaultModel } from "../core/chat/openai";
import { OptionGroup } from "../core/options/option-group";

export const parameterOptions: OptionGroup = {
    id: 'parameters',
    options: [
        {
            id: "model",
            defaultValue: defaultModel,
            resettable: false,
            scope: "user",
            displayOnSettingsScreen: "chat",
            displayAsSeparateSection: true,
            displayInQuickSettings: {
                name: "Model",
                displayByDefault: true,
                label: (value) => value,
            },
            renderProps: (value, options, context) => ({
                type: "select",
                label: "Model",
                description: value === 'gpt-4' && context.intl.formatMessage(
                    {
                        defaultMessage: "Note: GPT-4 will only work if your OpenAI account has been granted access to the new model. <a>Request access here.</a>",
                    },
                    { 
                        a: (text: string) => <a href="https://openai.com/waitlist/gpt-4-api" target="_blank" rel="noreferer">{text}</a> 
                    } as any,
                ),
                options: [
                    {
                        label: "GPT 3.5 Turbo (default)",
                        value: "gpt-3.5-turbo",
                    },
                    {
                        label: "GPT 4 (requires invite)",
                        value: "gpt-4",
                    },
                ],
            }),
        },
        {
            id: "temperature",
            defaultValue: 0.5,
            resettable: true,
            scope: "chat",
            displayOnSettingsScreen: "chat",
            displayAsSeparateSection: true,
            displayInQuickSettings: {
                name: "Temperature",
                displayByDefault: false,
                label: (value) => "Temperature: " + value.toFixed(1),
            },
            renderProps: (value, options, context) => ({
                type: "slider",
                label: "Temperature: " + value.toFixed(1),
                min: 0,
                max: 1,
                step: 0.1,
                description: context.intl.formatMessage({ defaultMessage: "The temperature parameter controls the randomness of the AI's responses. Lower values will make the AI more predictable, while higher values will make it more creative." }),
            })
        }
    ]
};
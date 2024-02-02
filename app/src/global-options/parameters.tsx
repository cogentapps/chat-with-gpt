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
                description: value?.includes('32') && context.intl.formatMessage(
                    {
                        defaultMessage: "Note: This model will only work if your OpenAI account has been granted you have been given access to it. <a>Request access here.</a>",
                    },
                    { 
                        a: (text: string) => <a href="https://openai.com/waitlist/gpt-4-api" target="_blank" rel="noreferer">{text}</a> 
                    } as any,
                ),
                options: [
                    {
                        label: "GPT-4 Turbo (128k context)",
                        value: "gpt-4-turbo-preview",
                    },
                    {
                        label: "GPT-4",
                        value: "gpt-4",
                    },
                    {
                        label: "GPT-4 (32k context)",
                        value: "gpt-4-32k",
                    },
                    {
                        label: "GPT-3.5 Turbo",
                        value: "gpt-3.5-turbo",
                    },
                    {
                        label: "GPT 3.5 Turbo (16k context)",
                        value: "gpt-3.5-turbo-16k",
                    }
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
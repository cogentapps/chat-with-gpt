import { FormattedMessage } from "react-intl";
import { OptionGroup } from "../core/options/option-group";

export const openAIOptions: OptionGroup = {
    id: 'openai',
    options: [
        {
            id: 'apiKey',
            defaultValue: "",
            displayOnSettingsScreen: "user",
            displayAsSeparateSection: true,
            renderProps: () => ({
                type: "password",
                label: "Your OpenAI API Key",
                placeholder: "sk-************************************************",
                description: <>
                    <p>
                        <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noreferrer">
                            <FormattedMessage defaultMessage="Find your API key here." description="Label for the link that takes the user to the page on the OpenAI website where they can find their API key." />
                        </a>
                    </p>
                    <p>
                        <FormattedMessage defaultMessage="Your API key is stored only on this device and never transmitted to anyone except OpenAI." />
                    </p>
                    <p>
                        <FormattedMessage defaultMessage="OpenAI API key usage is billed at a pay-as-you-go rate, separate from your ChatGPT subscription." />
                    </p>
                </>,
            }),
        },
    ],
}
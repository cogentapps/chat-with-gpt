import { OptionGroup } from "../core/options/option-group";

export const autoScrollOptions: OptionGroup = {
    id: 'auto-scroll',
    name: "Autoscroll",
    options: [
        {
            id: 'auto-scroll-when-opening-chat',
            defaultValue: false,
            displayOnSettingsScreen: "ui",
            displayAsSeparateSection: false,
            renderProps: {
                type: "checkbox",
                label: "Auto-scroll to the bottom of the page when opening a chat",
            },
        },
        {
            id: 'auto-scroll-while-generating',
            defaultValue: true,
            displayOnSettingsScreen: "ui",
            displayAsSeparateSection: false,
            renderProps: {
                type: "checkbox",
                label: "Auto-scroll while generating a response",
            },
        },
    ],
}

export const inputOptions: OptionGroup = {
    id: 'input',
    name: "Message Input",
    options: [
        {
            id: 'submit-on-enter',
            defaultValue: true,
            displayOnSettingsScreen: "ui",
            displayAsSeparateSection: false,
            displayInQuickSettings: {
                name: "Enable/disable submit message when Enter is pressed",
                displayByDefault: false,
                label: (value) => value ? "Disable submit on Enter" : "Enable submit on Enter",
            },
            renderProps: {
                type: "checkbox",
                label: "Submit message when Enter is pressed",
            },
        },
    ],
}
import type { OptionsManager } from ".";
import { Context } from "../context";
import { RenderProps, RenderPropsBuilder } from "./render-props";

/**
 * Represents an option in the settings UI.
 * @typedef {Object} Option
 * @property {string} id - The unique identifier for the option.
 * @property {any} defaultValue - The default value for the option.
 * @property {'speech' | 'chat' | 'user'} tab - The tab ID in the settings UI where the option will be displayed.
 * @property {boolean} [resettable] - Whether the option can be reset to its default value.
 * @property {'chat' | 'user' | 'browser'} [scope] - Determines how the option value is saved (browser = local storage, user = synced to the user's account across devices, chat = saved for specific chat).
 * @property {boolean} [displayAsSeparateSection] - Whether the option should be displayed inline in the settings UI or as a 'block' with a heading and separate section.
 * @property {RenderProps | RenderPropsBuilder} renderProps - Customizes the appearance of the option's UI in the settings UI, and can see other options and app state.
 * @property {(value: any, options: OptionsManager) => boolean} [validate] - If this function returns false, the defaultValue will be used instead.
 */
export interface Option {
    id: string;
    defaultValue: any;
    scope?: 'chat' | 'user' | 'browser';
    
    displayOnSettingsScreen: 'speech' | 'chat' | 'plugins' | 'ui' | 'user';
    displayAsSeparateSection?: boolean;
    resettable?: boolean;

    renderProps: RenderProps | RenderPropsBuilder;
    validate?: (value: any, options: OptionsManager) => boolean;

    displayInQuickSettings?: {
        name: string;
        displayByDefault?: boolean;
        label: string | ((value: any, options: OptionsManager, context: Context) => string);
    };
}

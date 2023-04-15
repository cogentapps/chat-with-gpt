import type { OptionsManager } from ".";
import type { Context } from "../context";

/**
 * Represents the properties used to render an option in the settings UI.
 * @typedef {Object} RenderProps
 * @property {'text' | 'textarea' | 'select' | 'number' | 'slider' | 'checkbox'} type - The type of input for the option.
 * @property {any} [label] - The label for the option.
 * @property {any} [description] - The description for the option.
 * @property {any} [placeholder] - The placeholder for the option.
 * @property {boolean} [disabled] - Whether the option is disabled in the settings UI.
 * @property {boolean} [hidden] - Whether the option is hidden in the settings UI.
 * @property {number} [step] - The step value for number and slider inputs.
 * @property {number} [min] - The minimum value for number and slider inputs.
 * @property {number} [max] - The maximum value for number and slider inputs.
 * @property {Array<{ label: string; value: string; }>} [options] - The options for the select input.
 */
export interface RenderProps {
    type: 'text' | 'textarea' | 'select' | 'number' | 'slider' | 'checkbox' | 'password';

    label?: any;
    description?: any;
    placeholder?: any;

    disabled?: boolean;
    hidden?: boolean;

    // Number and slider input properties
    step?: number;
    min?: number;
    max?: number;

    // Select input options property
    options?: Array<{ label: string; value: string; }>;
}

/**
 * Represents a function that builds RenderProps based on the current value, options, and context.
 * @typedef {(value: any, options: OptionsManager, context: Context) => RenderProps} RenderPropsBuilder
 */
export type RenderPropsBuilder = ((value: any, options: OptionsManager, context: Context) => RenderProps);
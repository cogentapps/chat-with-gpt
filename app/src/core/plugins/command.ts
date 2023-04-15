import { Context } from "../context";
import { OptionsManager } from "../options";

export interface Command {
    name: string;
    params: Array<{ name: string, type: string }>
    returnType: string;
    run: any;
    disabled?: (options: OptionsManager, context: Context) => boolean;
}
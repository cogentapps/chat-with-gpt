import type { PluginContext } from "./plugin-context";
import type Plugin from ".";
import { pluginMetadata } from "./metadata";
import { registeredPlugins } from "../../plugins";

export async function pluginRunner(name: string, pluginContext: (pluginID: string) => PluginContext, callback: (p: Plugin<any>) => Promise<any>) {
    const startTime = Date.now();

    for (let i = 0; i < registeredPlugins.length; i++) {
        const description = pluginMetadata[i];

        const impl = registeredPlugins[i];
        const plugin = new impl(pluginContext(description.id));

        try {
            await callback(plugin);
        } catch (e) {
            console.warn(`[plugins:${name}] error in ` + description.name, e);
        }
    }

    const runtime = Date.now() - startTime;
    // console.log(`[plugins:${name}] ran all plugins in ${runtime.toFixed(1)} ms`);
}

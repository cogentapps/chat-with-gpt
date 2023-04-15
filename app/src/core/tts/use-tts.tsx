import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAppContext } from "../context";
import { ttsPlugins } from "../plugins/metadata";
import Plugin from "../plugins";
import { AbstractTTSPlayer, TTSPlayerState, Voice } from "./types";
import { createBasicPluginContext } from "../plugins/plugin-context";
import DirectTTSPlayer from "./direct-tts-player";
import DirectTTSPlugin from "./direct-tts-plugin";
import TTSPlugin from "./tts-plugin";
import ExternalTTSAudioFilePlayer from "./audio-file-player";
import { split } from "sentence-splitter";
import { useOption } from "../options/use-option";

function extractTextSegments(element: HTMLElement) {
    const selector = 'p, li, th, td, blockquote, pre code, h1, h2, h3, h3, h5, h6';
    const nodes = Array.from(element.querySelectorAll(selector) || []);
    const lines: string[] = [];
    const blocks = nodes.filter(node => !node.parentElement?.closest(selector) && node.textContent);
    for (const block of blocks) {
        const tagName = block.tagName.toLowerCase();
        if (tagName === 'p' || tagName === 'li' || tagName === 'blockquote') {
            const sentences = split(block.textContent!);
            for (const sentence of sentences) {
                lines.push(sentence.raw.trim());
            }
        } else {
            lines.push(block.textContent!.trim());
        }
    }
    return lines.filter(line => line.length);
}

interface ITTSContext {
    key: string | null;
    voice: Voice | null;
    autoplayEnabled: boolean;
    state?: TTSPlayerState;
    play(index?: number): void;
    pause(): void;
    cancel(): void;
    setSourceElement(key: string, element: HTMLElement | null): void;
    setComplete(complete: boolean): void;
}

export function useTTSPlayerState(): ITTSContext {
    const context = useAppContext();

    const [ttsPluginID] = useOption<string>('tts', 'service');
    const [autoplayEnabled] = useOption<boolean>('tts', 'autoplay');
    const [voiceID] = useOption<string>(ttsPluginID, 'voice');

    const voice = useMemo(() => ({
        service: ttsPluginID,
        id: voiceID,
    }), [ttsPluginID, voiceID]);
    
    const ttsPluginImpl = useMemo(() => {
        const ttsPluginIndex = ttsPlugins.findIndex(p => new p().describe().id === ttsPluginID) || 0;
        return ttsPlugins[ttsPluginIndex];
    }, [ttsPluginID]);

    const plugin = useRef<Plugin|null>(null);
    const player = useRef<AbstractTTSPlayer|null>(null);
    const elementRef = useRef<HTMLElement|null>(null);

    const [key, setKey] = useState<string|null>(null);
    const [state, setState] = useState(() => player.current?.getState());
    const [complete, setComplete] = useState(false);

    const timer = useRef<any>();

    const setSourceElement = useCallback((newKey: string | null, element: HTMLElement | null) => {
        elementRef.current = element;

        if (key !== newKey || !element) {
            plugin.current = null;
            player.current?.destroy();
            player.current = null;
        }

        setKey(newKey);

        if (element) {
            if (!plugin.current) {
                const pluginContext = createBasicPluginContext(ttsPluginID, context.chat.options, context.id, context.currentChat.chat)
                plugin.current = new ttsPluginImpl(pluginContext);
            }

            if (!player.current) {
                if (plugin.current instanceof DirectTTSPlugin) {
                    player.current = new DirectTTSPlayer(plugin.current as any);
                } else if (plugin.current instanceof TTSPlugin) {
                    player.current = new ExternalTTSAudioFilePlayer(plugin.current);
                }

                player.current!.on('state', setState);
            }
        } else {
            setState(undefined);
        }
    }, [ttsPluginID, context, complete, key]);

    useEffect(() => {
        setSourceElement(null, null);
    }, [ttsPluginID, voiceID]);

    useEffect(() => {
        clearInterval(timer.current);

        const update = () => {
            if (!player.current || !elementRef.current) {
                return;
            }

            player.current.setText(extractTextSegments(elementRef.current), complete);
        };

        update();

        if (!complete) {
            timer.current = setInterval(update, 1000);
        }
    }, [key, complete]);

    return {
        key,
        voice: voiceID ? voice : null,
        autoplayEnabled,
        state: !state?.ended ? state : undefined,
        play(index?: number) {
            player.current?.play(index);
        },
        pause() {
            player.current?.pause();
        },
        cancel() {
            setSourceElement(null, null);
        },
        setSourceElement,
        setComplete,
    }
}

const TTSContext = createContext<ITTSContext>({
    key: null,
    voice: null,
    autoplayEnabled: false,
    play() {},
    pause() {},
    cancel() {},
    setSourceElement() {},
    setComplete() {},
});

export function useTTS() {
    return useContext(TTSContext);
}

export function TTSContextProvider(props: { children: React.ReactNode }) {
    const context = useTTSPlayerState();
    return <TTSContext.Provider value={context}>{props.children}</TTSContext.Provider>;
}
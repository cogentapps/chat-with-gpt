import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { backend } from "./backend";
import ChatManagerInstance, { ChatManager } from "./chat-manager";
import { defaultElevenLabsVoiceID } from "./elevenlabs";

export interface Context {
    authenticated: boolean;
    chat: ChatManager;
    apiKeys: {
        openai: string | undefined | null;
        setOpenAIApiKey: (apiKey: string | null) => void;
        elevenlabs: string | undefined | null;
        setElevenLabsApiKey: (apiKey: string | null) => void;
    };
    settings: {
        tab: string | undefined | null;
        option: string | undefined | null;
        open: (tab: string, option?: string | undefined | null) => void;
        close: () => void;
    };
    voice: {
        id: string;
        setVoiceID: (id: string) => void;
    }
}

const AppContext = React.createContext<Context>({} as any);

export function useCreateAppContext(): Context {
    const chat = useRef(ChatManagerInstance);
    const [authenticated, setAuthenticated] = useState(backend?.isAuthenticated || false);

    const updateAuth = useCallback((authenticated: boolean) => setAuthenticated(authenticated), []);

    useEffect(() => {
        backend?.on('authenticated', updateAuth);
        return () => {
            backend?.off('authenticated', updateAuth)
        };
    }, [backend]);

    const [openaiApiKey, setOpenAIApiKey] = useState<string | null>(
        localStorage.getItem('openai-api-key') || ''
    );
    const [elevenLabsApiKey, setElevenLabsApiKey] = useState<string | null>(
        localStorage.getItem('elevenlabs-api-key') || ''
    );

    useEffect(() => {
        localStorage.setItem('openai-api-key', openaiApiKey || '');
    }, [openaiApiKey]);

    useEffect(() => {
        localStorage.setItem('elevenlabs-api-key', elevenLabsApiKey || '');
    }, [elevenLabsApiKey]);

    const [settingsTab, setSettingsTab] = useState<string | null | undefined>();
    const [option, setOption] = useState<string | null | undefined>();

    const [voiceID, setVoiceID] = useState(localStorage.getItem('voice-id') || defaultElevenLabsVoiceID);

    useEffect(() => {
        localStorage.setItem('voice-id', voiceID);
    }, [voiceID]);

    const context = useMemo<Context>(() => ({
        authenticated,
        chat: chat.current,
        apiKeys: {
            openai: openaiApiKey,
            elevenlabs: elevenLabsApiKey,
            setOpenAIApiKey,
            setElevenLabsApiKey,
        },
        settings: {
            tab: settingsTab,
            option: option,
            open: (tab: string, option?: string | undefined | null) => {
                setSettingsTab(tab);
                setOption(option);
            },
            close: () => {
                setSettingsTab(null);
                setOption(null);
            },
        },
        voice: {
            id: voiceID,
            setVoiceID,
        },
    }), [chat, authenticated, openaiApiKey, elevenLabsApiKey, settingsTab, option, voiceID]);

    return context;
}

export function useAppContext() {
    return React.useContext(AppContext);
}

export function AppContextProvider(props: { children: React.ReactNode }) {
    const context = useCreateAppContext();
    return <AppContext.Provider value={context}>{props.children}</AppContext.Provider>;
}
import { useDebouncedValue } from "@mantine/hooks";
import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { backend } from "./backend";
import ChatManagerInstance, { ChatManager } from "./chat-manager";
import { defaultElevenLabsVoiceID } from "./elevenlabs";
import { loadParameters, saveParameters } from "./parameters";
import { Message, Parameters } from "./types";
import { useChat, UseChatResult } from "./use-chat";

export interface Context {
    authenticated: boolean;
    chat: ChatManager;
    id: string | undefined | null;
    currentChat: UseChatResult;
    isShare: boolean;
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
    };
    generating: boolean;
    message: string;
    parameters: Parameters;
    setMessage: (message: string, parentID?: string) => void;
    setParameters: (parameters: Parameters) => void;
    onNewMessage: (message?: string) => Promise<boolean>;
    regenerateMessage: (message: Message) => Promise<boolean>;
    editMessage: (message: Message, content: string) => Promise<boolean>;
}

const AppContext = React.createContext<Context>({} as any);

export function useCreateAppContext(): Context {
    const { id } = useParams();
    const pathname = useLocation().pathname;
    const isShare = pathname.startsWith('/s/');
    const navigate = useNavigate();

    const chatManager = useRef(ChatManagerInstance);
    const currentChat = useChat(chatManager.current, id, isShare);
    const [authenticated, setAuthenticated] = useState(backend.current?.isAuthenticated || false);

    const updateAuth = useCallback((authenticated: boolean) => setAuthenticated(authenticated), []);

    useEffect(() => {
        backend.current?.on('authenticated', updateAuth);
        return () => {
            backend.current?.off('authenticated', updateAuth)
        };
    }, [updateAuth]);

    const [openaiApiKey, setOpenAIApiKey] = useState<string | null>(
        localStorage.getItem('openai-api-key') || ''
    );
    const [elevenLabsApiKey, setElevenLabsApiKey] = useState<string | null>(
        localStorage.getItem('elevenlabs-api-key') || ''
    );

    useEffect(() => {
        if (openaiApiKey) {
            localStorage.setItem('openai-api-key', openaiApiKey || '');
        }
    }, [openaiApiKey]);

    useEffect(() => {
        if (elevenLabsApiKey) {
            localStorage.setItem('elevenlabs-api-key', elevenLabsApiKey || '');
        }
    }, [elevenLabsApiKey]);

    const [settingsTab, setSettingsTab] = useState<string | null | undefined>();
    const [option, setOption] = useState<string | null | undefined>();

    const [voiceID, setVoiceID] = useState(localStorage.getItem('voice-id') || defaultElevenLabsVoiceID);

    useEffect(() => {
        localStorage.setItem('voice-id', voiceID);
    }, [voiceID]);

    const [generating, setGenerating] = useState(false);

    const [message, setMessage] = useState('');

    const [_parameters, setParameters] = useState<Parameters>(loadParameters(id));
    useEffect(() => {
        setParameters(loadParameters(id));
    }, [id]);

    const [parameters] = useDebouncedValue(_parameters, 2000);
    useEffect(() => {
        if (id) {
            saveParameters(id, parameters);
        }
        saveParameters('', parameters);
    }, [id, parameters]);

    const onNewMessage = useCallback(async (message?: string) => {
        if (isShare) {
            return false;
        }

        if (!message?.trim().length) {
            return false;
        }

        if (!openaiApiKey) {
            setSettingsTab('user');
            setOption('openai-api-key');
            return false;
        }

        setGenerating(true);

        if (id) {
            await chatManager.current.sendMessage({
                chatID: id,
                content: message.trim(),
                requestedParameters: {
                    ...parameters,
                    apiKey: openaiApiKey,
                },
                parentID: currentChat.leaf?.id,
            });
        } else {
            const id = await chatManager.current.createChat();
            await chatManager.current.sendMessage({
                chatID: id,
                content: message.trim(),
                requestedParameters: {
                    ...parameters,
                    apiKey: openaiApiKey,
                },
                parentID: currentChat.leaf?.id,
            });
            navigate('/chat/' + id);
        }

        setTimeout(() => setGenerating(false), 4000);

        return true;
    }, [chatManager, openaiApiKey, id, parameters, currentChat.leaf, navigate, isShare]);

    const regenerateMessage = useCallback(async (message: Message) => {
        if (isShare) {
            return false;
        }

        if (!openaiApiKey) {
            setSettingsTab('user');
            setOption('openai-api-key');
            return false;
        }

        setGenerating(true);

        await chatManager.current.regenerate(message, {
            ...parameters,
            apiKey: openaiApiKey,
        });

        setTimeout(() => setGenerating(false), 4000);

        return true;
    }, [chatManager, openaiApiKey, parameters, isShare]);

    const editMessage = useCallback(async (message: Message, content: string) => {
        if (isShare) {
            return false;
        }

        if (!content?.trim().length) {
            return false;
        }

        if (!openaiApiKey) {
            setSettingsTab('user');
            setOption('openai-api-key');
            return false;
        }

        setGenerating(true);

        if (id) {
            await chatManager.current.sendMessage({
                chatID: id,
                content: content.trim(),
                requestedParameters: {
                    ...parameters,
                    apiKey: openaiApiKey,
                },
                parentID: message.parentID,
            });
        } else {
            const id = await chatManager.current.createChat();
            await chatManager.current.sendMessage({
                chatID: id,
                content: content.trim(),
                requestedParameters: {
                    ...parameters,
                    apiKey: openaiApiKey,
                },
                parentID: message.parentID,
            });
            navigate('/chat/' + id);
        }

        setTimeout(() => setGenerating(false), 4000);

        return true;
    }, [chatManager, openaiApiKey, id, parameters, isShare, navigate]);

    const context = useMemo<Context>(() => ({
        authenticated,
        id,
        chat: chatManager.current,
        currentChat,
        isShare,
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
        generating,
        message,
        parameters,
        setMessage,
        setParameters,
        onNewMessage,
        regenerateMessage,
        editMessage,
    }), [chatManager, authenticated, openaiApiKey, elevenLabsApiKey, settingsTab, option, voiceID,
        generating, message, parameters, onNewMessage, regenerateMessage, editMessage, currentChat,
        id, isShare]);

    return context;
}

export function useAppContext() {
    return React.useContext(AppContext);
}

export function AppContextProvider(props: { children: React.ReactNode }) {
    const context = useCreateAppContext();
    return <AppContext.Provider value={context}>{props.children}</AppContext.Provider>;
}
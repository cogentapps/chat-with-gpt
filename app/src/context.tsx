import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { backend } from "./backend";
import ChatManagerInstance, { ChatManager } from "./chat-manager";
import store, { useAppDispatch } from "./store";
import { openOpenAIApiKeyPanel } from "./store/settings-ui";
import { Message } from "./types";
import { useChat, UseChatResult } from "./use-chat";

export interface Context {
    authenticated: boolean;
    chat: ChatManager;
    id: string | undefined | null;
    currentChat: UseChatResult;
    isHome: boolean;
    isShare: boolean;
    generating: boolean;
    onNewMessage: (message?: string) => Promise<boolean>;
    regenerateMessage: (message: Message) => Promise<boolean>;
    editMessage: (message: Message, content: string) => Promise<boolean>;
}

const AppContext = React.createContext<Context>({} as any);

export function useCreateAppContext(): Context {
    const { id } = useParams();
    const dispatch = useAppDispatch();
    
    const pathname = useLocation().pathname;
    const isHome = pathname === '/';
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

    const onNewMessage = useCallback(async (message?: string) => {
        if (isShare) {
            return false;
        }

        if (!message?.trim().length) {
            return false;
        }

        const openaiApiKey = store.getState().apiKeys.openAIApiKey;

        if (!openaiApiKey) {
            dispatch(openOpenAIApiKeyPanel());
            return false;
        }

        const parameters = store.getState().parameters;

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

        return true;
    }, [dispatch, chatManager, id, currentChat.leaf, navigate, isShare]);

    const regenerateMessage = useCallback(async (message: Message) => {
        if (isShare) {
            return false;
        }

        const openaiApiKey = store.getState().apiKeys.openAIApiKey;

        if (!openaiApiKey) {
            dispatch(openOpenAIApiKeyPanel());
            return false;
        }

        const parameters = store.getState().parameters;

        await chatManager.current.regenerate(message, {
            ...parameters,
            apiKey: openaiApiKey,
        });

        return true;
    }, [dispatch, chatManager, isShare]);

    const editMessage = useCallback(async (message: Message, content: string) => {
        if (isShare) {
            return false;
        }

        if (!content?.trim().length) {
            return false;
        }

        const openaiApiKey = store.getState().apiKeys.openAIApiKey;

        if (!openaiApiKey) {
            dispatch(openOpenAIApiKeyPanel());
            return false;
        }

        const parameters = store.getState().parameters;

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

        return true;
    }, [dispatch, chatManager, id, isShare, navigate]);

    const generating = currentChat?.messagesToDisplay?.length > 0
        ? !currentChat.messagesToDisplay[currentChat.messagesToDisplay.length - 1].done
        : false;

    const context = useMemo<Context>(() => ({
        authenticated,
        id,
        chat: chatManager.current,
        currentChat,
        isHome,
        isShare,
        generating,
        onNewMessage,
        regenerateMessage,
        editMessage,
    }), [chatManager, authenticated, generating, onNewMessage, regenerateMessage, editMessage, currentChat, id, isShare]);

    return context;
}

export function useAppContext() {
    return React.useContext(AppContext);
}

export function AppContextProvider(props: { children: React.ReactNode }) {
    const context = useCreateAppContext();
    return <AppContext.Provider value={context}>{props.children}</AppContext.Provider>;
}
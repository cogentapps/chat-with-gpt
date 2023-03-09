import { useCallback, useEffect, useState } from "react";
import { backend } from "./backend";
import { ChatManager } from "./chat-manager";
import { Chat, Message } from './types';

export interface UseChatResult {
    chat: Chat | null | undefined;
    chatLoadedAt: number;
    messages: Message[];
    messagesToDisplay: Message[];
    leaf: Message | null | undefined;
}

export function useChat(chatManager: ChatManager, id: string | undefined | null, share = false): UseChatResult {
    const [chat, setChat] = useState<Chat | null | undefined>(null);
    const [_, setVersion] = useState(0);

    // used to prevent auto-scroll when chat is first opened
    const [chatLoadedAt, setLoadedAt] = useState(0);

    const update = useCallback(async () => {
        if (id) {
            if (!share) {
                const c = chatManager.get(id);
                if (c) {
                    setChat(c);
                    setVersion(v => v + 1);
                    return;
                }
            } else {
                const c = await backend.current?.getSharedChat(id);
                if (c) {
                    setChat(c);
                    setVersion(v => v + 1);
                    return;
                }
            }
        }
        setChat(null);
    }, [id, share, chatManager]);

    useEffect(() => {
        if (id) {
            update();
            chatManager.on(id, update);
            setChat(chatManager.get(id));
            setLoadedAt(Date.now());
        } else {
            setChat(null);
            setLoadedAt(0);
        }
        return () => {
            if (id) {
                chatManager.off(id, update);
            }
        };
    }, [id, update, chatManager]);

    const leaf = chat?.messages.mostRecentLeaf();

    let messages: Message[] = [];
    let messagesToDisplay: Message[] = [];

    if (leaf) {
        messages = (chat?.messages.getMessageChainTo(leaf?.id) || []);
        messagesToDisplay = messages.filter(m => ['user', 'assistant'].includes(m.role)) || [];
    }

    return {
        chat,
        chatLoadedAt,
        messages,
        messagesToDisplay,
        leaf,
    };
}
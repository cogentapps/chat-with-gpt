import { useCallback, useEffect, useState } from "react";
import { backend } from "./backend";
import { useAppContext } from "./context";
import { Chat, Message } from './types';

export function useChat(id: string | undefined | null, share = false) {
    const context = useAppContext();
    const [chat, setChat] = useState<Chat | null | undefined>(null);
    const [version, setVersion] = useState(0);

    // used to prevent auto-scroll when chat is first opened
    const [chatLoadedAt, setLoadedAt] = useState(0);

    const update = useCallback(async () => {
        if (id) {
            if (!share) {
                const c = context.chat.get(id);
                if (c) {
                    setChat(c);
                    setVersion(v => v + 1);
                    return;
                }
            } else {
                const c = await backend?.getSharedChat(id);
                if (c) {
                    setChat(c);
                    setVersion(v => v + 1);
                    return;
                }
            }
        }
        setChat(null);
    }, [id, share]);

    useEffect(() => {
        if (id) {
            update();
            context.chat.on(id, update);
            setChat(context.chat.get(id));
            setLoadedAt(Date.now());
        } else {
            setChat(null);
            setLoadedAt(0);
        }
        return () => {
            if (id) {
                context.chat.off(id, update);
            }
        };
    }, [id, update]);

    const leaf = chat?.messages.mostRecentLeaf();

    let messages: Message[] = [];

    if (leaf) {
        messages = (chat?.messages.getMessageChainTo(leaf?.id) || [])
            .filter(m => ['user', 'assistant'].includes(m.role)) || [];
    }

    return {
        chat,
        chatLoadedAt,
        messages,
        leaf,
    };
}
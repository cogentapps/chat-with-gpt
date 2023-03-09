import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "./context";

export function useChatSpotlightProps() {
    const navigate = useNavigate();
    const context = useAppContext();

    const [version, setVersion] = useState(0);

    useEffect(() => {
        context.chat.on('update', () => setVersion(v => v + 1));
    }, [context.chat]);

    const search = useCallback((query: string) => {
        return context.chat.search.query(query)
            .map((result: any) => ({
                ...result,
                onTrigger: () => navigate('/chat/' + result.chatID + (result.messageID ? '#msg-' + result.messageID : '')),
            }))
    }, [context.chat, navigate, version]); // eslint-disable-line react-hooks/exhaustive-deps

    const props = useMemo(() => ({
        shortcut: ['mod + P'],
        overlayColor: '#000000',
        searchPlaceholder: 'Search your chats',
        searchIcon: <i className="fa fa-search" />,
        actions: search,
        filter: (query: string, items: any) => items,
    }), [search]);

    return props;
}
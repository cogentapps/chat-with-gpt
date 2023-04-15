import { useCallback, useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "./core/context";

export function useChatSpotlightProps() {
    const navigate = useNavigate();
    const { chat } = useAppContext();
    const intl = useIntl();

    const [version, setVersion] = useState(0);

    useEffect(() => {
        const handleUpdate = () => setVersion(v => v + 1);
        chat.on('update', handleUpdate);
        return () => {
            chat.off('update', handleUpdate);
        };
    }, [chat]);

    const search = useCallback((query) => {
        return chat.searchChats(query)
            .map((result) => ({
                ...result,
                onTrigger: () => navigate(`/chat/${result.chatID}${result.messageID ? `#msg-${result.messageID}` : ''}`),
            }))
    }, [chat, navigate, version]);

    const props = useMemo(() => ({
        shortcut: ['/'],
        overlayColor: '#000000',
        searchPlaceholder: intl.formatMessage({ defaultMessage: 'Search your chats' }),
        searchIcon: <i className="fa fa-search" />,
        actions: search,
        filter: (query, items) => items,
    }), [search]);

    return props;
}
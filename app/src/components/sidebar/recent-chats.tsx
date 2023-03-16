import styled from '@emotion/styled';
import { useCallback, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context';
import { useAppDispatch } from '../../store';
import { toggleSidebar } from '../../store/sidebar';

const Container = styled.div`
    margin: calc(1.618rem - 1rem);
    margin-top: -0.218rem;
`;

const Empty = styled.p`
    text-align: center;
    font-size: 0.8rem;
    padding: 2rem;
`;

const ChatList = styled.div``;

const ChatListItem = styled(Link)`
    display: block;
    padding: 0.4rem 1rem;
    margin: 0.218rem 0;
    line-height: 1.7;
    text-decoration: none;
    border-radius: 0.25rem;

    &:hover, &:focus, &:active {
        background: rgba(0, 0, 0, 0.1);
    }

    &.selected {
        background: #2b3d54;
    }

    &, * {
        color: white;
    }

    strong {
        display: block;
        font-weight: 400;
        font-size: 1rem;
        line-height: 1.6;
    }

    p {
        font-size: 0.8rem;
        font-weight: 200;
        opacity: 0.8;
    }
`;

export default function RecentChats(props: any) {
    const context = useAppContext();
    const dispatch = useAppDispatch();

    const currentChatID = context.currentChat.chat?.id;
    const recentChats = context.chat.search.query('');

    const onClick = useCallback(() => {
        if (window.matchMedia('(max-width: 40em)').matches) {
            dispatch(toggleSidebar());
        }
    }, [dispatch]);

    useEffect(() => {
        if (currentChatID) {
            const el = document.querySelector(`[data-chat-id="${currentChatID}"]`);
            if (el) {
                el.scrollIntoView();
            }
        }
    }, [currentChatID]);

    return (
        <Container>
            {recentChats.length > 0 && <ChatList>
                {recentChats.map(c => (
                    <ChatListItem key={c.chatID}
                                  to={'/chat/' + c.chatID}
                                  onClick={onClick}
                                  data-chat-id={c.chatID}
                                  className={c.chatID === currentChatID ? 'selected' : ''}>
                        <strong>{c.title || <FormattedMessage defaultMessage={"Untitled"} description="default title for untitled chat sessions" />}</strong>
                    </ChatListItem>
                ))}
            </ChatList>}
            {recentChats.length === 0 && <Empty>
                <FormattedMessage defaultMessage={"No chats yet."} description="Message shown on the Chat History screen for new users who haven't started their first chat session" />
            </Empty>}
        </Container>
    );
}
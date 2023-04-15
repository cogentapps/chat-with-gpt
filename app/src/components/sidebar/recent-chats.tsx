import styled from '@emotion/styled';
import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../core/context';
import { useAppDispatch } from '../../store';
import { toggleSidebar } from '../../store/sidebar';
import { ActionIcon, Button, Loader, Menu, TextInput, Textarea } from '@mantine/core';
import { useModals } from '@mantine/modals';
import { backend } from '../../core/backend';

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

const ChatListItemLink = styled(Link)`
    display: block;
    position: relative;
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

    strong {
        display: block;
        font-weight: 400;
        font-size: 1rem;
        line-height: 1.6;
        padding-right: 1rem;
        color: white;
    }

    p {
        font-size: 0.8rem;
        font-weight: 200;
        opacity: 0.8;
    }

    .mantine-ActionIcon-root {
        position: absolute;
        right: 0.0rem;
        top: 50%;
        margin-top: -22px;
        opacity: 0;
    }

    &:hover {
        .mantine-ActionIcon-root {
            opacity: 1;
        }
    }
`;

function ChatListItem(props: { chat: any, onClick: any, selected: boolean }) {
    const c = props.chat;
    const context = useAppContext();
    const modals = useModals();
    const navigate = useNavigate();

    const onDelete = useCallback((e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        
        modals.openConfirmModal({
            title: "Are you sure you want to delete this chat?",
            children: <p style={{ lineHeight: 1.7 }}>The chat "{c.title}" will be permanently deleted. This cannot be undone.</p>,
            labels: {
                confirm: "Delete permanently",
                cancel: "Cancel",
            },
            confirmProps: {
                color: 'red',
            },
            onConfirm: async () => {
                try {
                    await backend.current?.deleteChat(c.chatID);
                    context.chat.deleteChat(c.chatID);
                    navigate('/');
                } catch (e) {
                    console.error(e);
                    modals.openConfirmModal({
                        title: "Something went wrong",
                        children: <p style={{ lineHeight: 1.7 }}>The chat "{c.title}" could not be deleted.</p>,
                        labels: {
                            confirm: "Try again",
                            cancel: "Cancel",
                        },
                        onConfirm: () => onDelete(),
                    });
                }
            },
        });
    }, [c.chatID, c.title]);

    const onRename = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Display a modal with a TextInput
        modals.openModal({
            title: "Rename chat",
            children: <div>
                <Textarea
                    id="chat-title"
                    defaultValue={c.title}
                    maxLength={500}
                    autosize
                    required />
                <Button
                    fullWidth
                    variant="light" 
                    style={{ marginTop: '1rem' }}
                    onClick={() => {
                        const title = document.querySelector<HTMLInputElement>('#chat-title')?.value?.trim();
                        const ychat = context.chat.doc.getYChat(c.chatID);
                        if (ychat && title && title !== ychat?.title) {
                            ychat.title = title;
                        }
                        modals.closeAll();
                    }}
                >
                    Save changes
                </Button>
            </div>,
        });
    }, [c.chatID, c.title]);

    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuOpen(open => !open);
    }, []);

    return (
        <ChatListItemLink to={'/chat/' + c.chatID}
            onClick={props.onClick}
            data-chat-id={c.chatID}
            className={props.selected ? 'selected' : ''}>
            <strong>{c.title || <FormattedMessage defaultMessage={"Untitled"} description="default title for untitled chat sessions" />}</strong>
            <Menu opened={menuOpen} 
                    closeOnClickOutside={true} 
                    closeOnEscape={true}
                    onClose={() => setMenuOpen(false)}>
                <Menu.Target>
                    <ActionIcon size="xl" onClick={toggleMenu}>
                        <i className="fas fa-ellipsis" />
                    </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item onClick={onRename} icon={<i className="fa fa-edit" />}>
                        <FormattedMessage defaultMessage={"Rename this chat"} />
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item onClick={onDelete} color="red" icon={<i className="fa fa-trash" />}>
                        <FormattedMessage defaultMessage={"Delete this chat"} />
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </ChatListItemLink>
    );
}

export default function RecentChats(props: any) {
    const context = useAppContext();
    const dispatch = useAppDispatch();

    const currentChatID = context.currentChat.chat?.id;
    const recentChats = context.chat.searchChats('');

    const onClick = useCallback((e: React.MouseEvent) => {
        if (e.currentTarget.closest('button')) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

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

    const synced = !backend.current || backend.current?.isSynced();

    return (
        <Container>
            {recentChats.length > 0 && <ChatList>
                {recentChats.map(c => (
                    <ChatListItem key={c.chatID} chat={c} onClick={onClick} selected={c.chatID === currentChatID} />
                ))}
            </ChatList>}
            {recentChats.length === 0 && !synced && <Empty>
                <Loader size="sm" variant="dots" />
            </Empty>}
            {recentChats.length === 0 && synced && <Empty>
                <FormattedMessage defaultMessage={"No chats yet."} description="Message shown on the Chat History screen for new users who haven't started their first chat session" />
            </Empty>}
        </Container>
    );
}
import styled from '@emotion/styled';
import slugify from 'slugify';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Drawer, Loader } from '@mantine/core';
import { SpotlightProvider } from '@mantine/spotlight';

import { Parameters } from '../types';
import MessageInput from './input';
import Header from './header';
import SettingsScreen from './settings-screen';

import { useChatSpotlightProps } from '../spotlight';
import { useChat } from '../use-chat';
import Message from './message';
import { loadParameters, saveParameters } from '../parameters';
import { useAppContext } from '../context';
import { useDebouncedValue } from '@mantine/hooks';
import { APP_NAME } from '../values';
import { backend } from '../backend';

const Container = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #292933;
    color: white;
`;

const Messages = styled.div`
    max-height: 100%;
    overflow-y: scroll;
`;

const EmptyMessage = styled.div`
    min-height: 70vh;
    padding-bottom: 10vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-family: "Work Sans", sans-serif;
    line-height: 1.7;
    gap: 1rem;
`;

function Empty(props: { loading?: boolean }) {
    const context = useAppContext();
    return (
        <EmptyMessage>
            {props.loading && <Loader variant="dots" />}
            {!props.loading && <>
                <p>Hello, how can I help you today?</p>
                {!context.apiKeys.openai && (
                    <Button size="xs"
                        variant="light"
                        compact
                        onClick={() => context.settings.open('user', 'openai-api-key')}>
                        Connect your OpenAI account to get started
                    </Button>
                )}
            </>}
        </EmptyMessage>
    );
}

export default function ChatPage(props: any) {
    const { id } = useParams();
    const context = useAppContext();
    const spotlightProps = useChatSpotlightProps();
    const navigate = useNavigate();

    const { chat, messages, chatLoadedAt, leaf } = useChat(id, props.share);
    const [generating, setGenerating] = useState(false);

    const [_parameters, setParameters] = useState<Parameters>(loadParameters(id));
    const [parameters] = useDebouncedValue(_parameters, 2000);
    useEffect(() => {
        if (id) {
            saveParameters(id, parameters);
        }
    }, [parameters]);

    const onNewMessage = useCallback(async (message?: string) => {
        if (props.share) {
            return false;
        }

        if (!message?.trim().length) {
            return false;
        }

        if (!context.apiKeys.openai) {
            context.settings.open('user', 'openai-api-key');
            return false;
        }

        setGenerating(true);

        if (chat) {
            await context.chat.sendMessage({
                chatID: chat.id,
                content: message.trim(),
                requestedParameters: {
                    ...parameters,
                    apiKey: context.apiKeys.openai,
                },
                parentID: leaf?.id,
            });
        } else if (props.landing) {
            const id = await context.chat.createChat();
            await context.chat.sendMessage({
                chatID: id,
                content: message.trim(),
                requestedParameters: {
                    ...parameters,
                    apiKey: context.apiKeys.openai,
                },
                parentID: leaf?.id,
            });
            navigate('/chat/' + id);
        }

        setTimeout(() => setGenerating(false), 4000);

        return true;
    }, [chat, context.apiKeys.openai, leaf, parameters, props.landing]);

    useEffect(() => {
        if (props.share) {
            return;
        }

        const shouldScroll = (Date.now() - chatLoadedAt) > 5000;

        if (!shouldScroll) {
            return;
        }

        const container = document.querySelector('#messages') as HTMLElement;
        const messages = document.querySelectorAll('#messages .message');

        if (messages.length) {
            const latest = messages[messages.length - 1] as HTMLElement;
            const offset = Math.max(0, latest.offsetTop - 100);
            setTimeout(() => {
                container?.scrollTo({ top: offset, behavior: 'smooth' });
            }, 500);
        }
    }, [chatLoadedAt, messages.length]);

    const disabled = generating
        || messages[messages.length - 1]?.role === 'user'
        || (messages.length > 0 && !messages[messages.length - 1]?.done);

    const shouldShowChat = id && chat && !!messages.length;

    return <SpotlightProvider {...spotlightProps}>
        <Container key={chat?.id}>
            <Header share={props.share} canShare={messages.length > 1}
                title={(id && messages.length) ? chat?.title : null}
                onShare={async () => {
                    if (chat) {
                        const id = await backend?.shareChat(chat);
                        if (id) {
                            const slug = chat.title ? '/' + slugify(chat.title.toLocaleLowerCase()) : '';
                            const url = window.location.origin + '/s/' + id + slug;
                            navigator.share?.({
                                title: chat.title || undefined,
                                url,
                            });
                        }
                    }
                }} />
            <Messages id="messages">
                {shouldShowChat && <div style={{ paddingBottom: '20rem' }}>
                    {messages.map((message) => (
                        <Message message={message}
                            share={props.share}
                            last={chat.messages.leafs.some(n => n.id === message.id)} />
                    ))}
                </div>}
                {!shouldShowChat && <Empty loading={(!props.landing && !chat) || props.share} />}
            </Messages>

            {!props.share && <MessageInput disabled={disabled} onSubmit={onNewMessage} parameters={parameters} />}

            <Drawer size="50rem"
                position='right'
                opened={!!context.settings.tab}
                onClose={() => context.settings.close()}
                withCloseButton={false}>
                <SettingsScreen parameters={_parameters} setParameters={setParameters} />
            </Drawer>
        </Container>
    </SpotlightProvider>;
}
import styled from '@emotion/styled';
import Helmet from 'react-helmet';
import { useSpotlight } from '@mantine/spotlight';
import { Button, ButtonProps, TextInput } from '@mantine/core';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_NAME } from '../values';
import { useAppContext } from '../context';
import { backend } from '../backend';

const Container = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    min-height: 2.618rem;
    background: rgba(0, 0, 0, 0.2);

    h1 {
        @media (max-width: 40em) {
            width: 100%;
            order: -1;
        }

        font-family: "Work Sans", sans-serif;
        font-size: 1rem;
        line-height: 1.3;

        animation: fadein 0.5s;
        animation-fill-mode: forwards;

        strong {
            font-weight: bold;
            white-space: nowrap;
        }

        span {
            display: block;
            font-size: 70%;
            white-space: nowrap;
        }

        @keyframes fadein {
            from { opacity: 0; }
            to   { opacity: 1; }
        }
    }

    .spacer {
        @media (min-width: 40em) {
            flex-grow: 1;
        }
    }

    i {
        font-size: 90%;
    }

    i + span {
        @media (max-width: 40em) {
            position: absolute;
            left: -9999px;
            top: -9999px;
        }
    }
`;

function HeaderButton(props: ButtonProps & { icon?: string, onClick?: any, children?: any }) {
    return (
        <Button size='xs'
                variant={props.variant || 'subtle'}
                onClick={props.onClick}>
            {props.icon && <i className={'fa fa-' + props.icon} />}
            {props.children && <span>
                {props.children}
            </span>}
        </Button>
    )
}

export default function Header(props: { title?: any, onShare?: () => void, share?: boolean, canShare?: boolean }) {
    const context = useAppContext();
    const navigate = useNavigate();
    const spotlight = useSpotlight();
    const [loading, setLoading] = useState(false);

    const onNewChat = useCallback(async () => {
        setLoading(true);
        navigate(`/`);
        setLoading(false);
    }, [navigate]);

    const openSettings = useCallback(() => {
        context.settings.open(context.apiKeys.openai ? 'options' : 'user');
    }, [context, context.apiKeys.openai]);
    
    return <Container>
        <Helmet>
            <title>{props.title ? `${props.title} - ` : ''}{APP_NAME} - Unofficial ChatGPT app</title>
        </Helmet>
        {props.title && <h1>{props.title}</h1>}
        {!props.title && (<h1>
            <div>
                <strong>{APP_NAME}</strong><br />
                <span>An unofficial ChatGPT app</span>
            </div>
        </h1>)}
        <div className="spacer" />
        <HeaderButton icon="search" onClick={spotlight.openSpotlight} />
        <HeaderButton icon="gear" onClick={openSettings} />
        {backend && !props.share && props.canShare && typeof navigator.share !== 'undefined' && <HeaderButton icon="share" onClick={props.onShare}>
            Share
        </HeaderButton>}
        {backend && !context.authenticated && (
            <HeaderButton onClick={() => backend?.signIn()}>Sign in to sync</HeaderButton>
        )}
        <HeaderButton icon="plus" onClick={onNewChat} loading={loading} variant="light">
            New Chat
        </HeaderButton>
    </Container>;
}
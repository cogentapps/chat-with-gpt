import styled from '@emotion/styled';
import Helmet from 'react-helmet';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSpotlight } from '@mantine/spotlight';
import { Burger, Button, ButtonProps } from '@mantine/core';
import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context';
import { backend } from '../backend';
import { MenuItem, secondaryMenu } from '../menus';
import { useAppDispatch, useAppSelector } from '../store';
import { selectOpenAIApiKey } from '../store/api-keys';
import { setTab } from '../store/settings-ui';
import { selectSidebarOpen, toggleSidebar } from '../store/sidebar';
import { openSignupModal } from '../store/ui';

const HeaderContainer = styled.div`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    min-height: 2.618rem;
    background: rgba(0, 0, 0, 0.0);
    font-family: "Work Sans", sans-serif;

    &.shaded {
        background: rgba(0, 0, 0, 0.2);
    }

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

    h2 {
        margin: 0 0.5rem;
        font-size: 1rem;
    }

    .spacer {
        flex-grow: 1;
    }

    i {
        font-size: 90%;
    }

    i + span, .mantine-Button-root span.hide-on-mobile {
        @media (max-width: 40em) {
            position: absolute;
            left: -9999px;
            top: -9999px;
        }
    }

    .mantine-Button-root {
        @media (max-width: 40em) {
            padding: 0.5rem;
        }
    }
`;

const SubHeaderContainer = styled.div`
    display: flex;
    flex-direction: row;
    font-family: "Work Sans", sans-serif;
    line-height: 1.7;
    opacity: 0.7;
    margin: 0.5rem 0.5rem 0 0.5rem;

    .spacer {
        flex-grow: 1;
    }

    a {
        color: white;
    }

    .fa + span {
        position: absolute;
        left: -9999px;
        top: -9999px;
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

export interface HeaderProps {
    title?: any;
    onShare?: () => void;
    share?: boolean;
    canShare?: boolean;
}

export default function Header(props: HeaderProps) {
    const context = useAppContext();
    const navigate = useNavigate();
    const spotlight = useSpotlight();
    const [loading, setLoading] = useState(false);
    const openAIApiKey = useAppSelector(selectOpenAIApiKey);
    const dispatch = useAppDispatch();
    const intl = useIntl();

    const sidebarOpen = useAppSelector(selectSidebarOpen);
    const onBurgerClick = useCallback(() => dispatch(toggleSidebar()), [dispatch]);

    const burgerLabel = sidebarOpen
        ? intl.formatMessage({ defaultMessage: "Close sidebar" })
        : intl.formatMessage({ defaultMessage: "Open sidebar" });

    const onNewChat = useCallback(async () => {
        setLoading(true);
        navigate(`/`);
        setLoading(false);
    }, [navigate]);

    const openSettings = useCallback(() => {
        dispatch(setTab(openAIApiKey ? 'options' : 'user'));
    }, [openAIApiKey, dispatch]);

    const header = useMemo(() => (
        <HeaderContainer className={context.isHome ? 'shaded' : ''}>
            <Helmet>
                <title>
                    {props.title ? `${props.title} - ` : ''}
                    {intl.formatMessage({ defaultMessage: "Chat with GPT - Unofficial ChatGPT app", description: "HTML title tag" })}
                </title>
            </Helmet>
            {!sidebarOpen && <Burger opened={sidebarOpen} onClick={onBurgerClick} aria-label={burgerLabel} transitionDuration={0} />}
            {context.isHome && <h2>{intl.formatMessage({ defaultMessage: "Chat with GPT", description: "app name" })}</h2>}
            <div className="spacer" />
            <HeaderButton icon="search" onClick={spotlight.openSpotlight} />
            <HeaderButton icon="gear" onClick={openSettings} />
            {backend.current && !props.share && props.canShare && typeof navigator.share !== 'undefined' && <HeaderButton icon="share" onClick={props.onShare}>
                <FormattedMessage defaultMessage="Share" description="Label for the button used to create a public share URL for a chat log" />
            </HeaderButton>}
            {backend.current && !context.authenticated && (
                <HeaderButton onClick={() => {
                    if (process.env.REACT_APP_AUTH_PROVIDER !== 'local') {
                        backend.current?.signIn();
                    } else {
                        dispatch(openSignupModal());
                    }
                }}>
                    <FormattedMessage defaultMessage="Sign in <h>to sync</h>"
                        description="Label for sign in button, indicating the purpose of signing in is to sync your data between devices"
                        values={{
                            h: (chunks: any) => <span className="hide-on-mobile">{chunks}</span>
                        }} />
                </HeaderButton>
            )}
            <HeaderButton icon="plus" onClick={onNewChat} loading={loading} variant="light">
                <FormattedMessage defaultMessage="New Chat" description="Label for the button used to start a new chat session" />
            </HeaderButton>
        </HeaderContainer>
    ), [sidebarOpen, onBurgerClick, props.title, props.share, props.canShare, props.onShare, openSettings, onNewChat, loading, context.authenticated, context.isHome, context.isShare, spotlight.openSpotlight]);

    return header;
}

function SubHeaderMenuItem(props: { item: MenuItem }) {
    return (
        <Button variant="subtle" size="sm" compact component={Link} to={props.item.link} target="_blank" key={props.item.link}>
            {props.item.icon && <i className={'fa fa-' + props.item.icon} />}
            <span>{props.item.label}</span>
        </Button>
    );
}

export function SubHeader(props: any) {
    const elem = useMemo(() => (
        <SubHeaderContainer>
            <div className="spacer" />
            {secondaryMenu.map(item => <SubHeaderMenuItem item={item} key={item.link} />)}
        </SubHeaderContainer>
    ), []);

    return elem;
}
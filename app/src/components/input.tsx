import styled from '@emotion/styled';
import { Button, ActionIcon, Textarea, Loader } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context';
import { useAppDispatch, useAppSelector } from '../store';
import { selectMessage, setMessage } from '../store/message';
import { selectTemperature } from '../store/parameters';
import { openSystemPromptPanel, openTemperaturePanel } from '../store/settings-ui';

const Container = styled.div`
    background: #292933;
    border-top: thin solid #393933;
    padding: 1rem 1rem 0 1rem;

    .inner {
        max-width: 50rem;
        margin: auto;
        text-align: right;
    }

    .settings-button {
        margin: 0.5rem -0.4rem 0.5rem 1rem;
        font-size: 0.7rem;
        color: #999;
    }
`;

export declare type OnSubmit = (name?: string) => Promise<boolean>;

export interface MessageInputProps {
    disabled?: boolean;
}

export default function MessageInput(props: MessageInputProps) {
    const temperature = useAppSelector(selectTemperature);
    const message = useAppSelector(selectMessage);

    const hasVerticalSpace = useMediaQuery('(min-height: 1000px)');
    
    const context = useAppContext();
    const dispatch = useAppDispatch();
    const intl = useIntl();

    const onCustomizeSystemPromptClick = useCallback(() => dispatch(openSystemPromptPanel()), [dispatch]);
    const onTemperatureClick = useCallback(() => dispatch(openTemperaturePanel()), [dispatch]);
    const onChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        dispatch(setMessage(e.target.value));
    }, [dispatch]);

    const pathname = useLocation().pathname;

    const onSubmit = useCallback(async () => {
        if (await context.onNewMessage(message)) {
            dispatch(setMessage(''));
        }
    }, [context, message, dispatch]);

    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && e.shiftKey === false && !props.disabled) {
            e.preventDefault();
            onSubmit();
        }
    }, [onSubmit, props.disabled]);

    const rightSection = useMemo(() => {
        return (
            <div style={{
                opacity: '0.8',
                paddingRight: '0.5rem',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                width: '100%',
            }}>
                {context.generating && (<>
                    <Button variant="subtle" size="xs" compact onClick={() => {
                        context.chat.cancelReply(context.currentChat.leaf!.id);
                    }}>
                        <FormattedMessage defaultMessage={"Cancel"} />
                    </Button>
                    <Loader size="xs" style={{ padding: '0 0.8rem 0 0.5rem' }} />
                </>)}
                {!context.generating && (
                    <ActionIcon size="xl"
                        onClick={onSubmit}>
                        <i className="fa fa-paper-plane" style={{ fontSize: '90%' }} />
                    </ActionIcon>
                )}
            </div>
        );
    }, [onSubmit, props.disabled, context.generating]);

    const disabled = context.generating;

    const isLandingPage = pathname === '/';
    if (context.isShare || (!isLandingPage && !context.id)) {
        return null;
    }

    return <Container>
        <div className="inner">
            <Textarea disabled={props.disabled || disabled}
                autosize
                minRows={(hasVerticalSpace || context.isHome) ? 3 : 2}
                maxRows={12}
                placeholder={intl.formatMessage({ defaultMessage: "Enter a message here..." })}
                value={message}
                onChange={onChange}
                rightSection={rightSection}
                rightSectionWidth={context.generating ? 100 : 55}
                onKeyDown={onKeyDown} />
            <div>
                <Button variant="subtle"
                    className="settings-button"
                    size="xs"
                    compact
                    onClick={onCustomizeSystemPromptClick}>
                    <span>
                        <FormattedMessage defaultMessage={"Customize system prompt"} />
                    </span>
                </Button>
                <Button variant="subtle"
                    className="settings-button"
                    size="xs"
                    compact
                    onClick={onTemperatureClick}>
                    <span>
                        <FormattedMessage defaultMessage="Temperature: {temperature, number, ::.0}"
                            values={{ temperature }} />
                    </span>
                </Button>
            </div>
        </div>
    </Container>;
}
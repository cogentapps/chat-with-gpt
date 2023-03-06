import styled from '@emotion/styled';
import { Button, ActionIcon, Textarea } from '@mantine/core';
import { useCallback, useMemo, useState } from 'react';
import { useAppContext } from '../context';
import { Parameters } from '../types';

const Container = styled.div`
    background: #292933;
    border-top: thin solid #393933;
    padding: 1rem 1rem 0 1rem;
    position: absolute;
    bottom: 0rem;
    left: 0;
    right: 0;

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

function PaperPlaneSubmitButton(props: { onSubmit: any, disabled?: boolean }) {
    return (
        <ActionIcon size="xs"
                    disabled={props.disabled} 
                    loading={props.disabled}
                    onClick={() => props.onSubmit()}>
            <i className="fa fa-paper-plane" style={{ fontSize: '90%' }} />
        </ActionIcon>
    );
}

export interface MessageInputProps {
    disabled?: boolean;
    parameters: Parameters;
    onSubmit: OnSubmit;
}

export default function MessageInput(props: MessageInputProps) {
    const context = useAppContext();

    const [message, setMessage] = useState('');

    const onChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
    }, []);

    const onSubmit = useCallback(async () => {
        if (await props.onSubmit(message)) {
            setMessage('');
        }
    }, [message, props.onSubmit]);

    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter'&& e.shiftKey === false && !props.disabled) {
            e.preventDefault();
            onSubmit();
        }
    }, [onSubmit, props.disabled]);

    const rightSection = useMemo(() => {
        return (
            <div style={{
                opacity: '0.8',
                paddingRight: '0.4rem',
            }}>
                <PaperPlaneSubmitButton onSubmit={onSubmit} disabled={props.disabled} />
            </div>
        );
    }, [onSubmit, props.disabled]);

    const openSystemPromptPanel = useCallback(() => context.settings.open('options', 'system-prompt'), []);
    const openTemperaturePanel = useCallback(() => context.settings.open('options', 'temperature'), []);

    return <Container>
        <div className="inner">
            <Textarea disabled={props.disabled}
                autosize
                minRows={3}
                maxRows={12}
                placeholder={"Enter a message here..."}
                value={message}
                onChange={onChange}
                rightSection={rightSection}
                onKeyDown={onKeyDown} />
            <div>
                <Button variant="subtle" 
                        className="settings-button"
                        size="xs"
                        compact
                        onClick={openSystemPromptPanel}>
                    <span>Customize system prompt</span>
                </Button>
                <Button variant="subtle" 
                        className="settings-button"
                        size="xs"
                        compact
                        onClick={openTemperaturePanel}>
                    <span>Temperature: {props.parameters.temperature.toFixed(1)}</span>
                </Button>
            </div>
        </div>
    </Container>;
}
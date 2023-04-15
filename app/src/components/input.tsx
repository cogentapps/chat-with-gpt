import styled from '@emotion/styled';
import { Button, ActionIcon, Textarea, Loader, Popover, Checkbox, Center, Group } from '@mantine/core';
import { useLocalStorage, useMediaQuery } from '@mantine/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context';
import { useAppDispatch, useAppSelector } from '../store';
import { selectMessage, setMessage } from '../store/message';
import { selectTemperature } from '../store/parameters';
import { openOpenAIApiKeyPanel, openSystemPromptPanel, openTemperaturePanel } from '../store/settings-ui';
import { speechRecognition, supportsSpeechRecognition } from '../speech-recognition-types'
import { useWhisper } from '@chengsokdara/use-whisper';
import { selectUseOpenAIWhisper, selectOpenAIApiKey } from '../store/api-keys';

const Container = styled.div`
    background: #292933;
    border-top: thin solid #393933;
    padding: 1rem 1rem 0 1rem;

    .inner {
        max-width: 50rem;
        margin: auto;
        text-align: right;
    }

    .inner > .bottom {
        display: flex;
        justify-content: space-between;
    }

    @media (max-width: 600px) {
        .inner > .bottom {
            flex-direction: column;
            align-items: flex-start;
        }
    }

    .settings-button {
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
    const [recording, setRecording] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);
    const hasVerticalSpace = useMediaQuery('(min-height: 1000px)');
    const useOpenAIWhisper = useAppSelector(selectUseOpenAIWhisper);
    const openAIApiKey = useAppSelector(selectOpenAIApiKey);
    const [isEnterToSend, setIsEnterToSend] = useLocalStorage({ key: 'isEnterToSend', defaultValue: false})

    const [initialMessage, setInitialMessage] = useState('');
    const {
        transcribing,
        transcript,
        startRecording,
        stopRecording,
    } = useWhisper({
        apiKey: openAIApiKey || ' ',
        streaming: false,
    });

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
        setSpeechError(null);

        if (await context.onNewMessage(message)) {
            dispatch(setMessage(''));
        }
    }, [context, message, dispatch]);

    const onSpeechError = useCallback((e: any) => {
        console.error('speech recognition error', e);
        setSpeechError(e.message);

        try {
            speechRecognition?.stop();
        } catch (e) {
        }

        try {
            stopRecording();
        } catch (e) { }

        setRecording(false);
    }, [stopRecording]);

    const onHideSpeechError = useCallback(() => setSpeechError(null), []);

    const onSpeechStart = useCallback(async () => {
        let granted = false;
        let denied = false;

        try {
            const result = await navigator.permissions.query({ name: 'microphone' as any });
            if (result.state == 'granted') {
                granted = true;
            } else if (result.state == 'denied') {
                denied = true;
            }
        } catch (e) {}

        if (!granted && !denied) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                stream.getTracks().forEach(track => track.stop());
                granted = true;
            } catch (e) {
                denied = true;
            }
        }

        if (denied) {
            onSpeechError(new Error('speech permission was not granted'));
            return;
        }

        try {
            if (!recording) {
                setRecording(true);

                if (useOpenAIWhisper || !supportsSpeechRecognition) {
                    if (!openAIApiKey) {
                        dispatch(openOpenAIApiKeyPanel());
                        return false;
                    }
                    // recorder.start().catch(onSpeechError);
                    setInitialMessage(message);
                    await startRecording();
                } else if (speechRecognition) {
                    const initialMessage = message;

                    speechRecognition.continuous = true;
                    speechRecognition.interimResults = true;

                    speechRecognition.onresult = (event) => {
                        let transcript = '';
                        for (let i = 0; i < event.results.length; i++) {
                            if (event.results[i].isFinal && event.results[i][0].confidence) {
                                transcript += event.results[i][0].transcript;
                            }
                        }
                        dispatch(setMessage(initialMessage + ' ' + transcript));
                    };

                    speechRecognition.start();
                } else {
                    onSpeechError(new Error('not supported'));
                }
            } else {
                if (useOpenAIWhisper || !supportsSpeechRecognition) {
                    await stopRecording();
                    setTimeout(() => setRecording(false), 500);
                } else if (speechRecognition) {
                    speechRecognition.stop();
                    setRecording(false);
                } else {
                    onSpeechError(new Error('not supported'));
                }
            }
        } catch (e) {
            onSpeechError(e);
        }
    }, [recording, message, dispatch, onSpeechError, setInitialMessage, openAIApiKey]);

    useEffect(() => {
        if (useOpenAIWhisper || !supportsSpeechRecognition) {
            if (!transcribing && !recording && transcript?.text) {
                dispatch(setMessage(initialMessage + ' ' + transcript.text));
            }
        }
    }, [initialMessage, transcript, recording, transcribing, useOpenAIWhisper, dispatch]);

    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if(e.key === 'Enter' && e.shiftKey === false && !props.disabled) {
            e.preventDefault();
            onSubmit();
        }
    }, [isEnterToSend, onSubmit, props.disabled]);

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
                        <FormattedMessage defaultMessage={"Cancel"} description="Label for the button that can be clicked while the AI is generating a response to cancel generation" />
                    </Button>
                    <Loader size="xs" style={{ padding: '0 0.8rem 0 0.5rem' }} />
                </>)}
                {!context.generating && (
                    <>
                        <Popover width={200} position="bottom" withArrow shadow="md" opened={speechError !== null}>
                            <Popover.Target>
                                <ActionIcon size="xl"
                                    onClick={onSpeechStart}>
                                    {transcribing && <Loader size="xs" />}
                                    {!transcribing && <i className="fa fa-microphone" style={{ fontSize: '90%', color: recording ? 'red' : 'inherit' }} />}
                                </ActionIcon>
                            </Popover.Target>
                            <Popover.Dropdown>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                }}>
                                    <p style={{
                                        fontFamily: `"Work Sans", sans-serif`,
                                        fontSize: '0.9rem',
                                        textAlign: 'center',
                                        marginBottom: '0.5rem',
                                    }}>
                                        Sorry, an error occured trying to record audio.
                                    </p>
                                    <Button variant="light" size="xs" fullWidth onClick={onHideSpeechError}>
                                        Close
                                    </Button>
                                </div>
                            </Popover.Dropdown>
                        </Popover>
                        <ActionIcon size="xl"
                            onClick={onSubmit}>
                            <i className="fa fa-paper-plane" style={{ fontSize: '90%' }} />
                        </ActionIcon>
                    </>
                )}
            </div>
        );
    }, [recording, transcribing, onSubmit, onSpeechStart, props.disabled, context.generating, speechError, onHideSpeechError]);

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
            <div className="bottom">
                <Group my="sm" spacing="xs">
                    <Button variant="subtle"
                        className="settings-button"
                        size="xs"
                        compact
                        onClick={onCustomizeSystemPromptClick}>
                        <span>
                            <FormattedMessage defaultMessage={"Customize system prompt"} description="Label for the button that opens a modal for customizing the 'system prompt', a message used to customize and influence how the AI responds." />
                        </span>
                    </Button>
                    <Button variant="subtle"
                        className="settings-button"
                        size="xs"
                        compact
                        onClick={onTemperatureClick}>
                        <span>
                            <FormattedMessage defaultMessage="Temperature: {temperature, number, ::.0}"
                                description="Label for the button that opens a modal for setting the 'temperature' (randomness) of AI responses"
                                values={{ temperature }} />
                        </span>
                    </Button>
                </Group>
            </div>
        </div>
    </Container>;
}

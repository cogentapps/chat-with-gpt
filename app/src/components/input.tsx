import styled from '@emotion/styled';
import { Button, ActionIcon, Textarea, Loader, Popover } from '@mantine/core';
import { getHotkeyHandler, useHotkeys, useMediaQuery } from '@mantine/hooks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../core/context';
import { useAppDispatch, useAppSelector } from '../store';
import { selectMessage, setMessage } from '../store/message';
import { selectSettingsTab, openOpenAIApiKeyPanel } from '../store/settings-ui';
import { speechRecognition, supportsSpeechRecognition } from '../core/speech-recognition-types'
import { useWhisper } from '@chengsokdara/use-whisper';
import QuickSettings from './quick-settings';
import { useOption } from '../core/options/use-option';
import { set } from '../core/utils/idb';

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
    const message = useAppSelector(selectMessage);
    const [recording, setRecording] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const hasVerticalSpace = useMediaQuery('(min-height: 1000px)');
    const [useOpenAIWhisper] = useOption<boolean>('speech-recognition', 'use-whisper');
    const [openAIApiKey] = useOption<string>('openai', 'apiKey');

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

    const navigate = useNavigate();
    const context = useAppContext();
    const dispatch = useAppDispatch();
    const intl = useIntl();
    const fileInputRef = useRef(null);

    const tab = useAppSelector(selectSettingsTab);

    const [showMicrophoneButton] = useOption<boolean>('speech-recognition', 'show-microphone');
    const [submitOnEnter] = useOption<boolean>('input', 'submit-on-enter');

    const onChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        dispatch(setMessage(e.target.value));
    }, [dispatch]);

    const pathname = useLocation().pathname;

    const onSubmit = useCallback(async () => {
        setSpeechError(null);

        const id = await context.onNewMessage(message, imageUrl);

        if (id) {
            if (!window.location.pathname.includes(id)) {
                navigate('/chat/' + id);
            }
            dispatch(setMessage(''));
            setImageUrl(null);
        }
    }, [context, message, imageUrl, dispatch, navigate]);

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
        } catch (e) { }

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

    useHotkeys([
        ['n', () => document.querySelector<HTMLTextAreaElement>('#message-input')?.focus()]
    ]);

    const blur = useCallback(() => {
        document.querySelector<HTMLTextAreaElement>('#message-input')?.blur();
    }, []);

    const onImageSelected = (event) => {
        const file = event.target.files[0];
        if (file) {
            setIsImageUploading(true);
            const reader = new FileReader();

            reader.onload = (loadEvent) => {
                const base64Image = loadEvent.target.result;
                setImageUrl(base64Image); // Update the state with the base64 image data
                setIsImageUploading(false);
                console.log("Image uploaded: ", base64Image);
            };

            reader.onerror = (error) => {
                // FIXME: Add error to UI
                console.log('Error uploading image: ', error);
                setIsImageUploading(false);
            }

            reader.readAsDataURL(file);
        }
    };

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
                        context.chat.cancelReply(context.currentChat.chat?.id, context.currentChat.leaf!.id);
                    }}>
                        <FormattedMessage defaultMessage={"Cancel"} description="Label for the button that can be clicked while the AI is generating a response to cancel generation" />
                    </Button>
                    <Loader size="xs" style={{ padding: '0 0.8rem 0 0.5rem' }} />
                </>)}
                {!context.generating && (
                    <>
                        {showMicrophoneButton && <Popover width={200} position="bottom" withArrow shadow="md" opened={speechError !== null}>
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
                        </Popover>}

                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={onImageSelected}
                            ref={fileInputRef}
                        />

                        <ActionIcon size="xl"
                            onClick={() => fileInputRef.current.click()}
                            disabled={isImageUploading}>
                            {isImageUploading ? (
                                <i className="fa fa-ellipsis-h" style={{ fontSize: '90%' }} />
                            ) : (
                                <i className="fa fa-camera" style={{ fontSize: '90%' }} />
                            )}
                        </ActionIcon>

                        <ActionIcon size="xl"
                            onClick={onSubmit}
                            disabled={isImageUploading}>
                            <i className="fa fa-paper-plane" style={{ fontSize: '90%' }} />
                        </ActionIcon>
                    </>
                )}
            </div>
        );
    }, [recording, transcribing, isImageUploading, imageUrl, onSubmit, onSpeechStart, props.disabled, context.generating, speechError, onHideSpeechError, showMicrophoneButton]);

    const disabled = context.generating;

    const isLandingPage = pathname === '/';
    if (context.isShare || (!isLandingPage && !context.id)) {
        return null;
    }

    const hotkeyHandler = useMemo(() => {
        const keys = [
            ['Escape', blur, { preventDefault: true }],
            ['ctrl+Enter', onSubmit, { preventDefault: true }],

        ];
        if (submitOnEnter) {
            keys.unshift(['Enter', onSubmit, { preventDefault: true }]);
        }
        const handler = getHotkeyHandler(keys as any);
        return handler;
    }, [onSubmit, blur, submitOnEnter]);

    return <Container>
        <div className="inner">
            <Textarea disabled={props.disabled || disabled}
                id="message-input"
                autosize
                minRows={(hasVerticalSpace || context.isHome) ? 3 : 2}
                maxRows={12}
                placeholder={intl.formatMessage({ defaultMessage: "Enter a message here..." })}
                value={message}
                onChange={onChange}
                rightSection={rightSection}
                rightSectionWidth={context.generating ? 100 : 55}
                onKeyDown={hotkeyHandler} />
            <QuickSettings key={tab} />
        </div>
    </Container>;
}

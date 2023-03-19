import styled from '@emotion/styled';
import { Button, Text, ActionIcon, Textarea, Loader, Group, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context';
import { useAppDispatch, useAppSelector } from '../store';
import { selectMessage, setMessage } from '../store/message';
import { selectTemperature } from '../store/parameters';
import { openSystemPromptPanel, openTemperaturePanel } from '../store/settings-ui';
import { speechRecognition } from '../speech-recognition-types.d'
import MicRecorder from 'mic-recorder-to-mp3';
import { selectUseOpenAIWhisper, selectOpenAIApiKey } from '../store/api-keys';
import { Mp3Encoder } from 'lamejs';
import { openModal, closeModal } from '@mantine/modals';
import { Dropzone, DropzoneProps, IMAGE_MIME_TYPE } from '@mantine/dropzone';

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



async function chunkAndEncodeMP3File(file: Blob): Promise<Array<File>> {
    const MAX_CHUNK_SIZE = 25 * 1024 * 1024; // 25 MB
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(await file.arrayBuffer());
    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;
    const bytesPerSample = 2; // 16-bit audio
    const samplesPerChunk = Math.floor((MAX_CHUNK_SIZE / bytesPerSample) / numChannels);
    const totalSamples = Math.floor(duration * sampleRate);
    const numChunks = Math.ceil(totalSamples / samplesPerChunk);

    const chunks: Array<File> = [];
    for (let i = 0; i < numChunks; i++) {
        const startSample = i * samplesPerChunk;
        const endSample = Math.min(startSample + samplesPerChunk, totalSamples);
        const chunkDuration = (endSample - startSample) / sampleRate;
        const chunkBuffer = audioContext.createBuffer(numChannels, endSample - startSample, sampleRate);
        for (let c = 0; c < numChannels; c++) {
            const channelData = audioBuffer.getChannelData(c).subarray(startSample, endSample);
            chunkBuffer.copyToChannel(channelData, c);
        }
        const chunkBlob = await new Promise<Blob>((resolve) => {
            const encoder = new Mp3Encoder(numChannels, sampleRate, 128);
            const leftData = chunkBuffer.getChannelData(0);
            const rightData = numChannels === 1 ? leftData : chunkBuffer.getChannelData(1);
            const mp3Data = encoder.encodeBuffer(leftData, rightData);
            const blob = new Blob([mp3Data], { type: 'audio/mp3' });
            resolve(blob);
        });
        chunks.push(new File([chunkBlob], `text-${i}.mp3`, { type: 'audio/mp3' }));
    }

    return chunks;
}


export default function MessageInput(props: MessageInputProps) {
    const temperature = useAppSelector(selectTemperature);
    const message = useAppSelector(selectMessage);
    const [recording, setRecording] = useState(false);
    const hasVerticalSpace = useMediaQuery('(min-height: 1000px)');
    const recorder = useMemo(() => new MicRecorder({ bitRate: 128 }), []);
    const useOpenAIWhisper = useAppSelector(selectUseOpenAIWhisper);
    const openAIApiKey = useAppSelector(selectOpenAIApiKey);

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

    const theme = useMantineTheme();

    const openFileModal = useCallback(() => openModal({
        title: 'Drop an mp3 file here',
        modalId: "file-modal",
        children: (
            <>
                {useOpenAIWhisper &&
                    <Dropzone
                        onDrop={async (files) => {
                            console.log('dropped files', files);
                            closeModal("file-modal");
                            let msg = "";
                            for (const file of files) {
                                msg += (await transcribeWithOpenAIWhisper(file)) + " ";
                            }
                            dispatch(setMessage(msg));
                        }}
                        onReject={(files) => console.log('rejected files', files)}
                        maxSize={25 * 1024 ** 2}
                        accept={["audio/mp3", "audio/mpeg"]}
                        {...props}
                    >
                        <Group position="center" spacing="xl" style={{ minHeight: 220, pointerEvents: 'none' }}>
                            <Dropzone.Accept>
                                <ActionIcon size="xl">
                                    <i className="fa fa-upload" style={{ fontSize: '90%', color: recording ? 'red' : 'inherit' }} />
                                </ActionIcon>
                            </Dropzone.Accept>
                            <Dropzone.Reject>
                                <ActionIcon size="xl">
                                    <i className="fa fa-upload" style={{ fontSize: '90%', color: recording ? 'red' : 'inherit' }} />
                                </ActionIcon>
                            </Dropzone.Reject>
                            <Dropzone.Idle>
                                <ActionIcon size="xl">
                                    <i className="fa fa-upload" style={{ fontSize: '90%', color: recording ? 'red' : 'inherit' }} />
                                </ActionIcon>
                            </Dropzone.Idle>

                            <div>
                                <Text size="xl" inline>
                                    Drag mp3 speech audio files here or click to select files
                                </Text>
                                <Text size="sm" color="dimmed" inline mt={7}>
                                    Attach as many files as you like, each file should not exceed 5mb
                                </Text>
                            </div>
                        </Group>
                    </Dropzone>
                }
                {!useOpenAIWhisper &&
                    <p> Please enable OpenAI Whisper in the User Settings to use the file transcribing functionality.</p>
                }
            </>
        ),

    }), [useOpenAIWhisper, message, dispatch]);

    const transcribeWithOpenAIWhisper = async (file: File) => {

        // TODO: cut in chunks... 

        var data = new FormData()
        data.append('file', file);
        data.append('model', 'whisper-1')

        try {
            const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${openAIApiKey}`,
                },
                body: data,
            });

            const json = await response.json()

            if (json.text) {
                return json.text
            }
        } catch (e) {
            console.error(e)
        }
        return ""
    }

    const onSpeechStart = useCallback(() => {

        if (!recording) {
            setRecording(true);

            // if we are using whisper, the we will just record with the browser and send the api when done 
            if (useOpenAIWhisper) {
                recorder.start().catch((e: any) => console.error(e));
            } else {
                speechRecognition.continuous = true;
                speechRecognition.interimResults = true;

                speechRecognition.onresult = (event) => {
                    const transcript = event.results[event.results.length - 1][0].transcript;
                    dispatch(setMessage(transcript));
                };

                speechRecognition.start();
            }
        } else {
            setRecording(false);
            if (useOpenAIWhisper) {
                const mp3 = recorder.stop().getMp3();

                mp3.then(async ([buffer, blob]) => {

                    const file = new File(buffer, 'chat.mp3', {
                        type: blob.type,
                        lastModified: Date.now()
                    });

                    dispatch(setMessage(await transcribeWithOpenAIWhisper(file)));

                }).catch((e: any) => console.error(e));
            } else {
                speechRecognition.stop();
            }
        }
    }, [recording, message, dispatch]);


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
                        <FormattedMessage defaultMessage={"Cancel"} description="Label for the button that can be clicked while the AI is generating a response to cancel generation" />
                    </Button>
                    <Loader size="xs" style={{ padding: '0 0.8rem 0 0.5rem' }} />
                </>)}
                {!context.generating && (
                    <>
                        <ActionIcon size="xl"
                            onClick={onSpeechStart}>
                            <i className="fa fa-microphone" style={{ fontSize: '90%', color: recording ? 'red' : 'inherit' }} />
                        </ActionIcon>
                        <ActionIcon size="xl"
                            onClick={openFileModal}>
                            <i className="fa fa-upload" style={{ fontSize: '90%' }} />
                        </ActionIcon>
                        <ActionIcon size="xl"
                            onClick={onSubmit}>
                            <i className="fa fa-paper-plane" style={{ fontSize: '90%' }} />
                        </ActionIcon>
                    </>
                )}
            </div>
        );
    }, [recording, onSubmit, props.disabled, context.generating]);

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
            </div>
        </div>
    </Container>;
}
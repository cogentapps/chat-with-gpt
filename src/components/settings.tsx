import styled from '@emotion/styled';
import { Button, Drawer, Grid, Select, Slider, Tabs, Textarea, TextInput } from "@mantine/core";
import { useMediaQuery } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { defaultSystemPrompt } from '../openai';
import { defaultVoiceList, getVoices } from '../elevenlabs';
import { useAppContext } from '../context';

const Container = styled.div`
    padding: .4rem 1rem 1rem 1rem;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    max-width: 100vw;
    max-height: 100vh;

    @media (max-width: 40em) {
        padding: 0;
    }

    .mantine-Tabs-root {
        display: flex;
        flex-direction: column;
        height: calc(100% - 3rem);
        
        @media (max-width: 40em) {
            height: calc(100% - 5rem);
        }
    }

    .mantine-Tabs-tab {
        padding: 1.2rem 1.618rem 0.8rem 1.618rem;

        @media (max-width: 40em) {
            padding: 1rem;
            span {
                display: none;
            }
        }
    }

    .mantine-Tabs-panel {
        flex-grow: 1;
        overflow-y: scroll;
        overflow-x: hidden;
        min-height: 0;
        margin-left: 0;
        padding: 1.2rem 0 3rem 0;

        @media (max-width: 40em) {
            padding: 1.2rem 1rem 3rem 1rem;
        }
    }

    #save {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 0 1rem 1rem 1rem;
        opacity: 1;

        .mantine-Button-root {
            height: 3rem;
        }
    }
`;

const Settings = styled.div`
    font-family: "Work Sans", sans-serif;
    color: white;

    section {
        margin-bottom: .618rem;
        padding: 0.618rem;

        h3 {
            font-size: 1rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }

        p {
            line-height: 1.7;
            margin-top: 0.8rem;
            font-size: 1rem;
        }

        a {
            color: white;
            text-decoration : underline;
        }

        code {
            font-family: "Fira Code", monospace;
        }
    }
 
    .focused {
        border: thin solid rgba(255, 255, 255, 0.1);
        border-radius: 0.25rem;
        animation: flash 3s;
    }

    @keyframes flash {
        0% {
            border-color: rgba(255, 0, 0, 0);
        }
        50% {
            border-color: rgba(255, 0, 0, 1);
        }
        100% {
            border-color: rgba(255, 255, 255, .1);
        }
    }
`;

export interface SettingsDrawerProps {
}

export default function SettingsDrawer(props: SettingsDrawerProps) {
    const context = useAppContext();
    const small = useMediaQuery('(max-width: 40em)');
    const { parameters, setParameters } = context;

    const [voices, setVoices] = useState<any[]>(defaultVoiceList);
    useEffect(() => {
        if (context.apiKeys.elevenlabs) {
            getVoices().then(data => {
                if (data?.voices?.length) {
                    setVoices(data.voices);
                }
            });
        }
    }, [context.apiKeys.elevenlabs]);

    if (!context.settings.tab) {
        return null;
    }

    return (
        <Drawer size="50rem"
            position='right'
            opened={!!context.settings.tab}
            onClose={() => context.settings.close()}
            withCloseButton={false}>
            <Container>
                <Tabs defaultValue={context.settings.tab} style={{ margin: '0rem' }}>
                    <Tabs.List grow={small}>
                        <Tabs.Tab value="options">Options</Tabs.Tab>
                        <Tabs.Tab value="user">User</Tabs.Tab>
                        <Tabs.Tab value="speech">Speech</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="user">
                        <Settings>
                            <Grid style={{ marginBottom: '1.618rem' }} gutter={24}>
                                <Grid.Col span={12}>
                                    <section className={context.settings.option === 'openai-api-key' ? 'focused' : ''}>
                                        <h3>Your OpenAI API Key</h3>
                                        <TextInput
                                            placeholder="Paste your API key here"
                                            value={context.apiKeys.openai || ''}
                                            onChange={event => {
                                                setParameters({ ...parameters, apiKey: event.currentTarget.value });
                                                context.apiKeys.setOpenAIApiKey(event.currentTarget.value);
                                            }} />
                                        <p><a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noreferrer">Find your API key here.</a> Your API key is stored only on this device and never transmitted to anyone except OpenAI.</p>
                                        <p>OpenAI API key usage is billed at a pay-as-you-go rate, separate from your ChatGPT subscription.</p>
                                    </section>
                                </Grid.Col>
                            </Grid>
                        </Settings>
                    </Tabs.Panel>

                    <Tabs.Panel value="options">
                        <Settings>
                            <Grid style={{ marginBottom: '1.618rem' }} gutter={24}>
                                <Grid.Col span={12}>
                                    <section className={context.settings.option === 'system-prompt' ? 'focused' : ''}>
                                        <h3>System Prompt</h3>
                                        <Textarea
                                            value={parameters.initialSystemPrompt || defaultSystemPrompt}
                                            onChange={event => setParameters({ ...parameters, initialSystemPrompt: event.currentTarget.value })}
                                            minRows={5}
                                            maxRows={10}
                                            autosize />
                                        <p style={{ marginBottom: '0.7rem' }}>The System Prompt is shown to ChatGPT by the "System" before your first message. The <code style={{ whiteSpace: 'nowrap' }}>{'{{ datetime }}'}</code> tag is automatically replaced by the current date and time.</p>
                                        {parameters.initialSystemPrompt && (parameters.initialSystemPrompt?.trim() !== defaultSystemPrompt.trim()) && <Button size="xs" compact variant="light" onClick={() => setParameters({ ...parameters, initialSystemPrompt: defaultSystemPrompt })}>
                                            Reset to default
                                        </Button>}
                                    </section>
                                </Grid.Col>
                                <Grid.Col span={12}>
                                    <section className={context.settings.option === 'temperature' ? 'focused' : ''}>
                                        <h3>Temperature ({parameters.temperature.toFixed(1)})</h3>
                                        <Slider value={parameters.temperature} onChange={value => setParameters({ ...parameters, temperature: value })} step={0.1} min={0} max={1} precision={3} />
                                        <p>The temperature parameter controls the randomness of the AI's responses. Lower values will make the AI more predictable, while higher values will make it more creative.</p>
                                    </section>
                                </Grid.Col>
                            </Grid>
                        </Settings>
                    </Tabs.Panel>

                    <Tabs.Panel value="speech">
                        <Settings>
                            <Grid style={{ marginBottom: '1.618rem' }} gutter={24}>
                                <Grid.Col span={12}>
                                    <section className={context.settings.option === 'elevenlabs-api-key' ? 'focused' : ''}>
                                        <h3>Your ElevenLabs Text-to-Speech API Key (optional)</h3>
                                        <TextInput placeholder="Paste your API key here" value={context.apiKeys.elevenlabs || ''} onChange={event => context.apiKeys.setElevenLabsApiKey(event.currentTarget.value)} />
                                        <p>Give ChatGPT a realisic human voice by connecting your ElevenLabs account (preview the available voices below). <a href="https://beta.elevenlabs.io" target="_blank" rel="noreferrer">Click here to sign up.</a></p>
                                        <p>You can find your API key by clicking your avatar or initials in the top right of the ElevenLabs website, then clicking Profile. Your API key is stored only on this device and never transmitted to anyone except ElevenLabs.</p>
                                    </section>
                                </Grid.Col>
                                <Grid.Col span={12}>
                                    <section className={context.settings.option === 'elevenlabs-voice' ? 'focused' : ''}>
                                        <h3>Voice</h3>
                                        <Select
                                            value={context.voice.id}
                                            onChange={v => context.voice.setVoiceID(v!)}
                                            data={voices.map(v => ({ label: v.name, value: v.voice_id }))} />
                                        <audio controls style={{ display: 'none' }} id="voice-preview" key={context.voice.id}>
                                            <source src={voices.find(v => v.voice_id === context.voice.id)?.preview_url} type="audio/mpeg" />
                                        </audio>
                                        <Button onClick={() => (document.getElementById('voice-preview') as HTMLMediaElement)?.play()} variant='light' compact style={{ marginTop: '1rem' }}>
                                            <i className='fa fa-headphones' />
                                            <span>Preview voice</span>
                                        </Button>
                                    </section>
                                </Grid.Col>
                            </Grid>
                        </Settings>
                    </Tabs.Panel>
                </Tabs>
                <div id="save">
                    <Button variant="light" fullWidth size="md" onClick={() => context.settings.close()}>
                        Save and Close
                    </Button>
                </div>
            </Container>
        </Drawer>
    )
}
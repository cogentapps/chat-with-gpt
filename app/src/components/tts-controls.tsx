import styled from '@emotion/styled';
import { ActionIcon, Button } from '@mantine/core';
import { useCallback, useEffect } from 'react';
import { useTTS } from '../core/tts/use-tts';
import { useAppContext } from '../core/context';
import { APP_NAME } from '../values';
import { useHotkeys } from '@mantine/hooks';

const Container = styled.div`
    background: #292933;
    border-top: thin solid #393933;
    padding: 1rem;
    // padding-bottom: 0.6rem;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    text-align: center;

    p {
        font-family: "Work Sans", sans-serif;
        font-size: 80%;
        margin-bottom: 1rem;
    }

    .buttons {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;

        // .mantine-ActionIcon-root:disabled {
        //     background: transparent;
        //     border-color: transparent;
        // }
    }
`;

export default function AudioControls(props: any) {
    const context = useAppContext();
    const { state, play, pause, cancel } = useTTS();

    const handlePlayPause = useCallback(() => {
        if (state?.playing) {
            pause();
        } else {
            play();
        }
    }, [state, pause, play]);

    const handlePrevious = useCallback(() => {
        if (!state) {
            return;
        }
        play(state.index - 1);
    }, [state, play]);

    const handleNext = useCallback(() => {
        if (!state) {
            return;
        }
        play(state.index + 1);
    }, [state, play]);

    const handleJumpToStart = useCallback(() => {
        play(0);
    }, [play]);

    const handleJumpToEnd = useCallback(() => {
        if (!state) {
            return;
        }
        play(state.length - 1);
    }, [state, play]);

    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: context.currentChat.chat?.title || APP_NAME,
                artist: APP_NAME,
            });
    
            navigator.mediaSession.setActionHandler('play', handlePlayPause);
            navigator.mediaSession.setActionHandler('pause', handlePlayPause);
            navigator.mediaSession.setActionHandler('previoustrack', handlePrevious);
            navigator.mediaSession.setActionHandler('nexttrack', handleNext);
        }
    }, [context.currentChat.chat?.title, handlePlayPause, handlePrevious, handleNext]);

    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = state?.playing ? 'playing' : 'paused';
        }
    }, [state?.playing]);

    useHotkeys([
        ['Space', handlePlayPause],
    ]);

    if (!state) {
        return null;
    }

    return (
        <Container>
            <div className="buttons">
                <ActionIcon onClick={handleJumpToStart} variant='light' color='blue'>
                    <i className="fa fa-fast-backward" />
                </ActionIcon>
                <ActionIcon onClick={handlePrevious}  variant='light' color='blue' disabled={state?.index === 0}>
                    <i className="fa fa-step-backward" />
                </ActionIcon>
                <ActionIcon onClick={handlePlayPause}  variant='light' color='blue'>
                    <i className={state?.playing ? 'fa fa-pause' : 'fa fa-play'} />
                </ActionIcon>
                <ActionIcon onClick={handleNext}  variant='light' color='blue' disabled={!state || (state.index === state.length - 1)}>
                    <i className="fa fa-step-forward" />
                </ActionIcon>
                <ActionIcon onClick={handleJumpToEnd}  variant='light' color='blue'>
                    <i className="fa fa-fast-forward" />
                </ActionIcon>
                <ActionIcon onClick={cancel}  variant='light' color='blue'>
                    <i className="fa fa-close" />
                </ActionIcon>
            </div>
        </Container>
    );
}
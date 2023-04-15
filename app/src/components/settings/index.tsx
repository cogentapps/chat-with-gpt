import styled from '@emotion/styled';
import { Button, Drawer, Tabs } from "@mantine/core";
import { useMediaQuery } from '@mantine/hooks';
import { useCallback, useEffect } from 'react';
import UserOptionsTab from './user';
import ChatOptionsTab from './chat';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeSettingsUI, selectSettingsOption, selectSettingsTab, setTab } from '../../store/settings-ui';
import SpeechOptionsTab from './speech';
import { FormattedMessage } from 'react-intl';
import UIPreferencesTab from './ui-preferences';

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

export interface SettingsDrawerProps {
}

export default function SettingsDrawer(props: SettingsDrawerProps) {
    const tab = useAppSelector(selectSettingsTab);
    const option = useAppSelector(selectSettingsOption);
    const small = useMediaQuery('(max-width: 40em)');

    const dispatch = useAppDispatch();
    const close = useCallback(() => dispatch(closeSettingsUI()), [dispatch]);
    const onTabChange = useCallback((tab: string) => dispatch(setTab(tab)), [dispatch]);

    useEffect(() => {
        setTimeout(() => {
            document.querySelector('.focused')?.scrollIntoView();
        }, 1000);
    }, [tab, option]);

    return (
        <Drawer size="50rem"
            position='right'
            opened={!!tab}
            onClose={close}
            transition="slide-left"
            transitionDuration={200}
            withCloseButton={false}>
            <Container>
                <Tabs value={tab} onTabChange={onTabChange} style={{ margin: '0rem' }}>
                    <Tabs.List grow={small}>
                        <Tabs.Tab value="chat">Chat</Tabs.Tab>
                        <Tabs.Tab value="speech">Speech</Tabs.Tab>
                        <Tabs.Tab value="ui">UI</Tabs.Tab>
                        <Tabs.Tab value="user">User</Tabs.Tab>
                    </Tabs.List>
                    <ChatOptionsTab />
                    <SpeechOptionsTab />
                    <UIPreferencesTab />
                    <UserOptionsTab />
                </Tabs>
                <div id="save">
                    <Button variant="light" fullWidth size="md" onClick={close}>
                        <FormattedMessage defaultMessage={"Save and Close"} 
                            description="Label for the button that closes the Settings screen, saving any changes"
                            />
                    </Button>
                </div>
            </Container>
        </Drawer>
    )
}
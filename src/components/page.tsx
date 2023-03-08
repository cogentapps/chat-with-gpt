import styled from '@emotion/styled';
import { SpotlightProvider } from '@mantine/spotlight';
import { useChatSpotlightProps } from '../spotlight';
import Header, { HeaderProps, SubHeader } from './header';
import MessageInput from './input';
import SettingsDrawer from './settings';

const Container = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #292933;
    color: white;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

export function Page(props: {
    id: string;
    headerProps?: HeaderProps;
    showSubHeader?: boolean;
    children: any;
}) {
    const spotlightProps = useChatSpotlightProps();

    return <SpotlightProvider {...spotlightProps}>
        <Container key={props.id}>
            <Header share={props.headerProps?.share}
                canShare={props.headerProps?.canShare}
                title={props.headerProps?.title}
                onShare={props.headerProps?.onShare} />
            {props.showSubHeader && <SubHeader />}
            {props.children}
            <MessageInput />
            <SettingsDrawer />
        </Container>
    </SpotlightProvider>;
}


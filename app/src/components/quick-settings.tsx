import styled from '@emotion/styled';
import { useAppContext } from '../core/context';
import { Option } from '../core/options/option';
import { useOption } from '../core/options/use-option';
import { Button } from '@mantine/core';
import { useAppDispatch, useAppSelector } from '../store';
import { useCallback } from 'react';
import { setTabAndOption } from '../store/settings-ui';

const Container = styled.div`
    margin: 0.5rem -0.5rem;

    display: flex;
    flex-wrap: wrap;
    text-align: left;

    justify-content: center;

    @media (min-width: 40em) {
        justify-content: flex-end;
    }

    .mantine-Button-root {
        font-size: 0.7rem;
        color: #999;
    }
`;

export function QuickSettingsButton(props: { groupID: string, option: Option }) {
    const context = useAppContext();
    const dispatch = useAppDispatch();

    const [value] = useOption(props.groupID, props.option.id, context.id || undefined);

    const onClick = useCallback(() => {
        dispatch(setTabAndOption({ tab: props.option.displayOnSettingsScreen, option: props.option.id }));
    }, [props.groupID, props.option.id, dispatch]);

    const labelBuilder = props.option.displayInQuickSettings?.label;
    let label = props.option.id;
    
    if (labelBuilder) {
        label = typeof labelBuilder === 'string' ? labelBuilder : labelBuilder(value, context.chat.options, context);
    }

    return (
        <Button variant="subtle" size="xs" compact onClick={onClick}>
            <span>
                {label}
            </span>
        </Button>
    )
}

export default function QuickSettings(props: any) {
    const context = useAppContext();
    const options = context.chat.getQuickSettings();

    if (!options.length) {
        return <div style={{ height: '1rem' }} />;
    }

    return <Container>
        {options.map(o => <QuickSettingsButton groupID={o.groupID} option={o.option} key={o.groupID + "." + o.option.id} />)}
    </Container>;
}
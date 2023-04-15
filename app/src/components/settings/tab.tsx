import styled from "@emotion/styled";
import { Button, NumberInput, PasswordInput, Select, Slider, Switch, Tabs, Text, TextInput, Textarea } from "@mantine/core";
import { Option } from "../../core/options/option";
import SettingsOption from "./option";
import { selectSettingsOption } from "../../store/settings-ui";
import { useAppSelector } from "../../store";
import { FormattedMessage } from "react-intl";
import { useOption } from "../../core/options/use-option";
import { Context, useAppContext } from "../../core/context";
import { pluginMetadata as pluginMetadata } from "../../core/plugins/metadata";
import { globalOptions } from "../../global-options";
import { useEffect } from "react";

const Settings = styled.div`
    font-family: "Work Sans", sans-serif;
    color: white;

    section {
        margin-bottom: .618rem;
        padding: 0.618rem;

        section {
            padding-left: 0;
            padding-right: 0;
        }

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

        .mantine-NumberInput-root, .slider-wrapper {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
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

const OptionWrapper = styled.div`
    & {
        margin-top: 1rem;
    }

    * {
        font-family: "Work Sans", sans-serif;
        color: white;
        font-size: 1rem;
    }
`;

export function PluginOptionWidget(props: { pluginID: string, option: Option, chatID?: string | null | undefined, context: Context }) {
    const requestedOption = useAppSelector(selectSettingsOption);

    const option = props.option;

    const [_value, setValue, renderProps] = useOption(props.pluginID, option.id, props.chatID || undefined);

    const value = _value ?? option.defaultValue;

    if (option.defaultValue && (typeof value === 'undefined' || value === null)) {
        console.warn(`expected option value for ${props.pluginID}.${option.id}, got:`, _value);
    }

    if (renderProps.hidden) {
        return null;
    }

    let component: any;

    switch (renderProps.type) {
        case "textarea":
            component = (
                <Textarea label={!option.displayAsSeparateSection ? renderProps.label : null}
                    placeholder={renderProps.placeholder}
                    disabled={renderProps.disabled}
                    value={value || ''}
                    onChange={e => setValue(e.target.value)}
                    minRows={5} />
            );
            break;
        case "select":
            component = (
                <Select label={!option.displayAsSeparateSection ? renderProps.label : null}
                    placeholder={renderProps.placeholder}
                    disabled={renderProps.disabled}
                    value={value || ''}
                    onChange={value => setValue(value)}
                    data={renderProps.options ?? []}
                />
            );
            break;
        case "slider":
            component = (
                <div className="slider-wrapper">
                    {!option.displayAsSeparateSection && <Text size='sm' weight={500}>{renderProps.label}:</Text>}
                    <Slider label={value.toString()}
                        disabled={renderProps.disabled}
                        value={value}
                        onChange={v => setValue(v)}
                        min={renderProps.min}
                        max={renderProps.max}
                        step={renderProps.step}
                        style={{
                            minWidth: '10rem',
                            flexGrow: 1,
                        }} />
                </div>
            );
            break;
        case "number":
            component = (
                <NumberInput label={!option.displayAsSeparateSection ? (renderProps.label + ':') : null}
                    disabled={renderProps.disabled}
                    value={value ?? undefined}
                    onChange={v => setValue(v)}
                    min={renderProps.min}
                    max={renderProps.max}
                    step={renderProps.step} />
            );
            break;
        case "checkbox":
            component = (
                <Switch label={!option.displayAsSeparateSection ? renderProps.label : null}
                    disabled={renderProps.disabled}
                    checked={value}
                    onChange={e => setValue(e.target.checked)} />
            );
            break;
        case "password":
            component = (
                <PasswordInput label={!option.displayAsSeparateSection ? renderProps.label : null}
                    placeholder={renderProps.placeholder}
                    disabled={renderProps.disabled}
                    value={value}
                    onChange={e => setValue(e.target.value)} />
            );
            break;
        case "text":
        default:
            component = (
                <TextInput label={!option.displayAsSeparateSection ? renderProps.label : null}
                    placeholder={renderProps.placeholder}
                    disabled={renderProps.disabled}
                    value={value}
                    onChange={e => setValue(e.target.value)} />
            );
            break;
    }

    const focused = !!requestedOption && option.id === requestedOption;

    const elem = <OptionWrapper className={(focused && !option.displayAsSeparateSection) ? 'focused' : ''}>
        {component}
        {typeof renderProps.description?.props === 'undefined' && <p style={{ marginBottom: '0.7rem' }}>{renderProps.description}</p>}
        {typeof renderProps.description?.props !== 'undefined' && renderProps.description}
    </OptionWrapper>;

    if (option.displayAsSeparateSection) {
        return <SettingsOption heading={renderProps.label} focused={focused}>
            {elem}
            {option.resettable && <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1rem',
            }}>
                <Button size="xs" compact variant="light" onClick={() => setValue(option.defaultValue)}>
                    <FormattedMessage defaultMessage="Reset to default" />
                </Button>
            </div>}
        </SettingsOption>;
    }

    return elem;
}

export default function SettingsTab(props: {
    name: string;
    children?: any;
}) {
    const context = useAppContext();

    const optionSets = [...globalOptions, ...pluginMetadata]
        .map(metadata => ({
            id: metadata.id,
            name: metadata.name,
            description: metadata.description,
            options: metadata.options.filter(o => o.displayOnSettingsScreen === props.name),
            resettable: metadata.options.filter(o => o.displayOnSettingsScreen === props.name && o.resettable && !o.displayAsSeparateSection).length > 0,
            collapsed: metadata.options.filter(o => o.displayOnSettingsScreen === props.name && o.displayAsSeparateSection).length > 0,
            hidden: typeof metadata.hidden === 'function' ? metadata.hidden(context.chat.options) : metadata.hidden,
        }))
        .filter(({ options, hidden }) => options.length && !hidden);

    return (
        <Tabs.Panel value={props.name}>
            <Settings>
                {props.children}
                {optionSets.map(({ name, id, description, options, resettable, collapsed }) => <>
                    <SettingsOption heading={name} description={description} collapsed={collapsed} key={id}>
                        {options.map(o => <PluginOptionWidget
                            pluginID={id}
                            option={o}
                            chatID={context.id}
                            context={context}
                            key={id + "." + o.id} />)}
                        {resettable && <div style={{
                            display: 'flex',
                            gap: '1rem',
                            marginTop: '1rem',
                        }}>
                            <Button size="xs" compact variant="light" onClick={() => context.chat.resetPluginOptions(id, context.id)}>
                                <FormattedMessage defaultMessage="Reset to default" />
                            </Button>
                        </div>}
                    </SettingsOption>
                </>)}
            </Settings>
        </Tabs.Panel>
    );
}
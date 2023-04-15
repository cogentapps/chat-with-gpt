import { useCallback, useEffect, useRef, useState } from "react";
import { Context, useAppContext } from "../context";
import { RenderProps } from "./render-props";

export function useOption<T=any>(groupID: string, optionID: string, chatID?: string): [T, (value: T) => void, RenderProps, number] {
    const context = useAppContext();

    const [value, setValue] = useState(context.chat.options.getValidatedOption(groupID, optionID, chatID));
    const [version, setVersion] = useState(0);

    const timer = useRef<any>();

    const onUpdate = useCallback((updatedGroupID: string) => {
        if (groupID === updatedGroupID) {
            setValue(context.chat.options.getValidatedOption(groupID, optionID, chatID));
            setVersion(v => v + 1);
        } else {
            clearTimeout(timer.current);
            timer.current = setTimeout(() => {
                setValue(context.chat.options.getValidatedOption(groupID, optionID, chatID));
                setVersion(v => v + 1);
            }, 500);
        }
    }, [groupID, optionID, chatID]);

    useEffect(() => {
        context.chat.on('plugin-options-update', onUpdate);
        return () => {
            context.chat.off('plugin-options-update', onUpdate);
        };
    }, [chatID, onUpdate]);

    const setOptionValue = useCallback((value: any) => {
        context.chat.options.setOption(groupID, optionID, value, chatID);
    }, [groupID, optionID, chatID]);

    const option = context.chat.options.findOption(groupID, optionID)!;

    return [
        value,
        setOptionValue,
        typeof option.renderProps === 'function' ? option.renderProps(value, context.chat.options, context) : option.renderProps,
        version,
    ];
}
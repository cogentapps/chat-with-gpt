import { Button } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useTTS } from "../core/tts/use-tts";
import { useAppDispatch } from "../store";
import { setTabAndOption } from "../store/settings-ui";

const autoplayed = new Set<string>();

export function TTSButton(props: { id: string, selector: string, complete: boolean, autoplay?: boolean }) {
    const dispatch = useAppDispatch();
    const { key, state, voice, autoplayEnabled, play, pause, cancel, setSourceElement, setComplete } = useTTS();
    const [clicked, setClicked] = useState(false);

    const onClick = useCallback(() => {
        setClicked(true);

        if (!voice) {
            dispatch(setTabAndOption({ tab: 'speech', option: 'service' }));
            return;
        }

        if (!state || key !== props.id) {
            setSourceElement(props.id, document.querySelector(props.selector)!);
            play();
        } else {
            cancel();
        }
        setComplete(props.complete);
    }, [state, key, props.id, props.selector, props.complete, voice]); //

    useEffect(() => {
        if (key === props.id) {
            setComplete(props.complete);
        }
    }, [key, props.id, props.complete]);

    useEffect(() => {
        if (autoplayEnabled && props.autoplay && key !== props.id && voice && !clicked && !autoplayed.has(props.id) && document.visibilityState === 'visible') {
            autoplayed.add(props.id);
            setSourceElement(props.id, document.querySelector(props.selector)!);
            play();
        }
    }, [clicked, key, voice, autoplayEnabled, props.id, props.selector, props.complete, props.autoplay]);

    let active = state && key === props.id;

    return (<>
        <Button variant="subtle" size="sm" compact onClickCapture={onClick} loading={active && state?.buffering}>
            {!active && <i className="fa fa-headphones" />}
            {!active && <span>
                <FormattedMessage defaultMessage="Play" description="Label for the button that starts text-to-speech playback" />
            </span>}
            {active && state?.buffering && <span>
                <FormattedMessage defaultMessage="Loading audio..." description="Message indicating that text-to-speech audio is buffering" />
            </span>}
            {active && !state?.buffering && <span>
                <FormattedMessage defaultMessage="Stop" description="Label for the button that stops text-to-speech playback" />
            </span>}
        </Button>
    </>);
}

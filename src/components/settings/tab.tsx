import styled from "@emotion/styled";
import { Tabs } from "@mantine/core";

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

export default function SettingsTab(props: {
    name: string;
    children?: any;
}) {
    return (
        <Tabs.Panel value={props.name}>
            <Settings>
                {props.children}
            </Settings>
        </Tabs.Panel>
    );
}
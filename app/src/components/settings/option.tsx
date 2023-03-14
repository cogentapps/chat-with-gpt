export default function SettingsOption(props: {
    focused?: boolean;
    heading?: string;
    children?: any;
    span?: number;
}) {
    return (
        <section className={props.focused ? 'focused' : ''}>
            {props.heading && <h3>{props.heading}</h3>}
            {props.children}
        </section>
    );
}
export default function SettingsOption(props: {
    focused?: boolean;
    heading?: string;
    description?: any;
    children?: any;
    span?: number;
    collapsed?: boolean;
}) {
    if (!props.heading || props.collapsed) {
        return props.children;
    }

    return (
        <section className={props.focused ? 'focused' : ''}>
            {props.heading && <h3>{props.heading}</h3>}
            {props.description && <div style={{
                fontSize: "90%",
                opacity: 0.9,
                marginTop: '-0.5rem',
            }}>
                {props.description}
            </div>}
            {props.children}
        </section>
    );
}
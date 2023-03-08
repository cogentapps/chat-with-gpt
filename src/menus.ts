export interface MenuItem {
    label: string;
    link: string;
    icon?: string;
}

export const primaryMenu: MenuItem[] = [
    {
        label: "About this app",
        link: "/about",
    },
    {
        label: "ChatGPT Prompts",
        link: "https://github.com/f/awesome-chatgpt-prompts",
        icon: "external-link-alt",
    },
];

export const secondaryMenu: MenuItem[] = [
    {
        label: "Discord",
        link: "https://discord.gg/mS5QvKykvv",
        icon: "discord fab",
    },
    {
        label: "GitHub",
        link: "https://github.com/cogentapps/chat-with-gpt",
        icon: "github fab",
    },
];
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PersistGate } from 'redux-persist/integration/react';
import { AppContextProvider } from './core/context';
import store, { persistor } from './store';

import ChatPage from './components/pages/chat';
import LandingPage from './components/pages/landing';

import './index.scss';

const router = createBrowserRouter([
    {
        path: "/",
        element: <AppContextProvider>
            <LandingPage landing={true} />
        </AppContextProvider>,
    },
    {
        path: "/chat/:id",
        element: <AppContextProvider>
            <ChatPage />
        </AppContextProvider>,
    },
    {
        path: "/s/:id",
        element: <AppContextProvider>
            <ChatPage share={true} />
        </AppContextProvider>,
    },
    {
        path: "/s/:id/*",
        element: <AppContextProvider>
            <ChatPage share={true} />
        </AppContextProvider>,
    },
]);

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

async function loadLocaleData(locale: string) {
    const response = await fetch(`/lang/${locale}.json`);
    if (!response.ok) {
        throw new Error("Failed to load locale data");
    }
    const messages: any = await response.json();
    for (const key of Object.keys(messages)) {
        if (typeof messages[key] !== 'string') {
            messages[key] = messages[key].defaultMessage;
        }
    }
    return messages;
}

async function bootstrapApplication() {
    const locale = navigator.language;

    let messages: any;
    try {
        messages = await loadLocaleData(locale.toLocaleLowerCase());
    } catch (e) {
        console.warn("No locale data for", locale);
    }

    root.render(
        <React.StrictMode>
            <IntlProvider locale={navigator.language} defaultLocale="en-GB" messages={messages}>
                <MantineProvider theme={{ colorScheme: "dark" }}>
                    <Provider store={store}>
                        <PersistGate loading={null} persistor={persistor}>
                            <ModalsProvider>
                                <RouterProvider router={router} />
                            </ModalsProvider>
                        </PersistGate>
                    </Provider>
                </MantineProvider>
            </IntlProvider>
        </React.StrictMode>
    );
}

bootstrapApplication();
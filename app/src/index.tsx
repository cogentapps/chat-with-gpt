import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PersistGate } from 'redux-persist/integration/react';

import AboutPage from './components/pages/about';
import ChatPage from './components/pages/chat';
import LandingPage from './components/pages/landing';
import { AppContextProvider } from './context';
import store, { persistor } from './store';

import './backend';
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
    {
        path: "/about",
        element: <AppContextProvider>
            <AboutPage />
        </AppContextProvider>,
    },
]);

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

async function loadLocaleData(locale: string) {
    const messages = await fetch(`/lang/${locale}.json`);
    if (!messages.ok) {
        throw new Error("Failed to load locale data");
    }
    return messages.json()
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
            <IntlProvider locale={navigator.language} messages={messages}>
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
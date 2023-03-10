import React from 'react';
import ReactDOM from 'react-dom/client';
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { AppContextProvider } from './context';
import store, { persistor } from './store';
import LandingPage from './components/pages/landing';
import ChatPage from './components/pages/chat';
import AboutPage from './components/pages/about';

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

root.render(
    <React.StrictMode>
        <MantineProvider theme={{ colorScheme: "dark" }}>
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <ModalsProvider>
                        <RouterProvider router={router} />
                    </ModalsProvider>
                </PersistGate>
            </Provider>
        </MantineProvider>
    </React.StrictMode>
);
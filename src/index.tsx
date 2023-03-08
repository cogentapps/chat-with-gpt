import React from 'react';
import ReactDOM from 'react-dom/client';
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { AppContextProvider } from './context';
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
            <ModalsProvider>
                <RouterProvider router={router} />
            </ModalsProvider>
        </MantineProvider>
    </React.StrictMode>
);
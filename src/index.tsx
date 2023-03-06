import React from 'react';
import ReactDOM from 'react-dom/client';
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import ChatPage from './components/page';
import { AppContextProvider } from './context';
import './index.scss';

const router = createBrowserRouter([
    {
        path: "/",
        element: <ChatPage landing={true} />,
    },
    {
        path: "/chat/:id",
        element: <ChatPage />,
    },
    {
        path: "/s/:id",
        element: <ChatPage share={true} />,
    },
    {
        path: "/s/:id/*",
        element: <ChatPage share={true} />,
    },
]);

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <MantineProvider theme={{ colorScheme: "dark" }}>
            <AppContextProvider>
                <ModalsProvider>
                    <RouterProvider router={router} />
                </ModalsProvider>
            </AppContextProvider>
        </MantineProvider>
    </React.StrictMode>
);
// @ts-ignore
import { EventSource } from "launchdarkly-eventsource";
import express from 'express';
import { apiKey } from ".";

export async function streamingHandler(req: express.Request, res: express.Response) {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    });

    const eventSource = new EventSource('https://api.openai.com/v1/chat/completions', {
        method: "POST",
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...req.body,
            stream: true,
        }),
    });

    eventSource.addEventListener('message', async (event: any) => {
        res.write(`data: ${event.data}\n\n`);
        res.flush();

        if (event.data === '[DONE]') {
            res.end();
            eventSource.close();
        }
    });

    eventSource.addEventListener('error', (event: any) => {
        res.end();
    });

    eventSource.addEventListener('abort', (event: any) => {
        res.end();
    });

    req.on('close', () => {
        eventSource.close();
    });

    res.on('error', e => {
        eventSource.close();
    });
}
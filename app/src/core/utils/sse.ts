/**
 * This class is an implementation of Server-Side Events (SSE) that allows sending POST request bodies.
 * 
 * It's an adapted version of an open-source implementation, and it's designed to support streaming
 * completions for OpenAI requests
 * 
 * Original Copyright:
 * Copyright (C) 2016 Maxime Petazzoni <maxime.petazzoni@bulix.org>.
 * All rights reserved.
 */
export default class SSE {
    // Constants representing the ready state of the SSE connection
    public INITIALIZING = -1;
    public CONNECTING = 0;
    public OPEN = 1;
    public CLOSED = 2;

    // Connection settings
    private headers = this.options.headers || {};
    private payload = this.options.payload !== undefined ? this.options.payload : '';
    private method = this.options.method ? this.options.method : (this.payload ? 'POST' : 'GET');
    private withCredentials = !!this.options.withCredentials;

    // Internal properties
    private FIELD_SEPARATOR = ':';
    private listeners: any = {};

    private xhr: any = null;
    private readyState = this.INITIALIZING;
    private progress = 0;
    private chunk = '';

    public constructor(public url: string, public options: any) { }

    /**
     * Starts streaming data from the SSE connection.
     */
    public stream = () => {
        this.setReadyState(this.CONNECTING);

        this.xhr = new XMLHttpRequest();
        this.xhr.addEventListener('progress', this.onStreamProgress);
        this.xhr.addEventListener('load', this.onStreamLoaded);
        this.xhr.addEventListener('readystatechange', this.checkStreamClosed);
        this.xhr.addEventListener('error', this.onStreamFailure);
        this.xhr.addEventListener('abort', this.onStreamAbort);
        this.xhr.open(this.method, this.url);
        for (var header in this.headers) {
            this.xhr.setRequestHeader(header, this.headers[header]);
        }
        this.xhr.withCredentials = this.withCredentials;
        this.xhr.send(this.payload);
    };

    /**
     * Closes the SSE connection.
     */
    public close = () => {
        if (this.readyState === this.CLOSED) {
            return;
        }

        try {
            this.xhr.abort();
            this.xhr = null;
            this.setReadyState(this.CLOSED);
        } catch (e) {
            console.error(e);
        }
    };

    /**
     * Processes incoming data from the SSE connection and dispatches events based on the received data.
     */
    private onStreamProgress = (e: any) => {
        if (!this.xhr) {
            return;
        }

        if (this.xhr.status !== 200) {
            this.onStreamFailure(e);
            return;
        }

        if (this.readyState === this.CONNECTING) {
            this.dispatchEvent(new CustomEvent('open'));
            this.setReadyState(this.OPEN);
        }

        const data = this.xhr.responseText.substring(this.progress);
        this.progress += data.length;
        data.split(/(\r\n|\r|\n){2}/g).forEach((part: string) => {
            if (part.trim().length === 0) {
                this.dispatchEvent(this.parseEventChunk(this.chunk.trim()));
                this.chunk = '';
            } else {
                this.chunk += part;
            }
        });
    };

    /**
     * Parses a received SSE event chunk and constructs an event object based on the chunk data.
     */
    private parseEventChunk = (chunk: string) => {
        if (!chunk || chunk.length === 0) {
            return null;
        }

        const e: any = { 'id': null, 'retry': null, 'data': '', 'event': 'message' };
        chunk.split(/\n|\r\n|\r/).forEach((line: string) => {
            line = line.trimRight();
            const index = line.indexOf(this.FIELD_SEPARATOR);
            if (index <= 0) {
                // Line was either empty, or started with a separator and is a comment.
                // Either way, ignore.
                return;
            }

            const field = line.substring(0, index);
            if (!(field in e)) {
                return;
            }

            const value = line.substring(index + 1).trimLeft();
            if (field === 'data') {
                e[field] += value;
            } else {
                e[field] = value;
            }
        });

        const event: any = new CustomEvent(e.event);
        event.data = e.data;
        event.id = e.id;
        return event;
    };

    /**
     * Handles the 'load' event for the SSE connection and processes the remaining data.
     */
    private onStreamLoaded = (e: any) => {
        this.onStreamProgress(e);

        // Parse the last chunk.
        this.dispatchEvent(this.parseEventChunk(this.chunk));
        this.chunk = '';
    };

    /**
     * Adds an event listener for a given event type.
     */
    public addEventListener = (type: string, listener: any) => {
        if (this.listeners[type] === undefined) {
            this.listeners[type] = [];
        }

        if (this.listeners[type].indexOf(listener) === -1) {
            this.listeners[type].push(listener);
        }
    };

    /**
     * Removes an event listener for a given event type.
     */
    public removeEventListener = (type: string, listener: any) => {
        if (this.listeners[type] === undefined) {
            return;
        }

        const filtered: any[] = [];
        this.listeners[type].forEach((element: any) => {
            if (element !== listener) {
                filtered.push(element);
            }
        });
        if (filtered.length === 0) {
            delete this.listeners[type];
        } else {
            this.listeners[type] = filtered;
        }
    };

    /**
     * Dispatches an event to all registered listeners.
     */
    private dispatchEvent = (e: any) => {
        if (!e) {
            return true;
        }

        e.source = this;

        const onHandler = 'on' + e.type;
        if (this.hasOwnProperty(onHandler)) {
            // @ts-ignore
            this[onHandler].call(this, e);
            if (e.defaultPrevented) {
                return false;
            }
        }

        if (this.listeners[e.type]) {
            return this.listeners[e.type].every((callback: (arg0: any) => void) => {
                callback(e);
                return !e.defaultPrevented;
            });
        }

        return true;
    };

    /**
     * Sets the ready state of the SSE connection and dispatches a 'readystatechange' event.
     */
    private setReadyState = (state: number) => {
        const event = new CustomEvent<any>('readystatechange');
        // @ts-ignore
        event.readyState = state;
        this.readyState = state;
        this.dispatchEvent(event);
    };

    /**
     * Handles an error during the SSE connection and dispatches an 'error' event.
     */
    private onStreamFailure = (e: { currentTarget: { response: any; }; }) => {
        const event = new CustomEvent('error');
        // @ts-ignore
        event.data = e.currentTarget.response;
        this.dispatchEvent(event);
        this.close();
    }

    /**
     * Handles an abort event during the SSE connection and dispatches an 'abort' event.
     */
    private onStreamAbort = (e: any) => {
        this.dispatchEvent(new CustomEvent('abort'));
        this.close();
    }

    /**
     * Checks if the SSE connection is closed and sets the ready state to CLOSED if needed.
     */
    private checkStreamClosed = () => {
        if (!this.xhr) {
            return;
        }

        if (this.xhr.readyState === XMLHttpRequest.DONE) {
            this.setReadyState(this.CLOSED);
        }
    };
};
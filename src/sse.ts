/**
 * Copyright (C) 2016 Maxime Petazzoni <maxime.petazzoni@bulix.org>.
 * All rights reserved.
 */

export default class SSE {
    public INITIALIZING = -1;
    public CONNECTING = 0;
    public OPEN = 1;
    public CLOSED = 2;

    public headers = this.options.headers || {};
    public payload = this.options.payload !== undefined ? this.options.payload : '';
    public method = this.options.method || (this.payload && 'POST' || 'GET');
    public withCredentials = !!this.options.withCredentials;

    public FIELD_SEPARATOR = ':';
    public listeners: any = {};

    public xhr: any = null;
    public readyState = this.INITIALIZING;
    public progress = 0;
    public chunk = '';

    public constructor(public url: string, public options: any) {}

    public addEventListener = (type: string, listener: any) => {
        if (this.listeners[type] === undefined) {
            this.listeners[type] = [];
        }

        if (this.listeners[type].indexOf(listener) === -1) {
            this.listeners[type].push(listener);
        }
    };

    public removeEventListener = (type: string, listener: any) => {
        if (this.listeners[type] === undefined) {
            return;
        }

        var filtered: any[] = [];
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

    public dispatchEvent = (e: any) => {
        if (!e) {
            return true;
        }

        e.source = this;

        var onHandler = 'on' + e.type;
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

    public _setReadyState = (state: number) => {
        var event = new CustomEvent<any>('readystatechange');
        // @ts-ignore
        event.readyState = state;
        this.readyState = state;
        this.dispatchEvent(event);
    };

    public _onStreamFailure = (e: { currentTarget: { response: any; }; }) => {
        var event = new CustomEvent('error');
        // @ts-ignore
        event.data = e.currentTarget.response;
        this.dispatchEvent(event);
        this.close();
    }

    public _onStreamAbort = (e: any) => {
        this.dispatchEvent(new CustomEvent('abort'));
        this.close();
    }

    public _onStreamProgress = (e: any) => {
        if (!this.xhr) {
            return;
        }

        if (this.xhr.status !== 200) {
            this._onStreamFailure(e);
            return;
        }

        if (this.readyState == this.CONNECTING) {
            this.dispatchEvent(new CustomEvent('open'));
            this._setReadyState(this.OPEN);
        }

        var data = this.xhr.responseText.substring(this.progress);
        this.progress += data.length;
        data.split(/(\r\n|\r|\n){2}/g).forEach((part: string) => {
            if (part.trim().length === 0) {
                this.dispatchEvent(this._parseEventChunk(this.chunk.trim()));
                this.chunk = '';
            } else {
                this.chunk += part;
            }
        });
    };

    public _onStreamLoaded = (e: any) => {
        this._onStreamProgress(e);

        // Parse the last chunk.
        this.dispatchEvent(this._parseEventChunk(this.chunk));
        this.chunk = '';
    };

    /**
     * Parse a received SSE event chunk into a constructed event object.
     */
    public _parseEventChunk = (chunk: string) => {
        if (!chunk || chunk.length === 0) {
            return null;
        }

        var e: any = { 'id': null, 'retry': null, 'data': '', 'event': 'message' };
        chunk.split(/\n|\r\n|\r/).forEach((line: string) => {
            line = line.trimRight();
            var index = line.indexOf(this.FIELD_SEPARATOR);
            if (index <= 0) {
                // Line was either empty, or started with a separator and is a comment.
                // Either way, ignore.
                return;
            }

            var field = line.substring(0, index);
            if (!(field in e)) {
                return;
            }

            var value = line.substring(index + 1).trimLeft();
            if (field === 'data') {
                e[field] += value;
            } else {
                e[field] = value;
            }
        });

        var event: any = new CustomEvent(e.event);
        event.data = e.data;
        event.id = e.id;
        return event;
    };

    public _checkStreamClosed = () => {
        if (!this.xhr) {
            return;
        }

        if (this.xhr.readyState === XMLHttpRequest.DONE) {
            this._setReadyState(this.CLOSED);
        }
    };

    public stream = () => {
        this._setReadyState(this.CONNECTING);

        this.xhr = new XMLHttpRequest();
        this.xhr.addEventListener('progress', this._onStreamProgress);
        this.xhr.addEventListener('load', this._onStreamLoaded);
        this.xhr.addEventListener('readystatechange', this._checkStreamClosed);
        this.xhr.addEventListener('error', this._onStreamFailure);
        this.xhr.addEventListener('abort', this._onStreamAbort);
        this.xhr.open(this.method, this.url);
        for (var header in this.headers) {
            this.xhr.setRequestHeader(header, this.headers[header]);
        }
        this.xhr.withCredentials = this.withCredentials;
        this.xhr.send(this.payload);
    };

    public close = () => {
        if (this.readyState === this.CLOSED) {
            return;
        }

        this.xhr.abort();
        this.xhr = null;
        this._setReadyState(this.CLOSED);
    };
};
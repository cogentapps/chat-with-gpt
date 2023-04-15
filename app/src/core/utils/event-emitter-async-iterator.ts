import EventEmitter from 'events';

export interface EventEmitterAsyncIteratorOutput<T> {
    eventName: string;
    value: T;
}

/**
 * The EventEmitterAsyncIterator class provides a way to create an async iterator
 * that listens to multiple events from an EventEmitter instance, and yields
 * the emitted event name and value as an EventEmitterAsyncIteratorOutput object.
 *
 * This class implements the AsyncIterableIterator interface, which allows it
 * to be used in for-await-of loops and other asynchronous iteration contexts.
 *
 * @typeparam T - The type of values emitted by the events.
 *
 * @example
 * const eventEmitter = new EventEmitter();
 * const asyncIterator = new EventEmitterAsyncIterator(eventEmitter, ['event1', 'event2']);
 *
 * for await (const event of asyncIterator) {
 *   console.log(`Received event: ${event.eventName} with value: ${event.value}`);
 * }
 */

export class EventEmitterAsyncIterator<T> implements AsyncIterableIterator<EventEmitterAsyncIteratorOutput<T>> {
    private eventQueue: EventEmitterAsyncIteratorOutput<T>[] = [];
    private resolveQueue: ((value: IteratorResult<EventEmitterAsyncIteratorOutput<T>>) => void)[] = [];

    /**
     * Constructor takes an EventEmitter instance and an array of event names to listen to.
     * For each event name, it binds the pushEvent method with the eventName, which
     * will be called when the event is emitted.
     *
     * @param eventEmitter - The EventEmitter instance to listen to events from.
     * @param eventNames - An array of event names to listen to.
     */
    constructor(private eventEmitter: EventEmitter, eventNames: string[]) {
        for (const eventName of eventNames) {
            this.eventEmitter.on(eventName, this.pushEvent.bind(this, eventName));
        }
    }

    /**
     * The next method is called when the iterator is requested to return the next value.
     * If there is an event in the eventQueue, it will return the next event from the queue.
     * If the eventQueue is empty, it will return a Promise that resolves when a new event is received.
     *
     * @returns A Promise that resolves with the next event or waits for a new event if the queue is empty.
     */
    async next(): Promise<IteratorResult<EventEmitterAsyncIteratorOutput<T>>> {
        if (this.eventQueue.length > 0) {
            const value = this.eventQueue.shift();
            return { value: value as EventEmitterAsyncIteratorOutput<T>, done: false };
        } else {
            return new Promise<IteratorResult<EventEmitterAsyncIteratorOutput<T>>>(resolve => {
                this.resolveQueue.push(value => {
                    resolve(value);
                });
            });
        }
    }

    /**
     * The pushEvent method is called when an event is emitted from the EventEmitter.
     * If there is a pending Promise in the resolveQueue, it resolves the Promise with the new event.
     * If there is no pending Promise, it adds the event to the eventQueue.
     *
     * @param eventName - The name of the emitted event.
     * @param value - The value emitted with the event.
     */
    private pushEvent(eventName: string, value: T): void {
        const output: EventEmitterAsyncIteratorOutput<T> = {
            eventName,
            value,
        };
        if (this.resolveQueue.length > 0) {
            const resolve = this.resolveQueue.shift();
            if (resolve) {
                resolve({ value: output, done: false });
            }
        } else {
            this.eventQueue.push(output);
        }
    }

    [Symbol.asyncIterator](): AsyncIterableIterator<EventEmitterAsyncIteratorOutput<T>> {
        return this;
    }
}

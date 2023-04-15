import { sleep } from '.';

/**
 * AsyncLoop class provides a mechanism to execute a given function
 * asynchronously in a loop with a specified delay between each execution.
 * Unlike setInterval, it ensures that each iteration finishes before
 * starting the next one.
 */

export class AsyncLoop {
    public cancelled = false;

    /**
     * Creates a new instance of the AsyncLoop class.
     * @param {Function} handler - The function to be executed in the loop.
     * @param {number} pauseBetween - The delay (in milliseconds) between each execution of the handler. Default is 1000 ms.
     */
    constructor(private handler: any, private pauseBetween: number = 1000) {
    }

    /**
     * Starts the asynchronous loop by calling the loop() method.
     */
    public start() {
        this.loop().then(() => { });
    }

    /**
     * The main loop function that executes the given handler function
     * while the loop is not cancelled. It catches any errors thrown by
     * the handler function and logs them to the console.
     * @private
     * @returns {Promise<void>} A Promise that resolves when the loop is cancelled.
     */
    private async loop() {
        while (!this.cancelled) {
            try {
                await this.handler();
            } catch (e) {
                console.error(e);
            }

            await sleep(this.pauseBetween);
        }
    }
}

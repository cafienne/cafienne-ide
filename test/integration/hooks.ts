type logEvent = {
    level: string;
    message: string;
    timestamp: string;
}

const ignoreEvents = [
    /Form submission canceled because the form is not connected/, // filter out those messages triggered by faulty button
    /: no source content to parse/, // filter out those warnings due to parallel execution;
]

export const mochaHooks = {
    afterEach: async function () {
        console.log('Running after test');

        const logs = (<logEvent[]>await browser.getLogs('browser'))
            .filter(e => !ignoreEvents.some(m => e.message.match(m)));

        await expect(logs).toStrictEqual([]);
    }
};

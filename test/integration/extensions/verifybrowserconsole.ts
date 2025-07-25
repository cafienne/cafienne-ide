type logEvent = {
    level: string;
    message: string;
    timestamp: string;
}

const ignoreEvents = [
    /: no source content to parse/, // filter out those warnings due to parallel execution;
]

export const mochaHooks = {
    afterEach: async function () {
        this.test.title = 'Verify browser console logs';

        const logs = (<logEvent[]>await browser.getLogs('browser'))
            .filter(e => !ignoreEvents.some(m => e.message.match(m)));

        await expect(logs).toStrictEqual([]);
    }
};

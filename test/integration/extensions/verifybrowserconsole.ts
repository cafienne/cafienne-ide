type logEvent = {
    level: string;
    message: string;
    timestamp: string;
}

const ignoreEvents = [
    /: no source content to parse/, // filter out those warnings due to parallel execution;
    /CaseTeam: Did not receive a file for [^\s]*.caseteam/, // warning due to problem in caseteam editor with remove of team
    /Still using [^\s]*.caseteam \?\?\?  Better not, since it no longer exists in the server .../, // same as above
]

export const mochaHooks = {
    afterEach: async function () {
        this.test.title = 'Verify browser console logs';

        const logs = (<logEvent[]>await browser.getLogs('browser'))
            .filter(e => !ignoreEvents.some(m => e.message.match(m)));

        await expect(logs).toStrictEqual([]);
    }
};

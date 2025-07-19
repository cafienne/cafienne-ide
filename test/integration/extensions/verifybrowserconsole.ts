type logEvent = {
    level: string;
    message: string;
    timestamp: string;
}

// filter out those warnings
const ignoreEvents = [
    /: no source content to parse/, // due to parallel execution;
    /Still using [^\s]* \?\?\?  Better not, since it no longer exists in the server .../, // due to parallel execution
    /Cannot add renderer again found/, // due to issues in TypeEditor
    /Updating the task name to/, // not a real warning, should be info?
    /CaseTeam: Did not receive a file for [^\s]*.caseteam/, // warning due to problem in caseteam editor with remove of team
    /Still using [^\s]*.caseteam \?\?\?  Better not, since it no longer exists in the server .../, // same as above
]

export const mochaHooks = {
    afterEach: async function () {
        this.test.title = `Verify browser console logs for : ${this.currentTest.title}`;

        const logs = (<logEvent[]>await browser.getLogs('browser'))
            .filter(e => !ignoreEvents.some(m => e.message.match(m)));

        await expect(logs).toStrictEqual([]);
    }
};

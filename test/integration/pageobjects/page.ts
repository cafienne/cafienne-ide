/**
* main page object containing all methods, selectors and functionality
* that is shared across all page objects
*/
export default class Page {
    /**
    * Opens a sub page of the page
    */
    public async open(model: string | undefined) {
        if (model == undefined) {
            await browser.url(`http://localhost:3081/`);
        }
        else {
            await browser.url(`http://localhost:3081/#${model}`);
        }
    }
}

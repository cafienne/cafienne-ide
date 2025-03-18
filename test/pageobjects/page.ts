import { browser } from '@wdio/globals'

/**
* main page object containing all methods, selectors and functionality
* that is shared across all page objects
*/
export default class Page {
    /**
    * Opens a sub page of the page
    */
    public open (model?: string) {
        if (model === undefined) {
            return browser.url(`http://localhost:3081/`)
        }
        return browser.url(`http://localhost:3081/#${model}`)
    }
}

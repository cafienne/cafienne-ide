export default class PropertiesPage {
    constructor(public locator: ChainablePromiseElement) {
    }

    propertyLocatorXP(name: 'Repeat' | 'Human Task Name', postfix: string) {
        return this.locator.$(`.//div[contains(@class, "properties-container")]/div[.//label[text() = "${name}"]]${postfix}`);
    }

    get nameInput() {
        return this.propertyLocatorXP('Human Task Name', '/textarea');
    }

    get repeatCheck() {
        return this.propertyLocatorXP('Repeat', '//input[@type = "checkbox"]');
    }

    get repeatContextInput() {
        return this.propertyLocatorXP('Repeat', '/div/div/label[@class = "valuelabel"]');
    }
    get repeatContextZoomButton() {
        return this.propertyLocatorXP('Repeat', '/div/div/button[@class = "zoombt"]');
    }

    get closeButton() {
        return this.locator.$('div.formclose > img');
    }


}

export default abstract class TestUtil {

    static async getElementId(element: WebdriverIO.Element | ChainablePromiseElement) {
        const viewId = await element.$('g > g[id]').getAttribute('id');
        const elementId = (viewId.match(/[^-]*/))[0];
        return elementId;
    }
}

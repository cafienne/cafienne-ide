import CaseModelerPage from "../pageobjects/casemodeler.page";
import IDEPage from "../pageobjects/ide.page";

browser.addCommand('resize', async function (
    this: WebdriverIO.Element,
    width: number,
    height: number): Promise<void> {
    const size = await this.getSize();
    await this.$('text').click();

    const resizer = IDEPage.currentModelEditor.$(`.resizebox[element=${await getElementId(this)}] div[handle="se"] div`);
    const targetPosition = {
        x: width - size.width,
        y: height - size.height,
    };
    return await resizer.dragAndDrop(targetPosition);
}, true);

browser.addCommand('dropInCanvas$', async function (
    this: WebdriverIO.Element,
    target: { x: number, y: number } | ChainablePromiseElement,
    refMove?: { x: number, y: number }): Promise<WebdriverIO.Element | void> {
    const shapePosition = await this.getLocation();
    const canvasPosition = await CaseModelerPage.canvas.getLocation();

    const oldPropertyIds = await IDEPage.currentModelEditor.$$('div.divMovableEditors > .properties').map(element => element.getAttribute('id'));

    let targetPosition: { x: number, y: number };
    if (typeof target === "object" && "getLocation" in target && typeof (target as any).getLocation === "function") {
        targetPosition = await (target as ChainablePromiseElement).getLocation();
    }
    else {
        const coords = target as { x: number, y: number };
        targetPosition = {
            x: canvasPosition.x + coords.x,
            y: canvasPosition.y + coords.y,
        };
    }

    targetPosition.x -= shapePosition.x;
    targetPosition.y -= shapePosition.y;

    if (refMove) {
        targetPosition.x += refMove.x;
        targetPosition.y += refMove.y;
    }
    await this.dragAndDrop(targetPosition);

    const newIds = (await IDEPage.currentModelEditor.$$('div.divMovableEditors > .properties ').map(element => element.getAttribute('id')))
        .filter(id => oldPropertyIds.indexOf(id) == -1);

    if (newIds.length > 0) {
        const elementId = newIds[0].match(/propertiesmenu-(.*)/)[1];

        return await CaseModelerPage.canvas.$(`g:has(>g[id^='${elementId}-'])`).getElement();
    }
    else return undefined;
}, true);


browser.addCommand('haloItem$', async function (
    this: WebdriverIO.Element,
    namePrefix: string): Promise<WebdriverIO.Element> {
    await this.$('.cmmn-bold-text,.cmmn-text').click();
    return IDEPage.currentModelEditor.$(`.divHalos .halobox[element='${await getElementId(this)}'] .haloitem[title^='${namePrefix}'] `).getElement();
}, true);

async function getElementId(element: WebdriverIO.Element) {
    const viewId = await element.$('g > g[id]').getAttribute('id');
    const elementId = (viewId.match(/[^-]*/))[0];
    return elementId;
}


import CaseModelerPage from '../pageobjects/casemodeler.page';
import IDEPage from "../pageobjects/ide.page";
import TestUtil from "../util/testutil";

browser.addCommand('resize', async function (
    this: WebdriverIO.Element,
    width: number,
    height: number): Promise<void> {
    const size = await this.getSize();
    await this.$('text').click();

    const resizer = IDEPage.currentModelEditor.$(`.resizebox[element=${await TestUtil.getElementId(this)}] div[handle="se"] div`);
    const move = {
        x: Math.trunc(width - size.width),
        y: Math.trunc(height - size.height),
    };
    return await resizer.dragAndDrop(move);
}, true);

browser.addCommand('dropInCanvas$', async function (
    this: WebdriverIO.Element,
    target: { x: number, y: number } | ChainablePromiseElement,
    refMove?: { x: number, y: number }): Promise<WebdriverIO.Element | void> {

    // dragging starts from the center of this
    const startPosition = await this.getLocation();

    if (await this.getTagName() != 'g') {
        const thisSize = await this.getSize();
        startPosition.x += thisSize.width / 2;
        startPosition.y += thisSize.height / 2;
    }
    const oldPropertyIds = await IDEPage.currentModelEditor.$$('div.divMovableEditors > .properties').map(element => element.getAttribute('id'));

    let targetPosition: { x: number, y: number };
    if (typeof target === "object" && typeof (target as any).getLocation === "function") {
        targetPosition = await (target as ChainablePromiseElement).getLocation();
    }
    else {
        const canvasPosition = await CaseModelerPage.canvas.getLocation();
        const coords = target as { x: number, y: number };
        targetPosition = {
            x: canvasPosition.x + coords.x,
            y: canvasPosition.y + coords.y,
        };
    }

    const dragMove = {
        x: Math.trunc(targetPosition.x - startPosition.x + (refMove?.x ?? 0)),
        y: Math.trunc(targetPosition.y - startPosition.y + (refMove?.y ?? 0)),
    };

    await this.dragAndDrop(dragMove);

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
    return IDEPage.currentModelEditor.$(`.divHalos .halobox[element='${await TestUtil.getElementId(this)}'] .haloitem[title^='${namePrefix}'] `).getElement();
}, true);



import TestUtil from '../util/testutil';
import IDEPage from './ide.page';
import PropertiesPage from './properties.page';

export type ShapeTitle = 'Human Task' | 'Case Task' | 'Process Task' | 'Milestone' | 'Timer Event' | 'User Event' | 'Stage' | 'Case File Item' | 'Text Annotation' | 'Entry Criterion' | 'Exit Criterion' | 'Reactivate Criterion';
export type Position = { x: number, y: number }

export class CaseModelerPage {
    dropShape(source: ShapeTitle, target: Position | ChainablePromiseElement, refMove?: Position): ChainablePromiseElement {
        return this.shape(source).dropInCanvas$(target, refMove);
    }

    public get canvas() {
        return IDEPage.currentModelEditor.$('svg[joint-selector="svg"]');
    }

    public shape(title: ShapeTitle) {
        return this.shapebox.$(`li[title="${title}"]`);
    }

    public get shapebox() {
        return IDEPage.currentModelEditor.$(".shapebox");
    }

    public get caseModel() {
        return IDEPage.currentModelEditor.$('[data-type="CasePlanView"]');
    }

    public async openRoleEditor() {
        return this.caseModel.haloItem$('Edit case team').click();
    }

    async getProperties(item: ChainablePromiseElement) {
        await item.haloItem$('Open properties of the ').click();
        const id = await TestUtil.getElementId(item);

        return new PropertiesPage(IDEPage.currentModelEditor.$(`div.divMovableEditors > .properties#propertiesmenu-${id}`));
    }

}

export default new CaseModelerPage();

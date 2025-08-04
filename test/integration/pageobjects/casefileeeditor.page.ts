import IDEPage from './ide.page';

export class CaseFileEditorrPage {
    private locator(post: string) {
        return IDEPage.currentModelEditor.$(`#typeeditorcontent ${post}`);
    }

    get addSiblingButton() {
        return this.locator('> div > img.add-sibling-icon');
    }

    get addChildButton() {
        return this.locator('> div > img.add-child-icon');
    }

    get selectedPropertyNameInput() {
        return this.locator('.type-container .property-selected .inputPropertyName');
    }

    get selectedPropertyTypeSelect() {
        return this.locator('.type-container .property-selected .selectType');
    }
    get selectedPropertyMultiplicitySelect() {
        return this.locator('.type-container .property-selected .selectMultiplicity');
    }

    async selectCaseFileItemWithIndex(index: number) {
        return this.locator(`> .type-container > .type-schema-container > :nth-child(${index}).property-renderer > div .input-name-container`).click();
    }
}

export default new CaseFileEditorrPage();

import Util from '../../../src/util/util';
import '../extensions/commands';
import CaseFileEditorPage from '../pageobjects/casefileeeditor.page';
import CaseFileItemSelectorDialog from '../pageobjects/casefileitemselector.dialog';
import CaseModelerPage from '../pageobjects/casemodeler.page';
import CaseTeamEditorPage from '../pageobjects/caseteameditor.page';
import HumantaskModelEditor from '../pageobjects/humantaskeditor.page';
import IDEPage from '../pageobjects/ide.page';
import ModelListPanel from '../pageobjects/modellist.page';

describe('Case modeler', async function () {
    before(async function () {
        await IDEPage.open();
    });

    it('Simulate Hello World case', async function () {
        const caseName = Util.createID('Hello_World');
        await ModelListPanel.createCaseModel(caseName);
        const caseModel = CaseModelerPage.caseModel;
        await caseModel.resize(800, 500);

        await CaseModelerPage.openRoleEditor();
        await CaseTeamEditorPage.addRole('Mountain');
        await CaseTeamEditorPage.addRole('River');
        await CaseTeamEditorPage.addRole('Forest');
        await CaseTeamEditorPage.addRole('Village');
        await CaseTeamEditorPage.close();

        const greetingTypeName = await addGreetingType();
        const humantaskmodelName = await buildSendResponseHumantask(greetingTypeName);

        await ModelListPanel.openCaseModel(caseName);

        // add Greeting case file item
        await buildCaseFile(greetingTypeName);

        const sendresponseTask = await (await ModelListPanel.getModel('humantask', humantaskmodelName)).dropInCanvas$(caseModel, { x: 160, y: 150 });
        const sendProperties = await CaseModelerPage.getProperties(sendresponseTask);
        await sendProperties.repeatCheck.click();
        await sendProperties.repeatContextZoomButton.click();

        // select Greeting in CFI dialog and confirm
        await CaseFileItemSelectorDialog.item('Greeting').click();
        await CaseFileItemSelectorDialog.confirmButton.click();
        await expect(sendProperties.repeatContextInput).toHaveText('Greeting')
        await sendProperties.closeButton.click();

        const readresponseTask = await CaseModelerPage.shape('Human Task').dropInCanvas$(caseModel, { x: 420, y: 100 });
        const readProperties = await CaseModelerPage.getProperties(readresponseTask);
        await readProperties.nameInput.addValue('Read Response');

        const entry = await sendresponseTask.haloItem$('Entry Criterion').dropInCanvas$(readresponseTask, { x: 0, y: 40 });
    });
});

async function buildSendResponseHumantask(greetingTypeName: string) {
    const humantaskModelName = Util.createID('SendResponse');
    await ModelListPanel.createHumantaskModel(humantaskModelName);

    await HumantaskModelEditor.descriptionInput.addValue('Documentation about SendResponse');
    await HumantaskModelEditor.inputModelParameterNameInput(1).addValue('Greeting');
    await HumantaskModelEditor.inputModelParameterTypeSelect(1).waitForDisplayed();
    await HumantaskModelEditor.inputModelParameterTypeSelect(1).selectByVisibleText(greetingTypeName);

    await HumantaskModelEditor.outputModelParameterNameInput(1).addValue('Response');

    await HumantaskModelEditor.generateUISchemeButton.click();

    return humantaskModelName;
}

async function buildCaseFile(greetingTypeName: string) {
    await CaseFileEditorPage.addSiblingButton.click();
    await CaseFileEditorPage.selectedPropertyNameInput.addValue('Greeting');
    await browser.keys('\t');
    await CaseFileEditorPage.selectedPropertyTypeSelect.selectByVisibleText(greetingTypeName);


    // add Response case file item
    await CaseFileEditorPage.selectCaseFileItemWithIndex(1);
    await CaseFileEditorPage.addSiblingButton.click();
    await CaseFileEditorPage.selectedPropertyNameInput.addValue('Response');
    await browser.keys('\t');
    await CaseFileEditorPage.selectedPropertyTypeSelect.selectByVisibleText('object');

    await CaseFileEditorPage.selectedPropertyNameInput.addValue('Message');
    await browser.keys('\t');
    await CaseFileEditorPage.selectedPropertyTypeSelect.selectByVisibleText('string');
    await browser.keys('\t');
    await browser.keys('\t');
    await browser.keys('\t');

    await CaseFileEditorPage.selectedPropertyNameInput.addValue('SomeBoolean');
    await browser.keys('\t');
    await CaseFileEditorPage.selectedPropertyTypeSelect.selectByVisibleText('boolean');
    await browser.keys('\t');
    await browser.keys('\t');
    await browser.keys('\t');

    await CaseFileEditorPage.selectedPropertyNameInput.addValue('GreetingInResponse');
    await browser.keys('\t');
    await CaseFileEditorPage.selectedPropertyTypeSelect.selectByVisibleText(greetingTypeName);

    // add AnotherGreeting case file item
    await CaseFileEditorPage.selectCaseFileItemWithIndex(2);
    await CaseFileEditorPage.addSiblingButton.click();
    await CaseFileEditorPage.selectedPropertyNameInput.addValue('AnotherGreeting');
    await browser.keys('\t');
    await CaseFileEditorPage.selectedPropertyTypeSelect.selectByVisibleText(greetingTypeName);
}

async function addGreetingType() {
    const greetingTypeName = Util.createID('Greeting');
    await ModelListPanel.createTypeModel(greetingTypeName);

    // add greeting case file item
    await CaseFileEditorPage.addSiblingButton.click();

    await CaseFileEditorPage.selectedPropertyNameInput.addValue('Message');
    await browser.keys('\t');
    await CaseFileEditorPage.selectedPropertyTypeSelect.selectByVisibleText('string');
    await browser.keys('\t');
    await browser.keys('\t');
    await browser.keys('\t');

    await CaseFileEditorPage.selectedPropertyNameInput.addValue('From');
    await browser.keys('\t');
    await CaseFileEditorPage.selectedPropertyTypeSelect.selectByVisibleText('string');
    await browser.keys('\t');
    await browser.keys('\t');
    await browser.keys('\t');

    await CaseFileEditorPage.selectedPropertyNameInput.addValue('To');
    await browser.keys('\t');
    await CaseFileEditorPage.selectedPropertyTypeSelect.selectByVisibleText('string');
    return greetingTypeName;
}


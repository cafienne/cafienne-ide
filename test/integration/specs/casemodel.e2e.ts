import Util from '../../../src/util/util';
import '../extensions/commands';
import CaseModelerPage from '../pageobjects/casemodeler.page';
import IDEPage from '../pageobjects/ide.page';
import ModelListPanel from '../pageobjects/modellist.page';

describe('Case modeler', async function () {
    before(async function () {
        await IDEPage.open();
    });

    it('Open case model - validate modeler elements', async function () {
        const caseName = Util.createID('validate_modeler_element');
        await ModelListPanel.createCaseModel(caseName);
        await CaseModelerPage.caseModel.resize(800, 850);

        const humantask = await CaseModelerPage.shape('Human Task').dropInCanvas$({ x: 60, y: 60 });
        await CaseModelerPage.dropShape('Case Task', { x: 250, y: 60 });
        await CaseModelerPage.dropShape('Process Task', { x: 450, y: 60 });
        const milestone = await CaseModelerPage.dropShape('Milestone', { x: 50, y: 200 });
        await CaseModelerPage.dropShape('Timer Event', { x: 250, y: 200 });
        await CaseModelerPage.dropShape('User Event', { x: 450, y: 200 });
        await CaseModelerPage.dropShape('Case File Item', { x: 50, y: 300 });
        const text = await CaseModelerPage.dropShape('Text Annotation', { x: 250, y: 300 });
        const stage = await CaseModelerPage.shape('Stage').dropInCanvas$({ x: 50, y: 400 });

        const entry = await CaseModelerPage.shape('Entry Criterion').dropInCanvas$(stage, { x: 20, y: 0 });
        const exit = await CaseModelerPage.dropShape('Exit Criterion', stage, { x: 50, y: 0 });
        const reactivate = await CaseModelerPage.dropShape('Reactivate Criterion', stage, { x: 80, y: 0 });

        await stage.resize(600, 400);
        await humantask.dropInCanvas$(stage, { x: 20, y: 20 });

        await stage.haloItem$('Connector').dropInCanvas$(text);
        await stage.haloItem$('Entry Criterion').dropInCanvas$(milestone, { x: 50, y: 40 });

        // TODO property boxes
    });
});

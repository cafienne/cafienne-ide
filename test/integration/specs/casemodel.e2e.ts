import Util from '../../../src/util/util';
import CaseModelerPage from '../pageobjects/casemodeler.page';
import IDEPage from '../pageobjects/ide.page';
import ModelListPanel from '../pageobjects/modellist.page';

describe('Case modeler', async function () {
    before(async function () {
        await IDEPage.open();
    });

    it('Open case model - validate modeler elements', async function () {
        const caseName_1 = Util.getRandomSet(8);
        await ModelListPanel.createCaseModel(caseName_1);

        await CaseModelerPage.shapebox.waitForDisplayed();
    });
});


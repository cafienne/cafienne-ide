import Util from '../../../src/util/util';
import CaseModelerPage from '../pageobjects/casemodeler.page';
import CaseTeamEditorPage from '../pageobjects/caseteameditor.page';
import IDEPage from '../pageobjects/ide.page';
import ModelListPanel from '../pageobjects/modellist.page';

describe('Case team', async function () {
    before(async function () {
        await IDEPage.open();
    });

    it('Create case with new team', async function () {
        const caseName_1 = Util.getRandomSet(8);
        const caseName_2 = Util.getRandomSet(8);

        // create first case
        await ModelListPanel.createCaseModel(caseName_1);
        await CaseModelerPage.openRoleEditor();
        await CaseTeamEditorPage.expectTeamSelected(caseName_1);

        // create second case with same team
        await ModelListPanel.createCaseModel(caseName_2, caseName_1);
        await CaseModelerPage.openRoleEditor();
        await CaseTeamEditorPage.expectTeamSelected(caseName_1);

        // try to delete team
        await CaseTeamEditorPage.deleteButton.click();
        //        await browser.debug();
        await IDEPage.expectWarning(`Cannot delete '${caseName_1}.caseteam' because the model is used in 1 other model`);
        await IDEPage.closeWarning();

        // do not use the team in this case anymore
        await CaseTeamEditorPage.teamSelect.selectByVisibleText('');

        await IDEPage.open(caseName_1 + ".case");
        await CaseModelerPage.openRoleEditor();

        // delete the team
        await CaseTeamEditorPage.deleteButton.click();

        expect(await browser.getAlertText()).toBe(`Are you sure you want to delete '${caseName_1}.caseteam'?`);
        await browser.acceptAlert(); // Accept the alert

        await CaseTeamEditorPage.expectTeamNotSelected();
    })
});



import IDEPage from '../pageobjects/ide.page';
import ModelListPanel from '../pageobjects/modellist.page';

describe('Case Fabric IDE', async function ()  {
    it('should open process model', async function () {
        await IDEPage.open()
        await IDEPage.modelList.waitForDisplayed();
        await ModelListPanel.selectModelTab('process');
        await ModelListPanel.openModel('allocatefunds.process');

        await IDEPage.modelEditor('allocatefunds.process').waitForDisplayed();
    })
})

import Util from '../../../src/util/util';
import IDEPage from '../pageobjects/ide.page';
import ModelListPanel from '../pageobjects/modellist.page';

describe('Model list', async function () {
    before(async function () {
        await IDEPage.open();
    });

    it('open process model', async function () {
        await ModelListPanel.selectModelTab('process');

        const name = Util.getRandomSet(8);
        await ModelListPanel.createProcessModel(name);
        await IDEPage.modelEditor(`${name}.process`).waitForDisplayed();
    });

    it('open type model', async function () {
        await ModelListPanel.selectModelTab('type');

        const name = Util.getRandomSet(8);
        await ModelListPanel.createTypeModel(name);
        await IDEPage.modelEditor(`${name}.type`).waitForDisplayed();
    })

})

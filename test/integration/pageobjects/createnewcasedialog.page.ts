import { NewModelDialog } from "./createnewmodeldialog.page";

export class CreateNewCaseDialog extends NewModelDialog {
    public get typeSelect() {
        return this.dialogBase.$('.selectType');
    }

    public get teamSelect() {
        return this.dialogBase.$('.selectCaseTeam');
    }
}

export default new CreateNewCaseDialog();

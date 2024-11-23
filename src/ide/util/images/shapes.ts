import caseTeam from '../../../../app/images/roles_128.png';
import humanTaskImageUrl from '../../../../app/images/svg/blockinghumantaskmenu.svg';
import caseFileItemImageUrl from '../../../../app/images/svg/casefileitem.svg';
import casePlanImageUrl from '../../../../app/images/svg/caseplanmodel.svg';
import caseTaskImageUrl from '../../../../app/images/svg/casetaskmenu.svg';
import stageImageUrl from '../../../../app/images/svg/collapsedstage.svg';
import entryCriterionImageUrl from '../../../../app/images/svg/entrycriterion.svg';
import exitCriterionImageUrl from '../../../../app/images/svg/exitcriterion.svg';
import milestoneImageUrl from '../../../../app/images/svg/milestone.svg';
import processTaskImageUrl from '../../../../app/images/svg/processtaskmenu.svg';
import reactivateCriterionImageUrl from '../../../../app/images/svg/reactivatecriterion.svg';
import textAnnotationImageUrl from '../../../../app/images/svg/textannotation.svg';
import Images from './images';

export default class Shapes {
    static HumanTask = humanTaskImageUrl;
    static CaseTask = caseTaskImageUrl;
    static ProcessTask = processTaskImageUrl;
    static Milestone = milestoneImageUrl;
    static TimerEvent = Images.TimerEvent;
    static UserEvent = Images.UserEvent;
    static Stage = stageImageUrl;
    static EntryCriterion = entryCriterionImageUrl;
    static ReactivateCriterion = reactivateCriterionImageUrl;
    static ExitCriterion = exitCriterionImageUrl;
    static CasePlan = casePlanImageUrl;
    static CaseFileItem = caseFileItemImageUrl;
    static TextAnnotation = textAnnotationImageUrl;
    static CaseTeam = caseTeam;

}

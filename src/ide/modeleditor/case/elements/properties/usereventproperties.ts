import $ from "jquery";
import UserEventView from "../usereventview";
import PlanItemProperties from "./planitemproperties";

export default class UserEventProperties extends PlanItemProperties<UserEventView> {
    renderData() {
        this.addNameField();
        this.addSeparator();
        this.addDocumentationField();
        this.addSeparator();
        this.createAuthorizedRolesHTML();
        this.addIdField();
    }

    createAuthorizedRolesHTML() {
        const html = $(`<div class="authorizedRolesBlock propertyBlock" title="Select one or more case roles that are allowed to raise the event.\nA team member must have at least one of these roles.\nIf empty, all team members can raise the event.">
                            <label>Authorized Roles</label>
                        </div>`);
        this.htmlContainer.append(html);
        this.addAuthorizatedRoles(html);
    }
}

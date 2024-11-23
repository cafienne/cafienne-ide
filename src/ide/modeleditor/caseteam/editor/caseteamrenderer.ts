import IDE from "@ide/ide";
import CaseTeamModelDefinition from "@repository/definition/caseteam/caseteammodeldefinition";
import CaseRoleDefinition from "@repository/definition/caseteam/caseroledefinition";
import Util from "@util/util";
import $ from "jquery";
import LocalCaseTeamDefinition from "./localcaseteamdefinition";
import CaseTeamEditor from "./caseteameditor";

export default class CaseTeamRenderer {
    
    /**
     * All current in-memory renderers, used for refreshing
     */
    static renderers: CaseTeamRenderer[] = [];
    ide: IDE;
    children: CaseTeamRenderer[];

    constructor(public editor: CaseTeamEditor, public parent: CaseTeamRenderer | undefined, public localCaseTeam: LocalCaseTeamDefinition , public definition: CaseRoleDefinition | undefined, public htmlContainer: JQuery<HTMLElement>) {
        this.ide = this.editor.ide;
        this.children = [];
        if (this.parent) {
            this.parent.children.push(this);
        }
        CaseTeamRenderer.register(this);
    }

    /**
     * Register a new renderer. Includes code smell check when a similar renderer is already registered in the same editor with the same path.
     */
    static register(renderer: CaseTeamRenderer) {
        const similar = (other?: CaseTeamRenderer) => {
            if (!other) return false;
            if (renderer === other) return true;
            if (renderer.constructor.name !== other.constructor.name) return false;
            if (renderer.editor !== other.editor) return false;
            if (renderer.localCaseTeam !== other.localCaseTeam) return false;
            return false;
        }    
        if (this.renderers.find(similar)) {
            console.warn('Cannot add renderer again found ' + renderer.constructor.name + ' ' + renderer)
            return;
        }
        this.renderers.push(renderer);
    }

    static remove(renderer: CaseTeamRenderer) {
       Util.removeFromArray(this.renderers, renderer);
    }

    static refreshOthers(source?: CaseTeamRenderer) {
    }

    render() {
        this.htmlContainer.css('display', 'block');
        this.localCaseTeam.definition.roles.forEach(caseRole => this.createCaseRoleRenderer(caseRole));
    }

    createCaseRoleRenderer(caseRole: CaseRoleDefinition): CaseRoleRenderer {
        const newCaseRoleRenderer = new CaseRoleRenderer(this, this.htmlContainer, this.localCaseTeam, caseRole);
        newCaseRoleRenderer.render();
        return newCaseRoleRenderer;
    }

    addEmptyCaseRoleRenderer(sibling?: CaseRoleRenderer): CaseRoleRenderer {
        const newCaseRole = this.localCaseTeam.definition.createCaseRole();
        const newCaseRoleRenderer = this.createCaseRoleRenderer(newCaseRole);
        if (sibling) {
            this.localCaseTeam.definition.insert(newCaseRoleRenderer.caseRole, sibling.caseRole);
            newCaseRoleRenderer.html.insertAfter(sibling.html);
        }
        // Also add the new Case Team Role to the case team definitions that have a reference us.
        // this.localCaseTeam?.definition.searchInboundReferences().forEach(reference => {
        //     if (reference instanceof CaseTeamModelDefinition) {
        //         // add role to reference, how??
        //     }
        // });
        return newCaseRoleRenderer;
    }

    refresh() {
        this.children.forEach(child => child.delete());
        Util.clearHTML(this.htmlContainer);
        this.render();
    }

    delete() {
        this.children.forEach(child => child.delete());
        this.children = [];
        CaseTeamRenderer.remove(this);
        this.parent = undefined;
    }
}

export class CaseRoleRenderer extends CaseTeamRenderer {
    html: JQuery<HTMLElement>;
    inputCaseRoleName?: JQuery<HTMLElement>;
    inputDocumentation?: JQuery<HTMLElement>;
    caseRoleContainer?: JQuery<HTMLElement>;

    constructor(public parent: CaseTeamRenderer, public htmlParent: JQuery<HTMLElement>, localCaseTeam: LocalCaseTeamDefinition, public caseRole: CaseRoleDefinition) {
        super(parent.editor, parent, localCaseTeam, caseRole, htmlParent);
        this.html = $('<div class="property-renderer" />');
        this.htmlParent.append(this.html);
    }

    delete() {
        super.delete();
    }

    refresh() {
        Util.clearHTML(this.htmlContainer);
        this.render();
    }

    render() {
        this.htmlContainer = $(
            `<div>
                <div class="property-container">
                    <div class="input-name-container">
                        <img class="cfi-icon" src="images/svg/casefileitem.svg"></img>
                        <input class="inputPropertyName" type="text" readonly value="${this.caseRole.name}" />
                        <div class="action-icon-container">
                            <img class="action-icon delete-icon" src="images/delete_32.png" title="Delete ..."/>
                            <img class="action-icon add-sibling-icon" src="images/svg/add-sibling-node.svg" title="Add sibling ..."/>
                        </div>
                    </div>
                    <div class="input-name-container">
                        <input class="inputDocumentation" type="text" readonly value="${this.caseRole.documentation.text}" />
                    </div>
                </div>
            </div>`
        );
        this.html.append(this.htmlContainer);
        this.inputCaseRoleName = this.htmlContainer.find('.inputPropertyName');
        this.inputDocumentation = this.htmlContainer.find('.inputDocumentation');
        this.caseRoleContainer = this.htmlContainer.find('.property-container');

        this.attachEventHandlers();
    }

    attachEventHandlers() {
        if (!this.htmlContainer) return;
        this.htmlContainer.find('.add-sibling-icon').on('click', e => this.editor.addSibling(e, this));
        this.htmlContainer.find('.delete-icon').on('click', e => this.removeCaseRole());

        this.inputCaseRoleName?.on('change', e => this.changeName((e.currentTarget as any).value));
        this.inputCaseRoleName?.on('keyup', e => {
            if (e.which === 9) { // Tab to get inputName focus
                this.editor.selectCaseRoleRenderer(this);
                this.inputNameFocusHandler();
            }
        });
        this.inputCaseRoleName?.on('leave', () => this.inputNameBlurHandler());
        this.inputCaseRoleName?.on('blur', () => this.inputNameBlurHandler());
        this.inputCaseRoleName?.on('dblclick', () => this.inputNameFocusHandler());
        this.inputCaseRoleName?.on('click', () => this.inputNameFocusHandler());
        this.inputCaseRoleName?.on('click', e => {
            e.stopPropagation();
            this.editor.selectCaseRoleRenderer(this);
        });

        this.inputDocumentation?.on('change', e => this.changeDocumentation((e.currentTarget as any).value));
        this.inputDocumentation?.on('keyup', e => {
            if (e.which === 9) { // Tab to get  focus
                this.editor.selectCaseRoleRenderer(this);
                this.documentationFocusHandler();
            }
        });
        this.inputDocumentation?.on('leave', () => this.documentationBlurHandler());
        this.inputDocumentation?.on('blur', () => this.documentationBlurHandler());
        this.inputDocumentation?.on('dblclick', () => this.documentationFocusHandler());
        this.inputDocumentation?.on('click', () => this.documentationFocusHandler());
        this.inputDocumentation?.on('click', e => {
            e.stopPropagation();
            this.editor.selectCaseRoleRenderer(this);
        });


    }

    inputNameBlurHandler() {
        (this.inputCaseRoleName as any).attr('readonly', true);
        document.getSelection()?.empty();
    }

    inputNameFocusHandler() {
        if (this.editor.selectedCaseRoleRenderer === this) {
            (this.inputCaseRoleName as any)?.attr('readonly', false);
            this.inputCaseRoleName?.select();
        }
    }

    documentationBlurHandler() {
        (this.inputDocumentation as any).attr('readonly', true);
        document.getSelection()?.empty();
    }

    documentationFocusHandler() {
        if (this.editor.selectedCaseRoleRenderer === this) {
            (this.inputDocumentation as any)?.attr('readonly', false);
            this.inputDocumentation?.select();
        }
    }

    /**
     * Remove the Case Team Role (including nested objects)
     * But first check if the role is still in use. If so, then it cannot be removed.
     */
    removeCaseRole() {
        // TODO Implement RoleUsage
        // if (!RoleUsage.checkRoleDeletionAllowed(this)) {
        //     return;
        // }

        // remove from the definition
        Util.removeFromArray(this.caseRole.modelDefinition.roles, this.caseRole);
        // Also update the in-memory case definitions that a child is removed.
        // TODO
        // this.role.getCaseFileItemReferences().forEach(reference => reference.removeDefinition());

        // remove from the html
        Util.removeHTML(this.htmlContainer);
        this.localCaseTeam.save(this);
    }

    changeName(newName: string) {
        // await RoleUsage.updateNameChangeInOtherModels(this, newName);
        this.changeProperty('name', newName);
    }

    select() {
        this.caseRoleContainer?.addClass('property-selected');
    }

    deselect() {
        this.caseRoleContainer?.removeClass('property-selected');
    }

    changeDocumentation(text: string) {
        this.caseRole.documentation.text = text;
        this.localCaseTeam.save(this);
    }

    changeProperty(propertyName: string, propertyValue: string) {
        (this.caseRole as any)[propertyName] = propertyValue;
        const indexOfProperty = this.parent.localCaseTeam.definition.roles.indexOf(this.caseRole);
        if (indexOfProperty === this.parent.localCaseTeam.definition.roles.length - 1 && this.editor.quickEditMode) {
            // if in edit mode: insert an empty transient placeholder property (this is for users convenience while adding multiple new properties) 
            this.parent.addEmptyCaseRoleRenderer(this);
        }
        this.localCaseTeam.save(this);
    }

}

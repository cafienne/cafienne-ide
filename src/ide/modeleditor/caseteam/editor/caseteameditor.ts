
import $ from "jquery";
import CaseTeamFile from "../../../../repository/serverfile/caseteamfile";
import XML from "../../../../util/xml";
import IDE from "../../../ide";
import HtmlUtil from "../../../util/htmlutil";
import CaseView from "../../case/elements/caseview";
import ModelSourceEditor from "../../xmleditor/modelsourceeditor";
import CaseTeamModelEditor from "../caseteammodeleditor";
import CaseTeamRenderer, { CaseRoleRenderer } from "./caseteamrenderer";
import MainCaseTeamDefinition from "./maincaseteamdefinition";

export default class CaseTeamEditor {
    viewSourceEditor: ModelSourceEditor;
    private _changed: boolean = false;
    visible: boolean = false;
    ide: IDE;
    html: JQuery<HTMLElement>;
    inputName: JQuery<HTMLElement>;
    htmlCaseTeamContainer: JQuery<HTMLElement>;
    mainCaseTeam?: MainCaseTeamDefinition;
    renderer?: CaseTeamRenderer
    file?: CaseTeamFile;
    selectedCaseRoleRenderer?: CaseRoleRenderer;
    menuContainer: JQuery<HTMLElement>;
    quickEditMode: boolean = false; // Upon pressing buttons (insert/add) then keyboard can be used to keep typing new props.
    /**
     * Edit the Type definition
     */
    constructor(public owner: CaseTeamModelEditor, public htmlParent: JQuery<HTMLElement>, cs?: CaseView) {
        this.ide = owner.ide;

        this.html = $(`
            <div class="basicbox model-source-tabs">
                <ul>
                    <li><a href="#modelEditor">Editor</a></li>
                    <li><a href="#sourceEditor">Source</a></li>
                </ul>
                <div class="caseteam-editor" id="modelEditor">
                    <div class="formcontainer">
                        <div id="caseteameditorcontent">
                            <div class="modelgenericfields">
                                <div>
                                    <label>Name</label>
                                    <input class="inputDefinitionName"/>
                                </div>
                            </div>
                            <div class="menu-container">
                                <img class="action-icon add-sibling-icon" src="images/svg/add-sibling-node.svg" title="Add sibling ..."/>
                                <img class="action-icon delete-icon" src="images/delete_32.png" title="Delete ..."/>
                            </div>
                            <div class="caseteam-container">
                                <div class="property-header-container property-container">
                                    <div>Role Name</div>
                                    <div>Documentation</div>
                                </div>
                                <div class="caseteam-roles-container roles-container">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="model-source-editor" id="sourceEditor"></div>
            </div>
        `);
        this.htmlParent.append(this.html);

        this.inputName = this.htmlParent.find('.inputDefinitionName');

        this.htmlCaseTeamContainer = this.html.find('.caseteam-roles-container');
        this.menuContainer = this.html.find('.menu-container');

        // add the tab control
        this.htmlParent.find('.model-source-tabs').tabs({
            activate: (e, ui) => {
                if (ui.newPanel.hasClass('model-source-editor')) {
                    const xml = this.mainCaseTeam ? XML.prettyPrint(this.mainCaseTeam.xml) : '';
                    this.viewSourceEditor.render(xml);
                }
            }
        });

        this.htmlParent.find('.model-source-tabs').tabs('enable', 1);

        // add the source part
        this.viewSourceEditor = new ModelSourceEditor(this.htmlParent.find('.model-source-tabs .model-source-editor'), this);

        // add the event handlers, for adding changing data, mouse and keyboard
        this.attachEventHandlers();
    }

    get label() {
        return 'Edit Case Team - ' + this.file?.fileName;
    }

    attachEventHandlers() {
        // add change handler for the name of the root type
        this.inputName.on('change', e => {
            if (this.mainCaseTeam) {
                this.mainCaseTeam.definition.name = (e.currentTarget as any).value;
                this.mainCaseTeam.save();
            }
        });

        this.html.on('keydown', e => {
            if (this.selectedCaseRoleRenderer) {
                if (e.which === 27) { // Esc pressed for blur or deselect
                    e.preventDefault();
                    e.stopPropagation();
                    this.selectedCaseRoleRenderer.inputCaseRoleName?.trigger('blur');
                    this.selectedCaseRoleRenderer.inputDocumentation?.trigger('blur');
                    this.deselectCaseRoleRenderers();
                }
                if (e.which === 113) { // F2 pressed for edit 
                    e.preventDefault();
                    e.stopPropagation();
                    this.selectedCaseRoleRenderer.inputNameFocusHandler();
                }
            }
        });

        this.html.find('.add-sibling-icon').on('click', e => this.addSibling(e));
        this.html.find('.delete-icon').on('click', e => this.removeCaseRole(e));
        this.html.on('click', () => this.deselectCaseRoleRenderers());
    }

    selectCaseRoleRenderer(caseRoleRenderer?: CaseRoleRenderer) {
        if (caseRoleRenderer === this.selectedCaseRoleRenderer) {
            return;
        }
        // Deselect current selected Case Team Role
        if (this.selectedCaseRoleRenderer) {
            this.selectedCaseRoleRenderer.deselect();
        }
        this.selectedCaseRoleRenderer = caseRoleRenderer;
        if (caseRoleRenderer) {
            caseRoleRenderer.select();
        }
        if (this.selectedCaseRoleRenderer) {
            this.menuContainer.addClass('property-selected');
        } else {
            this.menuContainer.removeClass('property-selected');
        }
        this.removeEmptyCaseRoleRenderers();
    }

    deselectCaseRoleRenderers() {   
        if (this.quickEditMode) {
            // console.warn("Setting edit mode to false")
            this.quickEditMode = false;
        }

        this.selectCaseRoleRenderer(undefined);
    }

    addChild(e: any, from: CaseRoleRenderer | undefined = this.selectedCaseRoleRenderer): CaseRoleRenderer | undefined {
        return this.addCaseRole(e, false, from)
    }

    addSibling(e: any, from = this.selectedCaseRoleRenderer): CaseRoleRenderer | undefined {
        return this.addCaseRole(e, true, from);
    }

    /**
     * Add a Case Team Role as child under "from" (insertAsSibling=false)
     * Add a Case Team Role as sibling after "from" (insertAsSibling=true)
     * Defaults 
     */
    addCaseRole(e: any, insertAsSibling = false, from?: CaseRoleRenderer): CaseRoleRenderer | undefined {
        e.preventDefault();
        e.stopPropagation();
        if (!this.quickEditMode) {
            // console.warn("Setting edit mode to true")    
            this.quickEditMode = true;
        }

        let newCaseRoleRenderer: CaseRoleRenderer | undefined = undefined;
        if (from) {
            if (insertAsSibling) {
                // adding child only possible for properties of complex type
                // for primitive types just add as a sibling instead;
                newCaseRoleRenderer = from.parent?.addEmptyCaseRoleRenderer(from);
            } else {
                this.ide.warning('Not possible to add a child here', 3000);
            }
        } else {
            if (insertAsSibling) {
                newCaseRoleRenderer = this.renderer?.addEmptyCaseRoleRenderer();
            } else {
                this.ide.warning('Not possible to add a child here', 3000);
            }
        }
        if (newCaseRoleRenderer) {
            this.selectCaseRoleRenderer(newCaseRoleRenderer);
            newCaseRoleRenderer.inputNameFocusHandler();
        }
        return newCaseRoleRenderer;
    }

    removeCaseRole(e: any, caseRoleRenderer = this.selectedCaseRoleRenderer) {
        if (caseRoleRenderer) {
            caseRoleRenderer.removeCaseRole();
            this.deselectCaseRoleRenderers();
        } else {
            this.ide.warning('Select a Case Team Role to be removed', 3000);
        }
    }

    removeEmptyCaseRoleRenderers(renderer: CaseTeamRenderer | undefined = this.renderer) {
        renderer?.children.forEach(r => {
            this.removeEmptyCaseRoleRenderers(r);
            if (r instanceof CaseRoleRenderer) {
                if (r.caseRole.name === '' && r != this.selectedCaseRoleRenderer) { // isNew
                    r.removeCaseRole();
                }
            }
        });
    }

    onShow() {
        //always start with editor tab
        this.htmlParent.find('.model-source-tabs').tabs('option', 'active', 0);
    }

    delete() {
        if (this.renderer) {
            this.renderer.delete();
        }
        HtmlUtil.removeHTML(this.htmlParent);
    }

    async setMainCaseTeam(file?: CaseTeamFile) {
        // Clean current main type and renderer
        this.mainCaseTeam = undefined;
        if (this.renderer) {
            this.renderer.delete();
            this.deselectCaseRoleRenderers();
            HtmlUtil.clearHTML(this.htmlCaseTeamContainer);
            this.inputName.val('');
        }

        this.file = file;
        if (file) {
            await file.load();
            this.mainCaseTeam = new MainCaseTeamDefinition(this, file);
            // Render name and definitionType
            this.htmlParent.find('.inputDefinitionName').val(this.mainCaseTeam.definition.name);
            this.renderer = new CaseTeamRenderer(this, undefined, this.mainCaseTeam, undefined, this.htmlCaseTeamContainer);
            this.renderer.render();
        }
    }

    refresh() {
        this.setMainCaseTeam(this.file);
    }

    /**
     * handle the change of the source (in 2nd tab)
     */
    loadSource(newSource: any) {
        if (this.file) {
            this.file.source = newSource;
            this.file.save(); // Saving the type will refresh the editor
        }
    }
}

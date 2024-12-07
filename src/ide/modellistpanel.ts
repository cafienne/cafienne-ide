import ModelDefinition from "@repository/definition/modeldefinition";
import ServerFile from "@repository/serverfile/serverfile";
import Util from "@util/util";
import $ from "jquery";
import "jquery-ui";
import IDE from "./ide";
import ModelEditorMetadata from "./modeleditor/modeleditormetadata";
import RepositoryBrowser from "./repositorybrowser";

export default class ModelListPanel {
    ide: IDE;
    htmlPanel: JQuery<HTMLElement>;
    container: JQuery<HTMLElement>;

    constructor(public repositoryBrowser: RepositoryBrowser, public accordion: JQuery<HTMLElement>, public type: ModelEditorMetadata) {
        this.accordion = accordion;
        this.repositoryBrowser = repositoryBrowser;
        this.ide = repositoryBrowser.ide;
        this.type = type;

        this.htmlPanel = $(
            `<h3 filetype="${type.fileType}">${type.description}
                <img class="plus-icon" src="images/plus_32.png" title="Create new ${type} ..."/>
            </h3>
            <div class="file-container file-list-${type.fileType}"></div>`);

        this.accordion.append(this.htmlPanel);
        this.accordion.accordion('refresh');
        this.container = this.accordion.find('.file-list-' + type.fileType);
        this.htmlPanel.find('.plus-icon').on('click', e => this.create(e));

        this.ide.repository.onListRefresh(() => this.setModelList());
    }

    /**
     * Re-creates the items in the accordion for this panel
     * 
     */
    setModelList() {
        const files = this.type.modelList;
        // First create a big HTML string with for each model an <a> element
        const urlPrefix = window.location.origin + window.location.pathname + '#';

        // Clean current file list
        Util.clearHTML(this.container);

        files.forEach(file => {
            const error = file.metadata.error;
            const usageTooltip = `${file.name} used in ${file.usage.length} other model${file.usage.length == 1 ? '' : 's'}\n${file.usage.length ? file.usage.map(u => '- ' + u.fileName).join('\n') : ''}`;
            const tooltip = error ? error : usageTooltip;
            const nameStyle = error ? 'style="color:red"' : '';
            const modelURL = urlPrefix + file.fileName;
            const optionalDeployIcon = this.type.supportsDeploy ? `<img class="action-icon deploy-icon" src="images/deploy_128.png" title="Deploy ${file.name} ..."/>` : '';
            const html = $(`<div class="model-item" title="${tooltip}" fileName="${file.fileName}">
                                <img class="menu-icon" src="${this.type.icon}" />
                                <a name="${file.name}" fileType="${file.fileType}" href="${modelURL}"><span ${nameStyle}>${file.name}</span></a>
                                <img class="action-icon delete-icon" src="images/delete_32.png" title="Delete model ..."/>
                                <img class="action-icon rename-icon" src="images/svg/rename.svg" title="Rename model ..."/>
                                ${optionalDeployIcon}
                            </div>`);
            this.container.append(html);
            // Add event handler for dragging.
            html.on('pointerdown', e => {
                e.preventDefault();
                e.stopPropagation();
                this.repositoryBrowser.startDrag(file, this.type.icon);
            });
            html.find('.delete-icon').on('click', e => this.delete(file));
            html.find('.rename-icon').on('click', e => this.rename(file));
            html.find('.deploy-icon').on('click', e => this.deploy(file));
        });

        this.repositoryBrowser.refreshAccordionStatus();
    }

    /**
     * Delete a file, when a .case file is deleted also delete the .dimensions file. 
     */
    async delete(file: ServerFile<ModelDefinition>) {
        if (file.usage.length) {
            this.ide.danger(`Cannot delete '${file.fileName}' because the model is used in ${file.usage.length} other model${file.usage.length == 1 ? '' : 's'}\n${file.usage.length ? file.usage.map(u => '- ' + u.fileName).join('\n') : ''}`);
        } else {
            const text = `Are you sure you want to delete '${file.fileName}'?`;
            if (confirm(text) === true) {
                await this.ide.repository.delete(file.fileName);
                if (file.fileType === 'case') {
                    // When we delete a .case model we also need to delete the .dimensions
                    await this.ide.repository.delete(file.name + '.dimensions');
                }
                // Tell editor registry to remove any editors for this file.
                this.ide.editorRegistry.remove(file.fileName);
            }
        }
    }

    /**
     * Rename a file
     * all references to the model in other models will be renamed as well.
     */
    async rename(file: ServerFile<ModelDefinition>) {
        const prompter = (previousProposal: string = ''): string | null => {
            const warningMsg = previousProposal !== file.name ? `\n   ${this.type} '${previousProposal}' already exists` : '';
            const text = `Specify a new name for ${this.type} '${file.name}'${warningMsg}`;
            const newName = prompt(text, previousProposal);
            if (newName && newName !== file.name && this.ide.repository.hasFile(newName + '.' + file.fileType)) {
                return prompter(newName)
            } else {
                return newName;
            }
        }
        // const text = `Specify a new name for ${this.type} '${file.name}'`;
        const newName = prompter(file.name);
        if (!newName) {
            // User canceled the rename action.
            return;
        }
        const oldName = file.name;
        const oldFileName = file.fileName;
        if (newName == oldName) {
            // No need to update any information to the client, it is simply the same name
            return;
        } else {
            if (this.repositoryBrowser.isValidEntryName(newName)) {
                const newFileName = newName + '.' + file.fileType;
                if (this.ide.repository.hasFile(newFileName)) {
                    this.ide.danger(`Cannot rename ${file.fileName} to ${newFileName} as that name already exists`, 3000);
                    return;
                }
                await file.rename(newFileName);
                // Check if the file that is being renamed is currently visible, and if so, change the hash and refresh the editor
                if (this.repositoryBrowser.currentFileName === oldFileName) {
                    window.location.hash = newFileName;
                    if (this.ide.editorRegistry.currentEditor) {
                        this.ide.editorRegistry.currentEditor.refresh();
                    }
                }
                file.usage.forEach(usingFile => {
                    const editor = this.ide.editorRegistry.editors.find(editor => editor.file === usingFile);
                    if (editor) {
                        editor.refresh();
                    }
                });
            }
        }
    }

    deploy(file: ServerFile<ModelDefinition>) {
        window.location.hash = file.fileName + '?deploy=true';
    }

    /**
     * Creates a new model based on name
     */
    async create(e: JQuery.ClickEvent<HTMLElement, undefined, HTMLElement, HTMLElement>) {
        e.stopPropagation();
        return this.type.openCreateModelDialog();
    }
}

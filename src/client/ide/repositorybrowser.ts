import ServerFile from "@repository/serverfile/serverfile";
import $ from "jquery";
import "jquery-ui";
import ServerFileDragData from "./dragdrop/serverfiledragdata";
import IDE from "./ide";
import ModelEditorMetadata from "./modeleditor/modeleditormetadata";
import ModelListPanel from "./modellistpanel";
import ModelDefinition from "@repository/definition/modeldefinition";
import DragData from "./dragdrop/dragdata";
import Repository from "@repository/repository";

export default class RepositoryBrowser {
    repository: Repository;
    dragData?: ServerFileDragData;
    accordion: JQuery<HTMLElement>;
    searchBox: JQuery<HTMLElement>;
    /**
     * This object handles the model browser pane on the left
     */
    constructor(public ide: IDE, public html: JQuery<HTMLElement>) {
        this.repository = this.ide.repository;
        this.html.append(
            `<div class="divModelList basicform">
                <div class="formheader">
                    <label>Repository</label>
                    <div class="btnRefresh" title="Refresh the model list">
                        <img src="images/refresh_32.png" />
                    </div>
                </div>
                <div class="formfooter">
                    <div class="divSearchBox">
                        <input style='width:100%' placeholder="Search" />
                    </div>
                </div>
                <div class="formcontainer">
                    <div class="divAccordionList">
                    </div>
                </div>
            </div>`);

        //set accordion for the various types of model lists
        this.accordion = this.html.find('.divAccordionList');
        this.accordion.accordion({
            heightStyle: 'fill',
            animate: false
        });

        //add events search model field
        this.searchBox = this.html.find('.divSearchBox input');
        this.searchBox.on('keyup', e => this.applySearchFilter(e));
        this.searchBox.on('keydown', e => this.executeSearchFilter(e));

        // Attach window resize handler and subsequently refresh the accordion
        $(window).on('resize', () => this.accordion.accordion('refresh'));

        //set refresh handle on click
        this.html.find('.btnRefresh').on('click', () => {
            this.repository.listModels().then(() => this.searchBox.val('')).catch(message => this.ide.danger(message, 5000));
        });

        // Add handler for hash changes, that should load the new model
        $(window).on('hashchange', () => this.loadModelFromBrowserLocation());

        // Now load the repository contents, and after that optionally load the first model
        this.repository.listModels().then(() => this.loadModelFromBrowserLocation()).catch(msg => this.ide.danger(msg, 5000));

        ModelEditorMetadata.types.forEach(type => type.init(this));
    }

    createModelListPanel(type: ModelEditorMetadata) {
        return new ModelListPanel(this, this.accordion, type);
    }

    startDrag(file: ServerFile<ModelDefinition>, shapeImg: string) {
        this.dragData = new ServerFileDragData(this, file, shapeImg);
    }

    /**
     * Registers a drop handler with the repository browser.
     * If an item from the browser is moved over the canvas, elements can register a drop handler
     */
    setDropHandler(dropHandler: (dragData: ServerFileDragData) => void, filter?: ((dragData: ServerFileDragData) => boolean)) {
        if (this.dragData) this.dragData.setDropHandler(<(dragData: DragData) => void>dropHandler, <(dragData: DragData) => boolean>filter);
    }

    /**
     * Removes the active drop handler and filter
     */
    removeDropHandler() {
        if (this.dragData) this.dragData.removeDropHandler();
    }

    /**
     * Checks the window.location hash and loads the corresponding model.
     */
    loadModelFromBrowserLocation() {
        this.refreshAccordionStatus();

        // Ask the IDE to open the model.
        this.ide.editorRegistry.open(this.currentFileName);
    }

    get currentFileName() {
        // Splice: take "myMap/myModel.case" out of something like "http://localhost:2081/#myMap/myModel.case"
        //  Skip anything that is behind the optional question mark
        return window.location.hash.slice(1).split('?')[0];
    }

    refreshAccordionStatus() {
        // Select the currently opened model. Should we also open the right accordion with it?
        //  Also: this logic must also be invoked when we refresh the contents of the accordion.
        //  That requires that we also know what the current model is.
        this.accordion.find('.model-item').removeClass('modelselected');
        this.accordion.find('.model-item[fileName="' + this.currentFileName + '"]').addClass('modelselected');
        // Also select the corresponding accordion tab
        $(this.accordion.find('.model-item[fileName="' + this.currentFileName + '"]').closest('.file-container')).prev('h3')[0]?.click();
    }

    /**
     * returns true when the modelName is valid
     */
    isValidEntryName(entryName: string) {
        if (!entryName || entryName == '') {
            this.ide.danger('Please enter a name for the model.');
        } else if (/\s/.test(entryName)) {
            this.ide.danger('The model name should not contain spaces');
        } else if (!/^[a-zA-Z0-9_/]+$/.test(entryName)) {
            this.ide.danger('The model name should not contain invalid characters (like !@#$%^&* etc)');
        } else {
            // Everything ok then, return true;
            return true;
        }
        // Something in the above tests was wrong, otherwise we would not have reached this point. So return false.
        return false;
    }

    /**
     * Runs the search text agains the models currently rendered, and hides them if not matching the search criteria
     * @param {JQuery.KeyUpEvent} e
     */
    applySearchFilter(e: any) {
        const searchText = this.searchBox.val()?.toString().toLowerCase();
        // Loop through all elements, and search for the text. The elements look like <a filetype="case" name="hcmtest" href="...">hcmtest</a>
        this.accordion.find('a').toArray().forEach(htmlElement => {
            const modelName = htmlElement.textContent?.toLowerCase();
            const containsSearchText = this.hasSearchText(searchText, modelName);
            if (htmlElement.parentElement) htmlElement.parentElement.style.display = containsSearchText ? 'block' : 'none';
        });
    }

    /**
     * Determines recursively whether each character of text1 is available in text2
     * @param {String} searchFor 
     * @param {String} searchIn 
     */
    hasSearchText(searchFor?: string, searchIn?: string): boolean {
        if (!searchFor) { // Nothing left to search for, so found a hit
            return true;
        }
        if (!searchIn) { // Nothing left to search in, so did not find it.
            return false;
        }
        const index = searchIn.indexOf(searchFor.charAt(0));
        if (index < 0) { // Did not find any results, so returning false.
            return false;
        }
        // Continue the search in the remaining parts of text2
        const remainingText2 = searchIn.substring(index + 1, searchIn.length);
        const remainingText1 = searchFor.substring(1);
        return this.hasSearchText(remainingText1, remainingText2);
    }

    /**
     * This function executes the search filter with a follow-up action.
     * On tab, select the first model.
     * On enter, open the first model.
     * On escape, remove the search filter.
     */
    executeSearchFilter(e: JQuery.KeyDownEvent) {
        const first = this.accordion.find('a').toArray().find(element => $(element).parent().css('display') == 'block')
        if (e.keyCode == 9) { // Pressed Tab key, let's focus on first search result
            if (first) {
                $(first).trigger('focus');
                e.stopPropagation();
                e.preventDefault();
            }
        } else if (e.keyCode == 27) { // Pressed Escape key, let's undo the search filter
            this.removeSearchFilter();
        } else if (e.keyCode == 13) { // Pressed Enter key, let's open the first search result
            if (first) {
                window.location.hash = ($(first).attr('name') + '.' + $(first).attr('filetype'));
            }
        }
    }

    /**
     * Removes the active search filtering from the model list.
     */
    removeSearchFilter() {
        this.searchBox.val('');
        this.accordion.find('div').css('display', 'block');
    }
}

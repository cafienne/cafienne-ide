import Repository from "@repository/repository";
import TypeFile from "@repository/serverfile/typefile";
import Util from "@util/util";

export type Option = {
    option: string,
    value: string
}

export default class TypeSelector {
    typeFiles: TypeFile[];
    listRefresher: (typeRef?: string, additionalOptions?: Option[]) => void;

    constructor(public repository: Repository, public htmlParent: JQuery<HTMLElement>, public typeRef: string, private callback: Function, public hasPrimitiveTypes = false, public additionalOptions: Option[] = []) {
        this.typeFiles = this.repository.getTypes();
        this.loadOptions();
        this.listRefresher = (typeRef = this.typeRef, additionalOptions: Option[] = this.additionalOptions) => {
            // This listRefresher will be executed on each change in the entire repository content 
            // This listRefresher can also be invoked to trigger a refresh after a change
            // Refresh of the HTML content will only occur when a real change is detected
            let refreshOptionsRequired = false;
            const newTypeRef = typeRef;
            const newAdditionalOptions = additionalOptions;
            const newFiles = this.repository.getTypes();

            if (newTypeRef !== this.typeRef) {
                // Detected a change in the current selected type
                this.typeRef = newTypeRef;
                refreshOptionsRequired = true;
            }
            if (JSON.stringify(newAdditionalOptions) !== JSON.stringify(this.additionalOptions)) {
                // Detected a change in the specified additional options
                this.additionalOptions = newAdditionalOptions;
                refreshOptionsRequired = true;
            }
            if (JSON.stringify(newFiles.map(file => file.fileName)) !== JSON.stringify(this.typeFiles.map(file => file.fileName))) {
                // Detected a change in repository content
                this.typeFiles = newFiles;
                refreshOptionsRequired = true;
            }
            if (refreshOptionsRequired) {
                this.loadOptions();
            }
        }
        this.repository.onListRefresh(this.listRefresher);
    }

    loadOptions() {
        Util.clearHTML(this.htmlParent);
        this.htmlParent.html(this.getOptions());
        this.htmlParent.val(this.typeRef);
        this.htmlParent.on('change', e => {
            this.typeRef = '' + this.htmlParent.val();
            this.callback(this.typeRef);
        });
    }

    loadRepositoryTypes() {
        return this.typeFiles;
    }

    delete() {
        if (this.listRefresher) {
            this.repository.removeListRefreshCallback(this.listRefresher);
        }
    }

    getPrimitiveOptions() {
        if (this.hasPrimitiveTypes) {
            return `<option value=""></option>
            <option value="string">string</option>
            <option value="integer">integer</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="time">time</option>
            <option value="date">date</option>
            <option value="date-time">date-time</option>
<!-- These elements not (yet) supported

            <option value="gYear">year</option>
            <option value="gYearMonth">month</option>
            <option value="gMonthDay">day</option>
            <option value="gDay">week day</option>
            <option value="duration">duration</option>
            <option value="hexBinary">hex binary</option>
            <option value="base64Binary">base64 binay</option>
-->
            <option value="uri">any URI</option>
            <option value="QName">QName</option>
            <option value="object">object</option>`;
        } else {
            return '';
        }
    }

    getOptions() {
        // Create options in this order:
        // - Empty
        // - All primitive types (optional)
        // - All additional options (if specified)
        // - All types in repository
        return `${this.getPrimitiveOptions()}<option value=""></option>${this.additionalOptions.map(o => `<option value="${o.value}">${o.option}</option>`)}${this.typeFiles.map(type => `<option value="${type.fileName}">${type.name}</option>`)}`
    }
}

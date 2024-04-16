class TypeSelector {
    /**
     * 
     * @param {Repository} repository 
     * @param {JQuery<HTMLElement>} htmlParent 
     * @param {String} typeRef
     * @param {Function} callback 
     * @param {Boolean} hasPrimitiveTypes 
     */
    constructor(repository, htmlParent, typeRef, callback, hasPrimitiveTypes = false) {
        this.repository = repository
        this.htmlParent = htmlParent;
        this.typeRef = typeRef;
        this.callback = callback;
        this.hasPrimitiveTypes = hasPrimitiveTypes;
        this.typeFiles = this.repository.getTypes();
        this.loadOptions();
        this.listRefresher = () => {
            const newFiles = this.repository.getTypes();
            if (this.typeFiles.find(file => newFiles.findIndex(newFile => file.fileName === newFile.fileName) < 0)) {
                // console.log("List is refreshed, one file is no longer in availalbe")
                this.typeFiles = newFiles;
                this.loadOptions();
            } else if (newFiles.find(file => this.typeFiles.findIndex(newFile => file.fileName === newFile.fileName) < 0)) {
                // console.log("List is refreshed with a new file")
                this.typeFiles = newFiles;
                this.loadOptions();
            }
        };
        this.repository.onListRefresh(this.listRefresher);
    }

    loadOptions() {
        Util.clearHTML(this.htmlParent);
        this.htmlParent.html(this.getOptions());
        this.htmlParent.val(this.typeRef);
        this.htmlParent.on('change', e => {
            this.typeRef = e.currentTarget.value;
            this.callback(e.currentTarget.value)
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
        // First create 1 options for "empty" then add all type files
        return `${this.getPrimitiveOptions()}<option value=""></option>${this.typeFiles.map(type => `<option value="${type.fileName}">${type.name}</option>`)}`
    }
}
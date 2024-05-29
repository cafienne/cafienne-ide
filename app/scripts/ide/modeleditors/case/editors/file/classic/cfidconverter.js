class CFIDConverter {
    /**
     * Convert the CaseFileItems and their CaseFileItemDefinitions (.cfid files) to the new type structure for this case.
     * 
     * @param {CaseView} cs 
     */
    constructor(cs) {
        this.case = cs;
        this.repository = this.case.editor.ide.repository;
        this.cfiWrappers = /** @type {Array<CFIWrapper>} */ ([]);
        this.typeWrappers = /** @type {Array<TypeWrapper>} */ ([]);
    }

    convert() {
        this.case.caseDefinition.getCaseFile().children.forEach(child => new CFIWrapper(this, child, undefined));
    }
}

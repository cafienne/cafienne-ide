import Util from "@util/util";
import MappingRow from "./mappingrow";

export default class MappingExpression {
    static get label() {
        return 'Transformation';
    }

    static get width() {
        return '';
    }

    /**
     * 
     * @param {MappingRow row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        const mapping = row.mapping;

        const ruleLanguage = mapping && mapping.hasCustomLanguage ? mapping.language : '';
        const nonDefaultLanguage = mapping && mapping.hasCustomLanguage ? ' custom-language' : '';
        const ruleLanguageTip = `Default language for transformations is '${mapping.caseDefinition.defaultExpressionLanguage}'. Click the button to change the language`;
        const ruleDeviatesTip = `Language used in the transformation is '${ruleLanguage}'. Default language in the rest of the case model is '${mapping.caseDefinition.defaultExpressionLanguage}'`;
        const tip = mapping && mapping.hasCustomLanguage ? ruleDeviatesTip : ruleLanguageTip;

        //add textarea for transformation field and listen to changes
        const html = column.html(`<div class="mapping-expression">
            <span class="mapping-expression-language" title="${tip}">
                <button><span class="${nonDefaultLanguage}" >L</span></button>
                <input class="input-expression-language" value="${ruleLanguage}" />
            </span>
            <span><textarea>${row.mapping.body}</textarea></span>
        </div>`);
        const textareaTransformation = html.find('textarea');
        const buttonLabel = html.find('button span');
        const htmlExpressionLanguage = html.find('.mapping-expression-language');
        const editHTMLExpressionLanguage = htmlExpressionLanguage.find('input');
        const showHTMLExpressionLanguage = htmlExpressionLanguage.find('button');
        editHTMLExpressionLanguage.on('change', e => {
            const newLanguage = e.target.value || mapping.caseDefinition.defaultExpressionLanguage;
            mapping.language = newLanguage;
            if (mapping.hasCustomLanguage) {
                Util.addClassOverride(buttonLabel, 'custom-language');
            } else {
                Util.removeClassOverride(buttonLabel, 'custom-language');
            }
            row.case.editor.completeUserAction();
            row.editor.refresh();
        });
        showHTMLExpressionLanguage.on('click', () => {
            if (editHTMLExpressionLanguage.css('display') === 'none') {
                editHTMLExpressionLanguage.css('display', 'block');
                Util.addClassOverride(htmlExpressionLanguage, 'show-language-input');
                Util.addClassOverride(textareaTransformation, 'visible-mapping-language');
            } else {
                editHTMLExpressionLanguage.css('display', 'none');
                Util.removeClassOverride(htmlExpressionLanguage, 'show-language-input');
                Util.removeClassOverride(textareaTransformation, 'visible-mapping-language');
            }
        });

        textareaTransformation.on('change', e => {
            row.mapping.body = e.currentTarget.value;
            row.case.editor.completeUserAction();
            row.editor.refresh();
        });
    }
}

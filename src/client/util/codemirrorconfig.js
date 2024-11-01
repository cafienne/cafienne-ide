import * as CodeMirror from "codemirror";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/fold/foldcode";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/xml-fold";
import "codemirror/addon/hint/javascript-hint";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/xml-hint";
import "codemirror/mode/xml/xml";
import "codemirror/mode/javascript/javascript";

export default class CodeMirrorConfig {
    static get JSON() {
        return {
            mode: 'application/json',
            matchBrackets: true,
            autoCloseBrackets: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
            lineNumbers: true
        }
    }

    static get XML() {
        return  {
            mode: 'xml',
            matchBrackets: true,
            autoCloseBrackets: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
            lineNumbers: true
        }
    }

    /**
     * 
     * @param {JQuery<HTMLElement>} html 
     * @returns {CodeMirror.Editor}
     */
    static createJSONEditor(html) {
        return CodeMirror(html[0], CodeMirrorConfig.JSON);
    }

    /**
     * 
     * @param {JQuery<HTMLElement>} html 
     * @returns {CodeMirror.Editor}
     */
    static createXMLEditor(html) {
        return CodeMirror(html[0], CodeMirrorConfig.XML);
    }
}

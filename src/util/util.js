import $ from "jquery"
export default class Util {
    /**
     * Copies the text to clipboard
     * @param {string} text 
     */
    static copyText(text) {
        if (!text) {
            console.warn('No text to copy to clipboard');
            return;
        }
        const textarea = $('<textarea>');
        $(document.body).append(textarea);
        $(textarea.val(text)).select();
        document.execCommand('copy');
        textarea.remove();
        console.log('Copied text to clipboard');
    }

    /**
     * 
     * @param {JQuery<HTMLElement>} html 
     * @param  {...string} classNames 
     */
    static addClassOverride(html, ...classNames) {
        // For some reason alpaca seems to kill the jquery-ui addClass override in some places in the editor. No clue why.
        //  It seems to be that case only on svg elements???
        //  This code gives a quick hack ( grrr.... ) around it.
        const currentClassNames = html.attr('class');
        const existingClasses = currentClassNames ? currentClassNames.split(' ') : [];
        classNames.forEach(newClass => {
            if (existingClasses.indexOf(newClass) < 0) {
                existingClasses.push(newClass);
            }
        });
        html.attr('class', existingClasses.join(' '));
    }

    static removeClassOverride(html, ...classNames) {
        const currentClassNames = html.attr('class');
        const existingClasses = currentClassNames ? currentClassNames.split(' ') : [];
        classNames.forEach(name => Util.removeFromArray(existingClasses, name));
        html.attr('class', existingClasses.join(' '));
    }

    /**
     * Detaches all event handlers from a JQuery selected HTML element.
     * @param {JQuery<HTMLElement>} html 
     */
    static detachEventHandlers(html) {
        // First clear all javascript listeners to avoid memory leakings because of cross-references between js and rendering engine
        $(html).off();
        // Note: for large set of debug events (like 60000) there is 350,000 children to "off" the event listeners, and good old jquery.find('*') runs into maximum stack trace stuff
        // For speed we're iterating native html elements
        const childTraverser = html => {
            $(html).off(); // Take off any event listeners through the JQuery wrapper
            let child = html.firstChild;
            while (child) {
                childTraverser(child);
                child = child.nextSibling;
            }                
        }
        html.get().forEach(childTraverser);
    }

    /**
     * Clears the html content of the element and detaches all underlying event handlers
     * @param {JQuery<HTMLElement>} html 
     */
    static clearHTML(html) {
        Util.detachEventHandlers(html);
        $(html).empty();
    }

    /**
     * Deletes the html content of the element and detaches all underlying event handlers
     * @param {JQuery<HTMLElement>} html 
     */
    static removeHTML(html) {
        Util.detachEventHandlers(html);
        $(html).remove();
    }

    /**
     * returns a random character set of length n
     */
    static getRandomSet(n) {
        const s = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const str = Array(n).join().split(',').map(
            function () {
                return s.charAt(Math.floor(Math.random() * s.length));
            }).join('');

        return str;
    }

    /**
     * Creates a new identifier, with an optional prefix, and a random string consisting of iNumber characters
     */
    static createID(sPrefix = '_', iNumber = 5) {
        return sPrefix + this.getRandomSet(iNumber);
    }

    /**
     * Simple helper function that removes an element from an array, if it is in the array.
     * Returns the arrayIndex the element had in the array, or -1.
     * @param {Array} array 
     * @param {*} element 
     */
    static removeFromArray(array, element) {
        const arrayIndex = array.indexOf(element);
        if (arrayIndex > -1) {
            array.splice(arrayIndex, 1);
        }
        return arrayIndex;
    }

    /**
     * 
     * @param {Array} array 
     * @param {*} element 
     * @param {*} after 
     */
    static insertInArray(array, element, after = undefined) {
        Util.removeFromArray(array, element);
        const index = array.indexOf(after);
        if (index >= 0 && index < array.length - 1) {
            array.splice(index + 1, 0, element);
        } else {
            array.push(element);
        }
    }

    /**
     * Remove duplicate elements from an array
     * @param {Array} array 
     * @returns {Array}
     */
    static removeDuplicates(array) {
        const size = array.length;
        const copy = [...array];
        const set = new Set();
        copy.forEach(object => set.add(object));
        Util.clearArray(array);
        array.push(...Array.from(set));
        const newSize = array.length;
        return array;
    }

    /**
     * Simple helper function that removes all elements from an array.
     * @param {Array} array 
     */
    static clearArray(array) {
        array.splice(0, array.length);
        return array;
    }

    /**
     * 
     * @param {String} str 
     */
    static withoutNewlinesAndTabs(str) {
        if (typeof (str) !== 'string') return str;
        return str ? str.replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\t/g, ' ') : str;
    }

    /**
     * Returns true if sub class extends superclass somewhere in the type chain.
     * @param {Function} superClass 
     * @param {Function} subClass 
     */
    static isSubClassOf(superClass, subClass) {
        if (!subClass) {
            return false;
        } else if (subClass == superClass) {
            return true;
        } else {
            return Util.isSubClassOf(superClass, Object.getPrototypeOf(subClass));
        }
    }

    /**
     * Parse (any) content, but typically a string into a JSON structure.
     * @returns {ParseResult}
     * @param {*} source 
     */
    static parseJSON(source) {
        return new ParseResult(source);
    }
}

class ParseResult {
    constructor(source) {
        this.source = source;
    }

    get object() {
        try {
            return JSON.parse(this.source);
        } catch (error) {
            const lines = this.source.split('\n');
            const message = error.message;
            const brokenMessage = message.split('at position');
            const position = Number.parseInt(brokenMessage.length > 1 ? brokenMessage[1] : 0);
            const validLines = this.source.substring(0, position).split('\n');
            this.lineNumber = validLines.length;
            this.column = validLines[validLines.length - 1].length;
            // console.log((`<br /> ${this.lineNumber - 2}: ${lines[this.lineNumber - 2]}<br />${this.lineNumber - 1}:${ lines[this.lineNumber - 1]}<br /> `))
            // const bothLines = this.lineNumber > 1 ? ('<br />' + validLines[this.lineNumber - 2] + '<br />' + validLines[this.lineNumber - 1]+'<br />' ): '' ;
            this.description = brokenMessage[0] + ' at line ' + this.lineNumber + ', column ' + this.column;
            this.error = error;
            return undefined;
        }
    }
}

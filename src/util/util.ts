import $ from "jquery";
export default class Util {
    /**
     * Copies the text to clipboard
     */
    static copyText(text: string) {
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
     */
    static addClassOverride(html: JQuery<HTMLElement> | undefined, ...classNames: string[]) {
        if (!html) return;

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

    static removeClassOverride(html: JQuery<HTMLElement> | undefined, ...classNames: string[]) {
        if (!html) return;
        const currentClassNames = html.attr('class');
        const existingClasses = currentClassNames ? currentClassNames.split(' ') : [];
        classNames.forEach(name => Util.removeFromArray(existingClasses, name));
        html.attr('class', existingClasses.join(' '));
    }

    /**
     * Detaches all event handlers from a JQuery selected HTML element.
     */
    static detachEventHandlers(html: JQuery<HTMLElement>) {
        // First clear all javascript listeners to avoid memory leakings because of cross-references between js and rendering engine
        $(html).off();
        // Note: for large set of debug events (like 60000) there is 350,000 children to "off" the event listeners, and good old jquery.find('*') runs into maximum stack trace stuff
        // For speed we're iterating native html elements
        const childTraverser = (html: ChildNode) => {
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
     */
    static clearHTML(html: JQuery<HTMLElement> | undefined) {
        if (!html) return;
        Util.detachEventHandlers(html);
        $(html).empty();
    }

    /**
     * Deletes the html content of the element and detaches all underlying event handlers
     */
    static removeHTML(html: JQuery<HTMLElement> | undefined) {
        if (!html) return;
        Util.detachEventHandlers(html);
        $(html).remove();
    }

    /**
     * returns a random character set of length n
     */
    static getRandomSet(n: number) {
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
     * Calculates a hash of a string. Same string will always return the same hash.
     * 
     * @param input text to be hashed
     * @returns number representing the hash of the input
     */
    static hashCode(input: string): number {
        let hash = 0;
      
        if (input.length === 0) return hash;
      
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0;
        }
      
        return hash;
}    

    /**
     * Simple helper function that removes an element from an array, if it is in the array.
     * Returns the arrayIndex the element had in the array, or -1.
     */
    static removeFromArray<T extends any>(array: T[], element: any): number {
        const arrayIndex = array.indexOf(element);
        if (arrayIndex > -1) {
            array.splice(arrayIndex, 1);
        }
        return arrayIndex;
    }

    static insertInArray<T extends any>(array: T[], element: any, after?: any): T[] {
        Util.removeFromArray(array, element);
        const index = array.indexOf(after);
        if (index >= 0 && index < array.length - 1) {
            array.splice(index + 1, 0, element);
        } else {
            array.push(element);
        }
        return array;
    }

    /**
     * Remove duplicate elements from an array
     */
    static removeDuplicates<T extends any> (array: T[]): T[] {
        const size = array.length;
        const copy = [...array];
        const set = new Set<T>();
        copy.forEach(object => set.add(object));
        Util.clearArray(array);
        array.push(...Array.from(set));
        const newSize = array.length;
        return array;
    }

    /**
     * Simple helper function that removes all elements from an array.
     */
    static clearArray<T extends any>(array: T[]): T[] {
        array.splice(0, array.length);
        return array;
    }

    static withoutNewlinesAndTabs(str: string) {
        if (typeof (str) !== 'string') return str;
        return str ? str.replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\t/g, ' ') : str;
    }

    /**
     * Returns true if sub class extends superclass somewhere in the type chain.
     */
    static isSubClassOf(superClass: Function, subClass: Function): boolean {
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
     */
    static parseJSON(source: any): ParseResult {
        return new ParseResult(source);
    }
}

class ParseResult {
    lineNumber: number = -1;
    column: number = -1;
    description: string = '';
    error: any;
    constructor(public source: any) {
    }

    get object() {
        try {
            return JSON.parse(this.source);
        } catch (error: any) {
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

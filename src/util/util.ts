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

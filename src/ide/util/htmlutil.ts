import Util from "@util/util";
import $ from "jquery";

export default class HtmlUtil {
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
        HtmlUtil.detachEventHandlers(html);
        $(html).empty();
    }

    /**
     * Deletes the html content of the element and detaches all underlying event handlers
     */
    static removeHTML(html: JQuery<HTMLElement> | undefined) {
        if (!html) return;
        HtmlUtil.detachEventHandlers(html);
        $(html).remove();
    }

}
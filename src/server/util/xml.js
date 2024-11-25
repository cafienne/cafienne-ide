'use strict';

const { DOMParser, XMLSerializer } = require("@xmldom/xmldom");


class XMLParseResult {
    /**
     * Result of parsing a string to xml document
     * 
     * @param {String} source 
     */
    constructor(source) {
        this.source = source;
        this.errors = [];
        this.parse();
    }

    /**
     * @returns {Document}
     */
    parse() {
        if (!this.source) {
            this.setError('File is empty');
            return undefined;
        }
        // treat warnings as errors too
        const errorHandler = (level, msg) => this.setError(msg, level);
        this.document = new DOMParser({ errorHandler }).parseFromString(this.source);
        if (!this.document.documentElement && this.errors.length == 0) {
            this.setError('Missing root xml element');
        }
    }

    /**
     * The documentElement if parsing was succesful.
     * @returns {Element}
     */
    get element() {
        return this.document && this.document.documentElement;
    }

    /**
     * Indicates whether parsing resulted in errors or not
     * @returns {Boolean}
     */
    get hasErrors() {
        return this.errors.length > 0;
    }

    setError(message, errorLevel) {
        this.errors.push(message);
    }
}

class XML {
    /** 
     * Parses the xml string and returns an XMLParseResult object
     * @param {String} string 
     * @returns {XMLParseResult}
     */
    static parse(string) {
        return new XMLParseResult(string);
    }

    /** 
     * Parses the xml string and returns the documentElement
     * @param {String} string 
     * @returns {Element}
     */
    static loadXMLElement(string) {
        return XML.parse(string).element;
    }

    /**
     * Returns an array with all elements under the given XML node
     * @param {Document | Element | Node} xmlNode 
     * @param {Array<Element>} array Optionally provide an array to which the elements will be added, or one will be created
     */
    static allElements(xmlNode) {
        return this.findElementsWithTag(xmlNode, '*');
    }

    /**
     * Returns all children of the node as an array. Easier to iterate ...
     * @param {Node} xmlNode 
     * @returns {Array<Node>}
     */
    static children(xmlNode) {
        if (xmlNode == undefined) return [];
        const array = [];
        const nodes = xmlNode.childNodes;
        for (let i = 0; i < nodes.length; i++) {
            array.push(nodes[i]);
        }
        return array;
    }

    /**
     * Returns all elements of the node as an array. Easier to iterate ...
     * @param {Node} xmlNode 
     * @returns {Array<Element>}
     */
    static elements(xmlNode) {
        return this.children(xmlNode).filter(node => node.nodeType === 1);        
    }

    /**
     * Cleans any empty Text children from the element, but only if there are no other children in it.
     * @param {Element} element 
     */
    static cleanElement(element) {
        const children = XML.children(element);
        if (children.length === 0) {
            // No children, nothing to clean
            return;
        }

        // First check if we have content other than text nodes.
        const TEXT_NODE = 3; // Weird. We cannot use Node.TEXT_NODE???
        if (children.filter(node => node.nodeType !== TEXT_NODE).length > 0) {
            // Other content present, nothing to clean
            return;
        }

        const textContent = children.filter(node => node.nodeValue !== null).map(node => node.nodeValue).join('');
        if (textContent.trim().length === 0) {
            // Apparently only empty content, let's remove the nodes.
            children.forEach(node => element.removeChild(node));
        }
    }

    /**
     * Returns an Array of elements matching the tagname. For easy iteration (foreach, map, filter, etc)
     * @param {Element | Document} xmlNode 
     * @param {String} tagName 
     * @returns {Array<Element>}
     */
    static findElementsWithTag(xmlNode, tagName) {
        if (xmlNode == undefined) return [];
        const elementsArray = [];
        const nodes = xmlNode.getElementsByTagName(tagName);
        for (let i = 0; i < nodes.length; i++) {
            elementsArray.push(nodes[i]);
        }
        return elementsArray;
    }

    /**
     * Returns an Array of elements matching the tagname. For easy iteration (foreach, map, filter, etc)
     * @param {Element | Document} xmlNode 
     * @param {String} tagName 
     * @returns {Element | null}
     */
    static findElement(xmlNode, tagName) {
        const elements = this.findElementsWithTag(xmlNode, tagName);
        return elements.length ? elements[0] : null;
    }

    /**
     * Returns an Array of elements that are direct children of xmlNode with the matching tagname. For easy iteration (foreach, map, filter, etc)
     * @param {Element | Document} xmlNode 
     * @param {String} tagName 
     * @returns {Array<Element>}
     */
    static findChildrenWithTag(xmlNode, tagName) {
        if (xmlNode == undefined) return [];
        const elementsArray = [];
        const nodes = xmlNode.getElementsByTagName(tagName);
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.parentNode == xmlNode) {
                elementsArray.push(nodes[i]);
            }
        }
        return elementsArray;
    }

    /**
     * Clones the node, but only with local names.
     * Note: this method invokes Node.cloneNode(deep) if node is not of type Element.
     * This effectively drops the namespace and makes the node adopt the default namespace of a target
     * that it can be attached to.
     * @param {Node} node 
     * @param {Boolean} deep Whether to include any children of the node if it is of type element, defaults to true
     */
    static cloneWithoutNamespace(node, deep = true) {
        if (node.nodeType === 1) {
            const element = /** @type {Element} */ (node);
            const newNode = element.ownerDocument.createElement(element.localName);
            const attributes = element.attributes;
            if (attributes !== null) {
                for (let i = 0; i < attributes.length; i++) {
                    const attribute = attributes.item(i);
                    if (attribute && attribute.nodeValue) {
                        newNode.setAttribute(attribute.localName, attribute.nodeValue);
                    }
                }
            }
            if (deep) {
                XML.children(element).forEach(child => newNode.appendChild(this.cloneWithoutNamespace(child, deep)));
            }
            return newNode;
        } else {
            return node.cloneNode(deep);
        }
    }

    /**
     * Pretty prints an XML string or node, based on regular expressions.
     * @param {Element | Document} object 
     */
    static printNiceXML(object) {
        const createShiftArr = (step) => {
            let space = '    ';
            if (isNaN(parseInt(step))) {  // argument is string
                space = step;
            } else { // argument is integer
                space = new Array(step + 1).join(' '); //space is result of join (a string), not an array
            }
            const shift = ['\n']; // array of shifts
            for (let ix = 0; ix < 100; ix++) {
                shift.push(shift[ix] + space);
            }
            return shift;
        }


        // Algorithm below takes a string and formats it; if an XML node is passed, we first serialize it to string.
        const text = typeof (object) == 'string' ? object : new XMLSerializer().serializeToString(object);
        //  This code is based on jquery.format.js by Zach Shelton
        //  https://github.com/zachofalltrades/jquery.format        
        const shift = createShiftArr('    '); // 4 spaces
        const ar = text.replace(/>\s{0,}</g, '><')
            .replace(/</g, '~::~<')
            .split('~::~'),
            len = ar.length;
        let inComment = false,
            deep = 0,
            str = '';

        for (let ix = 0; ix < len; ix++) {

            // start comment or <![CDATA[...]]> or <!DOCTYPE //
            if (ar[ix].search(/<!/) > -1) {

                str += shift[deep] + ar[ix];
                inComment = true;
                // end comment  or <![CDATA[...]]> //
                if (ar[ix].search(/-->/) > -1
                    || ar[ix].search(/\]>/) > -1
                    || ar[ix].search(/!DOCTYPE/) > -1) {

                    inComment = false;
                }
            } else

                // end comment  or <![CDATA[...]]> //
                if (ar[ix].search(/-->/) > -1
                    || ar[ix].search(/\]>/) > -1) {

                    str += ar[ix];
                    inComment = false;
                } else

                    // <elm></elm> //
                    if (/^<\w/.exec(ar[ix - 1])
                        && /^<\/\w/.exec(ar[ix])
                        && /^<[\w:\-\.\,]+/.exec(ar[ix - 1]) == /^<\/[\w:\-\.\,]+/.exec(ar[ix])[0].replace('/', '')) {

                        str += ar[ix];
                        if (!inComment) deep--;
                    } else

                        // <elm> //
                        if (ar[ix].search(/<\w/) > -1
                            && ar[ix].search(/<\//) == -1
                            && ar[ix].search(/\/>/) == -1) {

                            str = !inComment ? str += shift[deep++] + ar[ix] : str += ar[ix];
                        } else

                            // <elm>...</elm> //
                            if (ar[ix].search(/<\w/) > -1
                                && ar[ix].search(/<\//) > -1) {

                                str = !inComment ? str += shift[deep] + ar[ix] : str += ar[ix];
                            } else

                                // </elm> //
                                if (ar[ix].search(/<\//) > -1) {

                                    str = !inComment ? str += shift[--deep] + ar[ix] : str += ar[ix];
                                } else

                                    // <elm/> //
                                    if (ar[ix].search(/\/>/) > -1) {

                                        str = !inComment ? str += shift[deep] + ar[ix] : str += ar[ix];
                                    } else

                                        // <? xml ... ?> //
                                        if (ar[ix].search(/<\?/) > -1) {

                                            str += shift[deep] + ar[ix];
                                        } else

                                            // xmlns //
                                            if (ar[ix].search(/xmlns\:/) > -1
                                                || ar[ix].search(/xmlns\=/) > -1) {

                                                str += shift[deep] + ar[ix];
                                            }
                                            else {

                                                str += ar[ix];
                                            }
        }

        return (str[0] == '\n') ? str.slice(1) : str;
    }
}

exports.XML = XML;

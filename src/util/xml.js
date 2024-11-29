export default class XML {
    /**
     * Parses the given xml string into a Document object
     * If there are parse failures, this will return undefined.
     * @param {String|Node} xml
     * @returns {Document|undefined}
     */
    static parseXML(xml) {
        if (xml instanceof Document) {
            return xml;
        } else if (xml instanceof Node) {
            return xml.ownerDocument;
        }
        const xmlDocument = XML.loadXMLString(xml);
        if (XML.getParseErrors(xmlDocument).length === 0) {
            return xmlDocument;
        } else {
            return undefined;
        }
    }

    /**
     * Returns a list with parse errors, if any.
     * If there are no parse errors, then the list is empty.
     * @param {Document} xmlDocument 
     * @returns {Array<String>}
     */
    static getParseErrors(xmlDocument) {
        const errors = [];
        if (DOMParser) { // code for all but IE
            const parseErrors = xmlDocument.getElementsByTagName('parsererror');
            for (let i = 0; i < parseErrors.length; i++) {
                errors.push(parseErrors.item(i).textContent);
            }
        }
        return errors;
    }

    /**
     * returns true when the xmlDcoument has no errors, false when there are errors during parsing of XML
     * @param {Document} xmlDocument 
     * @returns {Boolean}
     */
    static isValid(xmlDocument) {
        return this.getParseErrors(xmlDocument).length === 0;
    }

    /**
     * returns true when the xmlDcoument has errors, false when there are errors during parsing of XML
     * @param {Document} xmlDocument 
     * @returns {Boolean}
     */
    static hasParseErrors(xmlDocument) {
        return !this.isValid(xmlDocument);
    }

    /**
     * returns an xml document based on the passed string
     * @param {String} txt 
     * @returns {Document}
     */
    static loadXMLString(txt) {
        if (DOMParser) {
            return new DOMParser().parseFromString(txt, 'text/xml');
        } else {
            // code for IE
            const xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
            xmlDoc.async = false;
            xmlDoc.loadXML(txt);
            return xmlDoc;
        }
    }

    /**
     * Creates a child element with the specified tagName.
     * If the parentNode is of type Element the new child will be appended to it.
     * If the parentNode is a Document, then the new child is not appended.
     * 
     * @param {Element | Document} parentNode 
     * @param {String} tagName 
     * @param {String} namespace 
     * @returns {Element} The newly created element
     */
    static createChildElement(parentNode, tagName, namespace = "http://www.omg.org/spec/CMMN/20151109/MODEL") {
        if (tagName.indexOf('cafienne:') === 0) {
            namespace = 'org.cafienne';
        }
        if (parentNode instanceof Document) {
            return parentNode.createElementNS(namespace, tagName);
        } else {
            return parentNode.appendChild(parentNode.ownerDocument.createElementNS(namespace, tagName));
        }
    }

    /**
     * Creates a text node with the specified text and appends it to the parentNode
     * @param {Node} parentNode 
     * @param {String} text 
     * @returns {Text} The newly created element
     */
    static createTextChild(parentNode, text) {
        return parentNode.appendChild(parentNode.ownerDocument.createTextNode(text));
    }
    /**

     * Returns the first element child of xmlNode that has the corresponding tagName, or undefined. 
     * @param {Element | Document} xmlNode 
     * @param {String} tagName 
     * @returns {Element}
     */
    static getChildByTagName(xmlNode, tagName) {
        const children = XML.getChildrenByTagName(xmlNode, tagName);
        return children.length > 0 ? children[0] : undefined;
    }

    /**
     * Wrapper function around DOM.getElementsByTagName, but yielding only direct children of XML node.
     * Returns an Array.
     * @param {Element | Document} xmlNode 
     * @param {String} tagName 
     * @returns {Array<Element>}
     */
    static getChildrenByTagName(xmlNode, tagName) {
        const elementsArray = [];
        XML.getElementsByTagName(xmlNode, tagName).forEach(element => {
            if (element.parentNode == xmlNode) elementsArray.push(element);
        });
        return elementsArray;
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
        return this.children(xmlNode).filter(node => node.nodeType === Node.ELEMENT_NODE);
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
        if (children.filter(node => node.nodeType !== Node.TEXT_NODE).length > 0) {
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
            const newNode = this.createChildElement(element.ownerDocument, element.localName);
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
     * Returns an array with all elements under the given XML node
     * @param {Document | Element | Node} xmlNode 
     * @param {Array<Element>} array Optionally provide an array to which the elements will be added, or one will be created
     */
    static allElements(xmlNode, array = []) {
        xmlNode && xmlNode.childNodes.forEach(child => {
            if (child instanceof Element) {
                array.push(child);
                this.allElements(child, array);
            }
        })
        return array;
    }

    /**
     * Wrapper function around DOM.getElementsByTagName, returning an array that can be 
     * looped over with a forEach function. If the xmlNode is undefined, an empty array will be returned.
     * @param {Element | Document} xmlNode 
     * @param {String} tagName 
     * @returns {Array<Element>}
     */
    static getElementsByTagName(xmlNode, tagName) {
        if (xmlNode == undefined) return [];
        const elementsArray = [];
        const nodes = xmlNode.getElementsByTagName(tagName);
        for (let i = 0; i < nodes.length; i++) {
            elementsArray.push(nodes[i]);
        }
        return elementsArray;
    }

    /**
     * Return the first element in the node that has the requested tag name
     * @param {Element | Document} xmlNode 
     * @param {String} tagName 
     * @returns {Element | undefined}
     */
    static getElement(xmlNode, tagName) {
        const elements = this.getElementsByTagName(xmlNode, tagName);
        return elements.length > 0 ? elements[0] : undefined;
    }

    /**
     * returns the <![CDATA[..]]> node which is a child of the parentNode. If there is no such node
     * then the parentNode will be returned.
     * For most browsers the CDATA node is the second child of the parentNode, but not always. So look for 'cdata' in the nodename
     * @param {*} parentNode 
     */
    static getCDATANodeOrSelf(parentNode) {
        for (let i = 0; i < parentNode.childNodes.length; i++) {
            const childNode = parentNode.childNodes[i];
            if (childNode.nodeName.toLowerCase().search('cdata') >= 0) {
                return childNode;
            }
        }
        return parentNode;
    }

    /**
     * Removes any attributes from the tree that have the exact same namespace attribute (including the prefix) as the parent element.
     * E.g. a parent and child both having xmlns:cmmn="http://www.omg.org/spec/CMMN/20151109/MODEL", then it will remove it from the child.
     * This is typically needed when an element is created independently and then appended to a new parent.
     * 
     * This method is invoked by default from pretty-printing
     * @param {any} tree 
     */
    static removeUnnecessaryNamespaceAttributes(tree) {
        if (!tree instanceof Element && !tree instanceof Document) {
            return;
        }
        XML.allElements(tree).forEach(element => {
            const parent = element.parentElement;
            if (parent !== null) {
                const xmlnsAttributes = element.getAttributeNames().filter(name => name.startsWith("xmlns"));
                xmlnsAttributes.forEach(name => {
                    if (parent.getAttribute(name) === element.getAttribute(name)) {
                        element.removeAttribute(name);
                    }
                });
            }
        });
    }

    /**
     * Pretty prints an XML string or node, based on regular expressions.
     * @param {*} object 
     */
    static prettyPrint(object) {
        if (!object) return '';
        // Algorithm below takes a string and formats it; if an XML node is passed, we first serialize it to string.
        const xml = typeof (object) == 'string' ? this.parseXML(object) : object;
        this.removeUnnecessaryNamespaceAttributes(xml);
        const text = new XMLSerializer().serializeToString(xml);
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

                        if (!inComment) {
                            --deep;
                        }
                        str = (!inComment && str.endsWith('/>')) ? str += shift[deep] + ar[ix] : str += ar[ix];
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

/**
 * utility function called from constructor of Formatter
 */
function createShiftArr(step) {
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

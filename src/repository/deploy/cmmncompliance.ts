import XML from "../../util/xml";

export default class CMMNCompliance {
    static convert(element: Element): void {
        this.splitPlanItemsFromDefinitions(element);
        this.splitCriteriaAndSentries(element);
    }

    static splitPlanItemsFromDefinitions(element: Element): void {
        // No need to do conversion if the case element contains <planItem> elements
        if (XML.allElements(element).filter(child => child.tagName === 'planItem').length > 0) {
            // Nothing to convert, this is an old style model
            return;
        }
        const casePlan = XML.getChildByTagName(element, 'casePlanModel');
        if (!casePlan) {
            // Deploying a case without a plan, interesting ;)
            return;
        }

        const isDefinitionName = (node: Element) => {
            switch (node.tagName) {
                case 'humanTask':
                case 'caseTask':
                case 'processTask':
                case 'milestone':
                case 'userEvent':
                case 'timerEvent':
                case 'stage':
                    return true;
                default:
                    return false;
            }
        }

        const isPlanItemChild = (child: Element) => {
            switch (child.tagName) {
                case 'documentation':
                case 'entryCriterion':
                case 'reactivateCriterion':
                case 'exitCriterion':
                case 'itemControl':
                case 'extensionElements':
                    return true;
                default:
                    return false;
            }
        }

        const isPlanItemExtension = (child: Element) => {
            switch (child.tagName) {
                case 'four_eyes':
                case 'rendez_vous':
                case 'reactivateCriterion':
                    return true;
                default:
                    return false;
            }
        }

        const isPlanItemAttribute = (attribute: Attr) => {
            switch (attribute.name) {
                case 'id':
                case 'name':
                case 'authorizedRoleRefs':
                    return true;
                default:
                    return false;
            }
        }

        const splitAttributes = (itemDefinition: Element, item: Element) => {
            // Move some of the plan item attributes into the new node.
            item.setAttribute('id', '' + itemDefinition.getAttribute('id'));
            item.setAttribute('name', '' + itemDefinition.getAttribute('name'));

            // Generate a new id attribute on the definition element
            const newDefinitionId = generateId(itemDefinition);
            itemDefinition.setAttribute('id', newDefinitionId);

            // Make the reference to the definition
            item.setAttribute('definitionRef', newDefinitionId);

            // AuthorizedRoleRefs have to be moved if the item is discretionary, 
            //  but not if the definition is a UserEvent (which cannot be discretionary right now)
            if (itemDefinition.getAttribute('authorizedRoleRefs') && item.tagName === 'discretionaryItem') {
                item.setAttribute('authorizedRoleRefs', '' + itemDefinition.getAttribute('authorizedRoleRefs'));
                itemDefinition.removeAttribute('authorizedRoleRefs');
            }
        }

        const splitItemDefinition = (itemDefinition: Element) => {
            const tagName = itemDefinition.parentNode?.nodeName === 'planningTable' ? 'discretionaryItem' : 'planItem';
            // console.log("Adding " + tagName +" for a " + itemDefinition.tagName)
            const item = XML.createChildElement(itemDefinition, tagName);
            // First split the attributes across new item and it's definition, and put a definitionRef to link both
            splitAttributes(itemDefinition, item);

            // Move some children to the new item node
            XML.getChildrenByTagName(itemDefinition, '*').filter(isPlanItemChild).forEach(child => {
                if (child.tagName === 'extensionElements') {
                    const planItemExtensions = XML.elements(child).filter(isPlanItemExtension);
                    if (planItemExtensions.length > 0) {
                        // First, create a new extensionsNode in the planItem
                        const itemExtensions = item.appendChild(<Element>child.cloneNode(false));
                        // Now, move the plan item extension children into that new node.
                        planItemExtensions.forEach(itemExtension => itemExtensions.appendChild(itemExtension));
                    }
                } else {
                    item.appendChild(child);
                }
            });
            if (!itemDefinition.parentNode) {
                console.log("Found a " + itemDefinition.tagName + " without a parent ")
            }
            // Append the new <planItem> element to parent, at the same location
            itemDefinition.parentNode?.insertBefore(item, itemDefinition);
            // Clean empty text nodes from the definition
            XML.cleanElement(itemDefinition);
            // And move the definition element to the case plan
            casePlan.appendChild(itemDefinition);
        }

        const items = XML.allElements(casePlan).filter(isDefinitionName);
        // console.log("Splitting " + items.length + " definitions into plan items and discretionary items\n");
        items.forEach(splitItemDefinition);
    }

    static splitCriteriaAndSentries(element: Element): void {
        const sentryElements = XML.getElementsByTagName(element, 'sentry');
        if (sentryElements.length > 0) {
            // Nothing to convert, as sentries are available the old way.
            return;
        }
        const criteria = XML.allElements(element).filter(child => child.tagName.indexOf('Criterion') >= 0);
        if (criteria.length === 0) {
            // Nothing to convert, as the case model does not have any criteria defined.
            return;
        }
        const lastPlanItemOrSentryFinder = (element: Element): Element | undefined => {
            if (element.tagName === 'stage' || element.tagName === 'casePlanModel') {
                const sentries = XML.getChildrenByTagName(element, 'sentry');
                if (sentries.length > 0) {
                    return sentries[sentries.length - 1];
                }
                const planItems = XML.getChildrenByTagName(element, 'planItem');
                return planItems[planItems.length - 1];
            }
            if (element.tagName === 'case') {
                return undefined;
            }
            if (!element.parentNode) {
                return undefined;
            }
            return lastPlanItemOrSentryFinder(<Element>element.parentNode);
        }
        criteria.forEach(criterion => {
            const lastPlanItem = lastPlanItemOrSentryFinder(criterion);
            if (lastPlanItem) {
                const sentry = XML.createChildElement(criterion, 'sentry');
                const criterionId = criterion.getAttribute('id');
                const sentryId = `s_${criterionId}`
                sentry.setAttribute('id', sentryId);
                criterion.setAttribute('sentryRef', sentryId);
                criterion.parentNode?.insertBefore(criterion.cloneNode(false), criterion);
                criterion.parentNode?.removeChild(criterion);
                if (lastPlanItem.nextSibling) {
                    lastPlanItem.parentNode?.insertBefore(sentry, lastPlanItem.nextSibling);
                } else {
                    lastPlanItem.parentNode?.appendChild(sentry);
                }
                // Move the criterion content into the <sentry> element
                XML.elements(criterion).forEach(child => sentry.appendChild(XML.cloneWithoutNamespace(child)));
            }
        });
    }
}

function generateId(xmlElement: Element): string {
    const id = xmlElement.getAttribute('id');
    if (id?.startsWith('pi_')) {
        return id.substring(3);
    }
    const prefix = () => {
        switch (xmlElement.tagName) {
            case 'humanTask': return 'ht_';
            case 'caseTask': return 'ct_';
            case 'processTask': return 'pt_';
            case 'milestone': return 'ms_';
            case 'userEvent': return 'ue_';
            case 'timerEvent': return 'tmr_';
            case 'stage': return 's_';
            default: {
                console.warn("Found unexpected plan item of type " + xmlElement.tagName);
                return '';
            }
        }
    }

    return prefix() + xmlElement.getAttribute('id');
}

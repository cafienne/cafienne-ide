/**
 * Helper class for creating new names and/or IDs within a given ModelDefinition.
 */
export default class TypeCounter {
    /**
     * Simple type counter class for counting types of cmmn element definitions
     * @param {ModelDefinition} modelDefinition 
     */
    constructor(modelDefinition) {
        this.modelDefinition = modelDefinition;
        this.guid = this.modelDefinition.parseAttribute('guid', Util.createID());
    }

    getNextIdOfType(constructor) {
        const prefix = (constructor.prefix ? constructor.prefix + '_' : '') + this.guid + '_';
        return this.getNextCounter('id', prefix);
    }

    getNextNameOfType(constructor) {
        const prefix = this.getTypeName(constructor) + '_';
        return this.getNextCounter('name', prefix);
    }

    getTypeName(constructor) {
        const definitionCharacter = constructor.name.indexOf('Definition');
        if (definitionCharacter > 0) {
            return constructor.name.substring(0, definitionCharacter);
        } else {
            return constructor.name;
        }
    }

    getNextCounter(type, prefix) {
        // console.warn("Calculating next " + type +" of " + prefix)
        const elementsWithPrefix = this.modelDefinition.elements.filter(element => typeof(element[type]) === 'string' && element[type].indexOf(prefix) == 0).map(element => element[type]);
        // console.log("Found " + elementsWithPrefix.length +" elements where " + type +" contains prefix " + prefix + ": [" + elementsWithPrefix.join(', ') + "]")
        const counters = elementsWithPrefix.map(prefixedValue => new Number(prefixedValue.replace(prefix, ''))).filter(number => !Number.isNaN(number));
        // console.log("Found " + counters.length +" numbers [" + counters.join(", ") +"]")
        const sorted = counters.sort((a,b) => a > b ? 1 : a == b ? 0 : -1);
        // console.log("Sorted numbers:  [" + sorted.join(", ") +"]")
        return prefix + (sorted.length === 0 ? 0 : sorted[sorted.length - 1].valueOf() + 1);
    }
}

import Util from "../../util/util";
import ModelDefinition from "./modeldefinition";

/**
 * Helper class for creating new names and/or IDs within a given ModelDefinition.
 */
export default class TypeCounter {
    guid: string;
    /**
     * Simple type counter class for counting types of cmmn element definitions
     */
    constructor(private modelDefinition: ModelDefinition) {
        this.guid = this.modelDefinition.parseAttribute('guid', Util.createID());
    }

    getNextIdOfType(constructor: Function) {
        const prefix = ((constructor as any).prefix ? (constructor as any).prefix + '_' : '') + this.guid + '_';
        return this.getNextCounter('id', prefix);
    }

    getNextNameOfType(constructor: Function) {
        const prefix = this.getTypeName(constructor) + '_';
        return this.getNextCounter('name', prefix);
    }

    getTypeName(constructor: Function) {
        const definitionCharacter = constructor.name.indexOf('Definition');
        if (definitionCharacter > 0) {
            return constructor.name.substring(0, definitionCharacter);
        } else {
            return constructor.name;
        }
    }

    getNextCounter(type: string, prefix: string) {
        // console.warn("Calculating next " + type +" of " + prefix)
        const elementsWithPrefix = this.modelDefinition.elements.filter(element => typeof((element as any)[type]) === 'string' && (element as any)[type].indexOf(prefix) == 0).map(element => (element as any)[type]);
        // console.log("Found " + elementsWithPrefix.length +" elements where " + type +" contains prefix " + prefix + ": [" + elementsWithPrefix.join(', ') + "]")
        const counters = elementsWithPrefix.map(prefixedValue => new Number(prefixedValue.replace(prefix, ''))).filter(number => !Number.isNaN(number));
        // console.log("Found " + counters.length +" numbers [" + counters.join(", ") +"]")
        const sorted = counters.sort((a,b) => a > b ? 1 : a == b ? 0 : -1);
        // console.log("Sorted numbers:  [" + sorted.join(", ") +"]")
        return prefix + (sorted.length === 0 ? 0 : sorted[sorted.length - 1].valueOf() + 1);
    }
}

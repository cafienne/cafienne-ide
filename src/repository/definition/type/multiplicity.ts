import AttributeDefinition from "../attributedefinition";

const list: Multiplicity[] = [];

export default class Multiplicity extends AttributeDefinition {
    static get values(): Multiplicity[] {
        return list;
    }

    static readonly ExactlyOne = new Multiplicity('ExactlyOne', '[1]');
    static readonly ZeroOrOne = new Multiplicity('ZeroOrOne', '[0..1]');
    static readonly ZeroOrMore = new Multiplicity('ZeroOrMore', '[0..*]');
    static readonly OneOrMore = new Multiplicity('OneOrMore', '[1..*]');
    static readonly Unspecified = new Multiplicity('Unspecified', '[*]');
    static readonly Unknown = new Multiplicity('Unknown', '[?]');

    static parse(value?: string): Multiplicity {
        const m = list.find(m => m.value === value);
        return m !== undefined ? m : new Multiplicity(String(value), 'Invalid', false); ``
    }

    private constructor(public readonly value: string, public readonly label: string, valid: boolean = true) {
        super(value, valid, list);
    }

    get isArray() {
        return this === Multiplicity.ZeroOrMore || this === Multiplicity.OneOrMore || this === Multiplicity.Unspecified;
    }
}

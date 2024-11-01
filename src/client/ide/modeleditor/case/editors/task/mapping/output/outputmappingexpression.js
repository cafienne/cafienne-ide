import MappingExpression from "../mappingexpression";

export default class OutputMappingExpression extends MappingExpression {

    static get tooltip() {
        return `Expression executed when the task completes or fails

Takes the value from the output parameter, transforms it and passes it to the operation`;
    }
}

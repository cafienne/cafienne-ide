import MappingExpression from "../mappingexpression";

export default class InputMappingExpression extends MappingExpression {

    static get tooltip() {
        return `Expression executed when the task becomes active

The (optional) case file item is passed as input to the epxression`;
    }
}

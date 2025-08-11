export default class ElementMetadata {
    name: string;

    constructor(public elementType: Function, public typeDescription: string, public smallImage: string, public menuImage: string) {
        this.name = elementType.name;

        // TODO: Remove backwards compatibility code. Still used in e.g. modellistpanel 
        (<any>elementType).typeDescription = typeDescription;
        (<any>elementType).smallImage = smallImage;
        (<any>elementType).menuImage = menuImage;
    }

    get hasImage() {
        return this.smallImage !== '';
    }
}

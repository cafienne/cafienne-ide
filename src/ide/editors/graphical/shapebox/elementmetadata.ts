
export default class ElementMetadata {
    name: string;

    constructor(public cmmnElementType: Function, public typeDescription: string, public smallImage: string, public menuImage: string) {
        this.name = cmmnElementType.name;

        // TODO: Remove backwards compatibility code. Still used in e.g. modellistpanel 
        (<any>cmmnElementType).typeDescription = typeDescription;
        (<any>cmmnElementType).smallImage = smallImage;
        (<any>cmmnElementType).menuImage = menuImage;
    }

    get hasImage() {
        return this.smallImage !== '';
    }
}

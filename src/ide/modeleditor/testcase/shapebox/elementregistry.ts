

export default class ElementRegistry {
    static viewMetadata: ElementMetadata[] = [];

    static initialize() {
        if (this.viewMetadata.length > 0) {
            // Means we already initialized.
            return;
        }
        //        this.registerType(HumanTaskView, 'Human Task', Shapes.HumanTask, Icons.HumanTask);
    }

    /**
     * Registers a class that extends CMMNElementView by it's name.
     * @param cmmnElementType 
     * @param typeDescription Friendly description of the type
     * @param smallImageURL url of small image (for drag/drop, shapebox, etc.)
     * @param menuImageURL optional url of image shown in repository browser
     */
    static registerType(cmmnElementType: Function, typeDescription: string, smallImageURL: string = '', menuImageURL: string = smallImageURL) {
        this.viewMetadata.push(new ElementMetadata(cmmnElementType, typeDescription, smallImageURL, menuImageURL));
    }

    static getType(name: string) {
        return this.viewMetadata.find(type => type.name === name)?.cmmnElementType;
    }
}

export class ElementMetadata {
    name: string;

    constructor(public cmmnElementType: Function, public typeDescription: string, public smallImage: string, public menuImage: string) {
        this.name = cmmnElementType.name;

        // TODO: Remove backwards compatibility code. Still used in e.g. modellistpanel 
        (<any>cmmnElementType).typeDescription = cmmnElementType.name;
        (<any>cmmnElementType).smallImage = smallImage;
        (<any>cmmnElementType).menuImage = menuImage;
    }

    get hasImage() {
        return this.smallImage !== '';
    }
}

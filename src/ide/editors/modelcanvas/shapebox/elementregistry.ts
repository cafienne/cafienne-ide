import ElementMetadata from "./elementmetadata";

export default abstract class ElementRegistry {
    viewMetadata: ElementMetadata[] = [];

    /**
     * Registers a class that extends CaseElementView by it's name.
     * @param elementType 
     * @param typeDescription Friendly description of the type
     * @param smallImageURL url of small image (for drag/drop, shapebox, etc.)
     * @param menuImageURL optional url of image shown in repository browser
     */
    registerType(elementType: Function, typeDescription: string, smallImageURL: string = '', menuImageURL: string = smallImageURL) {
        this.viewMetadata.push(new ElementMetadata(elementType, typeDescription, smallImageURL, menuImageURL));
    }
}

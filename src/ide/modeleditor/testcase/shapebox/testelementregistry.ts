import ElementRegistry from "../../../editors/modelcanvas/shapebox/elementregistry";
import Images from "../../../util/images/images";
import FixtureView from "../elements/fixtureview";


export default class TestElementRegistry extends ElementRegistry {
    constructor() {
        super();

        this.registerType(FixtureView, 'Fixture', Images.Test, Images.Test);
    }
}

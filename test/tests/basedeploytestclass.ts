import Utilities from "src/server/util/utilities";
import { XML } from "src/server/util/xml";
import BaseTestClass from './basetestclass';

export default class BaseDeployTestClass extends BaseTestClass {
    public source = this.caseName + '.case';
    public target = this.caseName + '.xml';
    public deployedFile = this.repository.deployPath + '/' + this.target;
    public expectedFile = this.repository.deployPath + '_expected/' + this.target;

    constructor(public caseName: string) {
        super();

        if (Utilities.hasFile(this.deployedFile)) {
            Utilities.deleteFile(this.deployedFile);
        }

        if (Utilities.hasFile(this.deployedFile)) {
            throw new Error(`Did not expect file ${this.deployedFile} to exist`);
        }

        this.readInput('Press enter to continue');

        this.repository.deploy(this.source);

        if (!Utilities.hasFile(this.deployedFile)) {
            throw new Error(`Expected to find file ${this.deployedFile} but it does not exist`);
        }

        if (!Utilities.hasFile(this.expectedFile)) {
            throw new Error(`Cannot verify contents of ${this.deployedFile} as there is no file to compare to (cannot find a file '${this.expectedFile}')`)
            return;
        }

        const deployedContent: string = Utilities.readFile(this.deployedFile);
        const expectedContent: string = Utilities.readFile(this.expectedFile);

        const deployedXML = XML.printNiceXML(XML.loadXMLElement(deployedContent));
        const expectedXML = XML.printNiceXML(XML.loadXMLElement(expectedContent));

        if (deployedXML.length !== expectedXML.length) {
            throw new Error(`Expected content in generated deployed file has length ${deployedXML.length}, expected content has length  ${expectedXML.length}`);
        }

        if (deployedXML != expectedXML) {
            throw new Error(`Expected content in generated deployed file ${this.deployedFile} doesn't match with ${this.expectedFile}`);
        }
    }
}

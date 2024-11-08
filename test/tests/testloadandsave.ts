import Utilities from "src/server/util/utilities";
import BaseTestClass from './basetestclass';

export default class TestLoadAndSave extends BaseTestClass {
    constructor() {
        super();

        const cfidXML = 
`<caseFileItemDefinition name="Greeting" definitionType="http://www.omg.org/spec/CMMN/DefinitionType/Unspecified">
    <property name="Message" type="http://www.omg.org/spec/CMMN/PropertyType/string"/>
    <property name="To" type="http://www.omg.org/spec/CMMN/PropertyType/string"/>
    <property name="From" type="http://www.omg.org/spec/CMMN/PropertyType/string"/>
</caseFileItemDefinition>`;

        const greetingCFID = Utilities.createAbsolutePath(this.repository.repositoryPath, 'greeting.cfid');

        if (Utilities.hasFile(greetingCFID)) {
            Utilities.deleteFile(greetingCFID);
        }

        if (Utilities.hasFile(greetingCFID)) {
            throw new Error(`Did not expect file ${greetingCFID} to exist`);
        }

        this.repository.save(greetingCFID, cfidXML);

        this.readInput('Press enter to continue');

        if (!Utilities.hasFile(greetingCFID)) {
            throw new Error(`Expected to find file ${greetingCFID} but it does not exist`);
        }

        const typeXML = 
`<type id="abc.type" name="abc">
    <schema/>
</type>`;

        this.repository.save('abc.type', typeXML);

        console.log("TYPE: " + this.repository.load('abc.type'))
    }
}

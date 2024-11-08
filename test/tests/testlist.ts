import Utilities from "src/server/util/utilities";
import BaseTestClass from './basetestclass';

const REPOSITORY_SIZE = 40;

export default class TestList extends BaseTestClass {
    constructor() {
        super();
        const list = this.checkRepositorySize(REPOSITORY_SIZE);
        console.log("\nRepository content:")
        list.map(e => e.fileName).forEach(element => {
            console.log("- ", element)
        });

        console.log("\n");

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

        this.checkRepositorySize(REPOSITORY_SIZE-1);

        this.repository.save(greetingCFID, cfidXML);

        this.checkRepositorySize(REPOSITORY_SIZE);
        this.readInput('Press enter to continue');


        if (!Utilities.hasFile(greetingCFID)) {
            throw new Error(`Expected to find file ${greetingCFID} but it does not exist`);
        }
    }

    checkRepositorySize(expectedSize: number) {
        const list = this.repository.list();
        if (list.length !== expectedSize) {
            throw new Error(`Expected ${expectedSize} files in the repository, but found ${list.length}`);
        }
        return list;
    }
}

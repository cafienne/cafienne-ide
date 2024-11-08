import Utilities from "src/server/util/utilities";
import BaseTestClass from './basetestclass';

export default class TestViewCMMN extends BaseTestClass {
    constructor() {
        super();
        const helloworldCase = "helloworld.case";
        const helloworldXML = this.repository.deployPath + '/helloworld.xml';

        const greetingCFID = this.repository.repositoryPath + '/greeting.cfid';
        const greetingsCFID = this.repository.repositoryPath + '/greetings.cfid';

        if (Utilities.hasFile(greetingCFID)) {
            Utilities.renameFile(greetingCFID, greetingsCFID);
        }

        try  {
            const definitions = this.repository.composeDefinitionsDocument(helloworldCase);
            throw new Error('Not supposed to reach this line ...' + definitions.deployContents);
        } catch (error) {
            console.log("Failure in loading CMMN:\n\n", error);
        }

        this.readInput('Press enter to continue');

        Utilities.renameFile(greetingsCFID, greetingCFID);
        const definitions = this.repository.composeDefinitionsDocument(helloworldCase);

        console.log("XML: " + definitions.deployContents);

        // readline.question('Press enter to continue');

        const response = definitions.deployContents;
        console.log("CMMN: " + response);
    }
}

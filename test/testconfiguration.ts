import RepositoryConfiguration from "../src/server/config/config";

export default class TestConfiguration extends RepositoryConfiguration {
    constructor() {
        super();
        this.repository = './test/repository';
        this.deploy = './test/deploy';
    }
}

// import readline from 'readline-sync';
import Repository from "src/server/repository";
import TestConfiguration from "../testconfiguration";

export default class BaseTestClass {
    public enableReadLine = false;

    constructor(public repository: Repository = new Repository(new TestConfiguration())) {
    }

    readInput(msg: string = 'Press enter to continue\n') {

        // if (this.enableReadLine) {
        //     return readline.question(msg);
        // }
    }
}

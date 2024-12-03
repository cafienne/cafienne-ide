import Repository from "@repository/repository";

export class Runner {
    constructor(public repository: Repository = new Repository()) {
        console.log("Runner constructor");
    }

    run(args: string[]) {
        this.repository.listModels().then(() => {
            console.log(this.repository.list.map(item => item.name).join(", "));
            console.log("Runner run");
            console.log("Command-line arguments:", args);
        }).catch(error => {
            console.error("Runner run error", error);
        });
    }
}


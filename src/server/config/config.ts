export default class RepositoryConfiguration {
    public static default: RepositoryConfiguration = new RepositoryConfiguration();

    public repository: string = process.env.MODELER_REPOSITORY_PATH ? process.env.MODELER_REPOSITORY_PATH : './repository';
    public deploy: string = process.env.MODELER_DEPLOY_PATH ? process.env.MODELER_DEPLOY_PATH : './repository_deploy';
    public backendUrl: string = process.env.BACKEND_API_URL ? process.env.BACKEND_API_URL : 'http://localhost:2027';
}

export default class Extensions {
    static CASE = '.case';
    static PROCESS = '.process';
    static HUMANTASK = '.humantask';
    static DIMENSIONS = '.dimensions';
    static CFID = '.cfid';
    static TYPE = '.type';
    static DEFINITIONS = '.xml';

    static isKnown(extension: string): boolean {
        return extension == Extensions.CASE
            || extension == Extensions.DIMENSIONS
            || extension == Extensions.PROCESS
            || extension == Extensions.DEFINITIONS
            || extension == Extensions.HUMANTASK
            || extension == Extensions.CFID
            || extension == Extensions.TYPE;
    }

    static getRootTag(extension: string): string {
        if (extension == Extensions.CASE) return 'case';
        if (extension == Extensions.DIMENSIONS) return 'CMMNDI'
        if (extension == Extensions.PROCESS) return 'process';
        if (extension == Extensions.DEFINITIONS) return 'definitions'; // not quite needed here, but ok.
        if (extension == Extensions.HUMANTASK) return 'humantask';
        if (extension == Extensions.CFID) return 'caseFileItemDefinition';
        if (extension == Extensions.TYPE) return 'type';
        return '';
    }
}

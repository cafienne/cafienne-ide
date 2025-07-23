declare namespace WebdriverIO {
    interface Element {
        resize: (width: number, height: number) => Promise<void>;

        dropInCanvas$: (target: { x: number, y: number } | ChainablePromiseElement, refMove?: { x: number, y: number }) => ChainablePromiseElement | undefined;

        haloItem$: (namePrefix:
            // click items
            'Edit case input parameters' |
            'Edit case output parameters' |
            'Edit case team' |
            'Debug cases of this type' |
            'Deploy this case' |
            'Edit start case schema' |
            'View source of this case' |
            'Delete the ' |
            'Open input parameter mappings of the ' |
            // 'Task Preview not available' |
            'Create a new implementation for the task' |
            'Open output parameter mappings of the ' |
            'Preview Task Form' |
            'Open properties of the ' |
            'Open workflow properties' |
            'Open task implementation - ' |

            // drag items
            'Connector' |
            'Entry Criterion' |
            'Reactivate Criterion' |
            'Exit Criterion'
        ) => ChainablePromiseElement;
    }
}

import { readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

const directoryPath = join(process.cwd(), '.');

const exclusionPatterns = [
    /^\.\/ide\//,
    /^\.\/validate\//,
    /^\.\/deploy\//,
];

function generateExports(dirPath, relativeFolder = '.') {
    let exports = '';

    const files = readdirSync(dirPath);
    files.forEach(file => {
        const relativeFilePath = [relativeFolder, file].join('/')

        if (exclusionPatterns.some(pattern => pattern.test(relativeFilePath))) {
            return exports;
        }

        const filePath = join(dirPath, file);
        const stat = statSync(filePath);

        const scriptFilePattern = /(\.ts)|(\.js)$/;
        if (stat.isDirectory()) {
            exports += generateExports(filePath, relativeFilePath);
        } else if (stat.isFile() &&
            file.match(scriptFilePattern) &&
            !file.endsWith('.d.ts') && file !== 'index.ts' &&
            !file.endsWith('.d.js') && file !== 'index.js') {
            const modulePath = relativeFilePath.replace(scriptFilePattern, '');
            exports += `export * from "${modulePath}";\n`;
        }
    });

    return exports;
}

const exports = generateExports(directoryPath);
writeFileSync(join(directoryPath, 'index.js'), exports);
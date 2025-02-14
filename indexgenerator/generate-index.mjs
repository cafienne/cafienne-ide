import { join } from 'path';
import { IndexGenerator } from './indexgenerator.js';

const directoryPath = join(process.cwd(), './src'); // TODO make the input a command line argument

const generator = new IndexGenerator(directoryPath);
console.log("Collecting source files inside " +directoryPath);
generator.collectFiles();
console.log("Generating export statements");
generator.generateExportStatements();
console.log("Writing file index.js");
generator.writeIndexFile();

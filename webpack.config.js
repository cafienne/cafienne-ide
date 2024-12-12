const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const devMode = process.env.DEV_MODE ? process.env.DEV_MODE.trim().toLowerCase() === 'true' : false;

var ideBuild = 1;
var serverBuild = 1;
var testharnessBuild = 1;

function buildPrinter(buildName, buildNumber) {
    setTimeout(() => console.log(`\n=== ${new Date().toTimeString().split(' ')[0]} completed ${buildName} build ${buildNumber} ===\n`), 0)
}

const moduleRules = {
    rules: [
        {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /[/\\]node_modules[/\\]/,
            include: [
                /[/\\]src[/\\]/,
                /[/\\]server[/\\]/
            ],
        },
        {
            test: /\.css$/i,
            use: ["style-loader", "css-loader"],
        },
    ],
};

const repositoryResolvers = {
    extensions: ['.ts', '.js'],
    alias: {
        '@util': path.resolve(__dirname, 'src/util'),
        '@repository': path.resolve(__dirname, 'src/repository'),
        '@definition': path.resolve(__dirname, 'src/repository/definition'),
    },
}
const testharnessResolvers = {
    extensions: ['.ts', '.js'],
    alias: {
        '@util': path.resolve(__dirname, 'src/util'),
        '@repository': path.resolve(__dirname, 'src/repository'),
        '@server': path.resolve(__dirname, 'src/server'),
        '@testharness': path.resolve(__dirname, 'src/testharness'),
        '@definition': path.resolve(__dirname, 'src/repository/definition'),
    },
}


const ideResolvers = {
    extensions: ['.tsx', '.ts', '.js', '.html'],
    alias: {
        '@ide': path.resolve(__dirname, 'src/ide'),
        '@testharness': path.resolve(__dirname, 'src/testharness'),
        '@validate': path.resolve(__dirname, 'src/validate'),
        '@styles': path.resolve(__dirname, 'app/styles'),
        '_images_': path.resolve(__dirname, 'app/images'),
        'jquery': path.resolve(__dirname, 'node_modules/jquery/dist/jquery'),
        'jquery-ui': path.resolve(__dirname, 'node_modules/jquery-ui/dist/jquery-ui'),
    },
};
// Merge repository resolvers into the ideResolvers
Object.keys(repositoryResolvers.alias).forEach(key => ideResolvers.alias[key] = repositoryResolvers.alias[key]);

module.exports = [
{ // server
    entry: {
        server: './server/utilities.ts'
    },
    output: {
        filename: 'utilities.js',
        path: path.resolve(__dirname, 'dist/server'),
    },
    plugins: [
        new function () {
            this.apply = (compiler) => {
                compiler.hooks.done.tap("server", () => buildPrinter("server", serverBuild++));
            };
        },
        new CopyWebpackPlugin({
            patterns: [
                { from: 'config', to: '../config' },
                { from: 'server/server.js', to: '../server' },
            ]
        })
    ],
    target: 'node',
    module: moduleRules,
    externals: {
        fs: 'require("fs")'
    },
    resolve: repositoryResolvers,
    devtool: 'source-map',
    mode: 'development',
    stats: {
        errorDetails: true
    },
    watch: devMode,
},
{ // repository
    entry: {
        repository: './src/repository/index.ts',
    },
    output: {
        filename: 'repository_bundle.js',
        path: path.resolve(__dirname, 'dist/repository'),
    },
    module: moduleRules,
    resolve: repositoryResolvers,
    devtool: 'source-map',
    mode: 'development',
    stats: {
        errorDetails: true
    },
    watch: devMode,
},
{ // ide
    entry: {
        ide: './src/ide/index.ts',
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist/app'),
    },
    plugins: [
        new function () {
            this.apply = (compiler) => {
                compiler.hooks.done.tap("ide", () => buildPrinter("ide", ideBuild++));
            };
        },
        new CopyWebpackPlugin({
            patterns: [
                { from: 'app' },
            ]
        })
    ],
    module: moduleRules,
    resolve: ideResolvers,
    devtool: 'source-map',
    mode: 'development',
    stats: {
        errorDetails: true
    },
    watch: devMode,
},
{ // testharness
    entry: {
        testharness: './src/testharness/index.ts',
    },
    output: {
        filename: 'bundle-testharness.js',
        path: path.resolve(__dirname, 'dist/testharness'),
        library: {
            type: 'commonjs2',
        },
        globalObject: 'this',
    },
    target: 'node',
    plugins: [
        new function () {
            this.apply = (compiler) => {
                compiler.hooks.done.tap("testharness", () => buildPrinter("testharness", testharnessBuild++));
            };
        },
        new CopyWebpackPlugin({
            patterns: [
                { from: 'config', to: '../config' },
                { from: 'src/testharness/runner.js', to: '../testharness' },
            ]
        })
    ],
    module: moduleRules,
    resolve: testharnessResolvers,
    devtool: 'source-map',
    mode: 'development',
    stats: {
        errorDetails: true
    },
    watch: devMode,
}];

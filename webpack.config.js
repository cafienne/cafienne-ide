const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { BannerPlugin } = require('webpack');
const nodeExternals = require('webpack-node-externals');
const devMode = process.env.DEV_MODE ? process.env.DEV_MODE.trim().toLowerCase() === 'true' : false;

var ideBuild = 1;
var serverBuild = 1;
var deployBuild = 1;

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

const deployResolvers = {
    extensions: ['.ts', '.js'],
    alias: {
        '@util': path.resolve(__dirname, 'src/util'),
        '@repository': path.resolve(__dirname, 'src/repository'),
    },
}

const ideResolvers = {
    extensions: ['.tsx', '.ts', '.js', '.html'],
    alias: {
        '@ide': path.resolve(__dirname, 'src/ide'),
        '@validate': path.resolve(__dirname, 'src/validate'),
        '@styles': path.resolve(__dirname, 'app/styles'),
        '_images_': path.resolve(__dirname, 'app/images'),
        'jquery': path.resolve(__dirname, 'node_modules/jquery/dist/jquery'),
        'jquery-ui': path.resolve(__dirname, 'node_modules/jquery-ui/dist/jquery-ui'),
    },
};
// Merge repository resolvers into the ideResolvers
Object.keys(repositoryResolvers.alias).forEach(key => ideResolvers.alias[key] = repositoryResolvers.alias[key]);

module.exports = [{
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
{
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
    { // deploy cli
        entry: {
            deploy: { import: './src/deploy/deploy.ts', dependOn: ['index'] },
            index: './src/index.js'
        },
        output: {
            filename: '[name].mjs',
            path: path.resolve(__dirname, 'dist/deploy'),
            library: {
                type: 'module',
            },
            globalObject: 'this',
        },
        target: 'async-node',
        plugins: [
            new function () {
                this.apply = (compiler) => {
                    compiler.hooks.done.tap("deploy", () => buildPrinter("deploy", deployBuild++));
                };
            },
            new CopyWebpackPlugin({
                patterns: [
                    { from: 'config', to: './config' },
                ]
            }),
            new BannerPlugin({
                banner: '#!/usr/bin/env node',
                raw: true,
            }),
        ],
        module: moduleRules,
        resolve: deployResolvers,
        devtool: 'source-map',
        mode: 'development',
        stats: {
            errorDetails: true
        },
        watch: devMode,
        experiments: {
            outputModule: true,
        },
        externals: [
            nodeExternals({ importType: (request) => `import ${request}` }),
        ],
    },
{
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
}];

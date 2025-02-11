import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlBundlerPlugin from 'html-bundler-webpack-plugin';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from 'webpack';
import nodeExternals from 'webpack-node-externals';

const { BannerPlugin } = pkg;
const devMode = process.env.DEV_MODE ? process.env.DEV_MODE.trim().toLowerCase() === 'true' : false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class BuildPrinter {
    constructor(name) {
        this.buildName = name;
        this.buildNumber = 1;
    }
}

/**
 * 
 * @param {BuildPrinter} hook 
 */
function addBuildHook(hook) {
    return new function () {
        console.log(`Adding build hook '${hook.buildName}'`)
        this.apply = (compiler) => compiler.hooks.done.tap(hook.buildName, () => setTimeout(() => console.log(`\n=== ${new Date().toTimeString().split(' ')[0]} completed ${hook.buildName} build ${hook.buildNumber++} ===\n`), 0));
    }
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
        {
            test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
            type: 'asset/inline',
        },
        {
            resourceQuery: /raw/,
            type: 'asset/source',
        },
        {
            test: /\.(woff|woff2|eot|ttf|otf)$/i,
            type: 'asset/inline',
        },
    ],
};

const scriptExtensions = {
    extensions: ['.ts', '.js'],
}

const ideResolvers = {
    extensions: ['.tsx', '.ts', '.js', '.html'],
    alias: {
        '@styles': path.resolve(__dirname, 'app/styles'),
        '_images_': path.resolve(__dirname, 'app/images'),
        'jquery': path.resolve(__dirname, 'node_modules/jquery/dist/jquery'),
        'jquery-ui': path.resolve(__dirname, 'node_modules/jquery-ui/dist/jquery-ui'),
    },
};

export default [
{ // server
    entry: {
            server: './src/server/startserver.ts'
    },
    output: {
        filename: 'server.js',
        path: path.resolve(__dirname, 'dist/server'),
    },
    plugins: [
        addBuildHook(new BuildPrinter('server'))
    ],
    target: 'node',
    module: moduleRules,
    resolve: scriptExtensions,
    devtool: 'source-map',
    mode: 'development',
    stats: {
        errorDetails: true
    },
    watch: devMode,
},
{ // repository cli
    entry: {
        compile: { import: './src/repository/compile.ts', dependOn: ['shared'] },
        testrunner: { import: './src/testharness/runnermain.ts', dependOn: ['shared'] },
        shared: './src/index.js',
        index: { import: './src/index.js', dependOn: ['shared'] },
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist/repository'),
        library: {
            type: 'module',
        },
        globalObject: 'this',
    },
    target: 'async-node',
    plugins: [
        addBuildHook(new BuildPrinter('repository')),
        new BannerPlugin({
            banner: '#!/usr/bin/env node',
            raw: true,
        }),
    ],
    module: moduleRules,
    resolve: scriptExtensions,
    devtool: 'source-map',
    mode: 'development',
    stats: {
        errorDetails: true
    },
    watch: devMode,
    experiments: {
        outputModule: true,
    },
    externalsType: "module-import",
    externals: [
        {
            'node-fetch': 'node-commonjs node-fetch', // https://github.com/matthew-andrews/isomorphic-fetch/issues/194#issuecomment-1513787724
            '@casefabric/typescript-client': 'import @casefabric/typescript-client',
        },
        nodeExternals({ importType: (request) => `import ${request}` }),
    ],
},
{ // ide
    entry: {
    },
    output: {
        path: path.resolve(__dirname, 'dist/app'),
    },
    plugins: [
        addBuildHook(new BuildPrinter('ide')),
        new HtmlBundlerPlugin({
            entry: {
                index: './src/ide/index.html',
            },    
            css: {
                test: /.*\.xxxxxx$/, // do not process css files
                filename: 'css/[name].[contenthash:8].css',
              },
            js: {
                test: /\.(ts|js)$/,
                filename: 'bundle.js',
            },
        }),
        new CopyWebpackPlugin({
            patterns: [
                { 
                    from: 'app/*', to: "../"
                },
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

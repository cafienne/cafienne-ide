const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const devMode = process.env.DEV_MODE ? process.env.DEV_MODE.trim().toLowerCase() === 'true' : false;
var buildNumber = 1;

module.exports = {
    entry: {
        client: './src/client/index.ts',
        server: './src/server/index.ts'
    },
    output: {
        filename: '[name]_bundle.js',
        path: path.resolve(__dirname, 'dist/app'),
    },
    plugins: [
        new function () {
            this.apply = (compiler) => {
                compiler.hooks.done.tap("PRINT TIME AFTER BUILD", () => setTimeout(() => console.log(`=== ${new Date().toTimeString().split(' ')[0]} completed build ${buildNumber++} ===\n`), 0));
            };
        },
        new CopyWebpackPlugin({
            patterns: [
                { from: 'config', to: '../config' },
                { from: 'src/server/server.js', to: '../server' },
                { from: 'src/server/repository-router.js', to: '../server' },
                { from: 'src/server/favicon.ico', to: '../server' },
                { from: 'app' },
            ]
        })
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /[/\\]node_modules[/\\]/,
                include: [
                    /[/\\]src[/\\]/
                ],
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.html'],
        alias: {
            '@util': path.resolve(__dirname, 'src/client/util'),
            '@repository': path.resolve(__dirname, 'src/client/repository'),
            '@definition': path.resolve(__dirname, 'src/client/repository/definition'),
            '@ide': path.resolve(__dirname, 'src/client/ide'),
            '@styles': path.resolve(__dirname, 'app/styles'),
            '_images_': path.resolve(__dirname, 'app/images'),
            'jquery': path.resolve(__dirname, 'node_modules/jquery/dist/jquery'),
            'jquery-ui': path.resolve(__dirname, 'node_modules/jquery-ui/dist/jquery-ui'),
        },
        fallback: {
            "fs": false
        },
    },
    devtool: 'source-map',
    mode: 'development',
    stats: {
        errorDetails: true
    },
    devServer: {
        static: './dist',
        port: 7281,
    },
    watch: devMode,
};

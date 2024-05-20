const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const devMode = process.env.DEV_MODE ? process.env.DEV_MODE.trim().toLowerCase() === 'true' : false;
var buildNumber = 1;

module.exports = {
    entry: './src/index.ts',
    output: {
        filename: 'bundle.js',
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
                { from: 'server', to: '../server' },
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
            '@util': path.resolve(__dirname, 'src/util'),
            '@repository': path.resolve(__dirname, 'src/repository'),
            '@definition': path.resolve(__dirname, 'src/repository/definition'),
            '@ide': path.resolve(__dirname, 'src/ide'),
            '@styles': path.resolve(__dirname, 'app/styles'),
            '_images_': path.resolve(__dirname, 'app/images'),
            'jquery': path.resolve(__dirname, 'node_modules/jquery/dist/jquery'),
            'jquery-ui': path.resolve(__dirname, 'node_modules/jquery-ui/dist/jquery-ui'),
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

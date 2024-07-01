const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const devMode = process.env.DEV_MODE ? process.env.DEV_MODE.trim().toLowerCase() === 'true' : false;

module.exports = {
    entry: './src/index.ts',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist/app'),
    },
    plugins: [
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
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.html'],
        alias: {
            '@util': path.resolve(__dirname, 'src/util'),
            '@repository': path.resolve(__dirname, 'src/repository'),
            '@definition': path.resolve(__dirname, 'src/repository/definition'),
            '@ide': path.resolve(__dirname, 'src/ide'),
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

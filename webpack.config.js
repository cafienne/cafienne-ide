const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
};

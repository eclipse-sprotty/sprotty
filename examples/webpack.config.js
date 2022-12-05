//@ts-check

var webpack = require('webpack');
var path = require('path');

/** @type {import('webpack').Configuration} */
const config = {
    target: 'web',
    mode: 'development',
    devtool: 'source-map',

    entry: [
        'core-js/es/map',
        'core-js/es/promise',
        'core-js/es/string',
        'core-js/es/symbol',
        './browser-app.ts'
    ],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'resources')
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: ['ts-loader']
            },
            {
                test: /\.js$/,
                use: ['source-map-loader'],
                enforce: 'pre'
            },
            {
                test: /\.css$/,
                exclude: /\.useable\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },

    plugins: [
        new webpack.ProgressPlugin()
    ],
    ignoreWarnings: [/Failed to parse source map/],

};

module.exports = config;

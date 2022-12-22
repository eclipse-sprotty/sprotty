//@ts-check

const webpack = require('webpack');
const path = require('path');
const CircularDependencyPlugin = require('circular-dependency-plugin');

/** @type {import('webpack').Configuration} */
const config = {
    target: 'web',
    mode: 'development',
    devtool: 'source-map',

    entry: './browser-app.ts',
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
        new CircularDependencyPlugin({
            exclude: /node_modules\/inversify/,
            failOnError: true
        })
    ],
    ignoreWarnings: [/Failed to parse source map/],

};

module.exports = config;

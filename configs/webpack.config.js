var webpack = require('webpack');
var path = require('path');
var CircularDependencyPlugin = require('circular-dependency-plugin');

module.exports = {
    mode: 'development',
    devtool: 'source-map',

    entry: [
        'core-js/es/map', 
        'core-js/es/promise', 
        'core-js/es/string', 
        'core-js/es/symbol', 
        './examples/app.ts'
    ],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, '../examples')
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        configFile: path.resolve(__dirname, 'examples.tsconfig.json')
                    }
                }]
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
    node : { fs: 'empty', net: 'empty' },

    plugins: [
        new CircularDependencyPlugin({
            exclude: /(node_modules|examples)\/./,
            failOnError: false
        }),
        new webpack.WatchIgnorePlugin([
            /\.js$/,
            /\.d\.ts$/
        ]),
        new webpack.ProgressPlugin()
    ]
};

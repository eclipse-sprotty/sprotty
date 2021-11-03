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
        './app.ts'
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
            },
            {
                test: /\.(ttf)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    outputPath: '',
                    publicPath: '..',
                    postTransformPublicPath: (p) => `__webpack_public_path__ + ${p}`,
                }
            }
        ]
    },

    plugins: [
        new webpack.ProgressPlugin()
    ]
};

module.exports = config;

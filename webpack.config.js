const path = require('path');
const ROOT_PATH = path.resolve(__dirname);
const STYLE_PATHS = [
    path.resolve(ROOT_PATH, 'node_modules/codemirror/lib/'),
    path.resolve(ROOT_PATH, 'node_modules/codemirror/theme/'),
];

const FlowWebpackPlugin = require('flow-webpack-plugin')

const flow =


module.exports = {
    entry: './src/index.js',
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    {
                        loader: "style-loader"
                    }, {
                        loader: "css-loader"
                    }]
            },
            {
                test: /\._$/,
                loader: 'file-to-string-loader'
            }
        ]
    },
    plugins: [
        new FlowWebpackPlugin({
            failOnError: false,
            failOnErrorWatch: false,
            reportingSeverity: 'error',
            printFlowOutput: true,
            flowPath: require.main.require('flow-bin'),
            flowArgs: ['--color=always'],
            verbose: false,
            callback: (result) => {}
        })
    ],
    output: {
        filename: './laufvogel.js',
        // export to AMD, CommonJS, or window
        libraryTarget: 'umd',
        // the name exported to window
        library: 'laufvogel'
    }
};
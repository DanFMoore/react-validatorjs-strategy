var webpack = require("webpack");
var isDev = process.argv.indexOf('--dev') > -1;

module.exports = {
    entry: "./src/strategy.js",
    output: {
        path: "./dist",
        filename: isDev ? "strategy.js" : "strategy.min.js"
    },
    // These libraries are included in separate script tags and are available as global variables
    externals: {
        "validatorjs": "Validator"
    },
    plugins: isDev ?
        [] :
        [new webpack.optimize.UglifyJsPlugin({minimize: true})],
    devtool: isDev ? 'source-map' : null,
    module: {
        loaders: [
            {
                exclude: /(node_modules|bower_components)/,
                loader: 'babel', // 'babel-loader' is also a legal name to reference
                query: {
                    presets: ['es2015']
                }
            }
        ]
    }
};

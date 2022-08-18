module.exports = {
    publicPath: "./",
    productionSourceMap: false,
    configureWebpack: {
        externals: process.env.NODE_ENV === "development" ? [] : [
            "vue",
            "core-js"
        ]
    }
};

const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const path = require("path");

module.exports = {
  entry: {
    app: path.resolve(__dirname, "src", "index.tsx"),
  },
  plugins: [
    new webpack.EnvironmentPlugin(['CONVEX_DEPLOYMENT', 'CONVEX_URL']),
    new HtmlWebpackPlugin({
      title: "TodoMVC: React",
      template: path.resolve(__dirname, "public", "index.html"),
    }),
  ],
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
    ],
  },
};

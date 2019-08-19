var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');

module.exports = {
  entry: './src/index.js',
  resolve: {
    extensions: ["*", ".js", ".jsx"],
    // enforceExtension: true,
    alias: {
      'react-dom': '@hot-loader/react-dom',
      '~': path.join(__dirname, 'src'),
    },
    modules: [
      'node_modules',
    ],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            // presets: [no jsx for non jsx files]
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          { loader: "style-loader" },
          {
            loader: "css-loader",
            options: {
              modules: true,
              localIdentName: '[local]-[contenthash:base64:8]',
            },
          },
        ]
      }
    ]
  },
  devServer: {
    // contentBase: path.join(__dirname, "public/"),
    port: 3000,
    // publicPath: "http://localhost:3000/dist/",
    hot: true,
    // hotOnly: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      favicon: './favicon.jpg',
      title: 'david seaman',
    }),
  ]
};
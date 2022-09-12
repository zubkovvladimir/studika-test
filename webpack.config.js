const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

function _path(p) {
  return path.join(__dirname, p);
}

module.exports = {
  mode: 'development',
  context: path.resolve(__dirname, 'source'),
  entry: './js/index.js',
  output: {
    filename: 'bundle.js',
    path: _path('build/js'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
  devtool: isDev ? 'source-map' : '',
};

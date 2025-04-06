const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background.js',
    popup: './src/popup.js',
    'popup-direct': './src/popup-direct.js',
    content: './src/content.js'
  },
  output: {
    path: path.resolve(__dirname, 'BitcoinDonationExtension Extension/Resources'),
    filename: '[name].js'
  },
  experiments: {
    syncWebAssembly: true // Enable WebAssembly
  },
  resolve: {
    fallback: {
      "crypto": false,
      "buffer": require.resolve("buffer/"),
      "stream": require.resolve("stream-browserify")
    }
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: './src/popup.html', to: 'popup.html' },
        { from: './src/popup.css', to: 'popup.css' },
        { from: './src/manifest.json', to: 'manifest.json' },
        { from: './src/images', to: 'images' },
        { from: './src/lib', to: 'lib' }
      ],
    }),
  ]
}; 
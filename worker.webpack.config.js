const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const wasmPath = [
  __dirname,
  'node_modules',
  '@emscripten-forge/mambajs',
  'node_modules',
  '@emscripten-forge/untarjs',
  'lib',
  'unpack.wasm'
];
const staticPath = [
  __dirname,
  'jupyterlite_xeus',
  'labextension',
  'static',
  '[name].wasm'
];

const rules = [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    loader: 'source-map-loader'
  },
   {
    test: /\.wasm$/,
    type: 'asset/resource',
  },
];

const resolve = {
  fallback: {
    fs: false,
    child_process: false,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer/'),
    process: require.resolve('process/browser'),
    assert: require.resolve('assert/'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify/browser'),
    url: require.resolve('url/'),
  },
  extensions: ['.js']
};

module.exports = [
  {
    entry: {
      ['coincident.worker']: './lib/coincident.worker.js',
      ['comlink.worker']: './lib/comlink.worker.js'
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'lib'),
      libraryTarget: 'module'
    },
    experiments: {
      asyncWebAssembly: true,
      outputModule: true,
    },
    module: {
      rules
    },
    devtool: 'source-map',
    resolve,
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: path.join(...wasmPath),
            to: path.join(...staticPath)
          }
        ]
      })
    ]
  }
];
const cracoWasm = require("craco-wasm");
const webpack = require("webpack");
const path = require("path");

module.exports = {
  plugins: [
    cracoWasm(),
  ],
  eslint: {
    enable: false
  },
  babel: {
    plugins: [
      [
        'formatjs',
        {
          removeDefaultMessage: false,
          idInterpolationPattern: '[sha512:contenthash:base64:6]',
          ast: true
        }
      ]
    ]
  },
  webpack: {
    configure: {
      resolve: {
        fallback: {
          buffer: require.resolve("buffer"),
        },
        alias: {
          '@ffmpeg/ffmpeg': path.resolve(__dirname, 'src/stub.js')
        },
      },
      plugins: [
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
        }),
      ],
      ignoreWarnings: [/Failed to parse source map/],
      cache: false,
    },
  },
}
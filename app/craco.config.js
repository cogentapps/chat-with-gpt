const cracoWasm = require("craco-wasm");

/*
{
  "plugins": [
    [
      "formatjs",
      {
        "idInterpolationPattern": "[sha512:contenthash:base64:6]",
        "ast": true
      }
    ]
  ]
}
*/

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
    }
}
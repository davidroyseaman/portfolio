module.exports = {
  'env': {
    'browser': true,
    'es6': true
  },
  'extends': ['eslint:recommended',  'plugin:react/recommended'],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly'
  },
  'parserOptions': {
    'ecmaVersion': 2018,
    'sourceType': 'module'
  },
  'settings': {
    'react': {
      'version': 'detect',
    },
  },
  'rules': {
    'no-trailing-spaces': ['error', {}],
    'react/prop-types': 0,
    'indent': [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ]
  }
};
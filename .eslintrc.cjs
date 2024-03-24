module.exports = {
    'env': {
        'node': true,
    },
    'parserOptions': {
        'sourceType': 'module',
        'ecmaVersion': 2020,
    },
    'root': true,
    'plugins': ['promise'],
    'extends': [
        'eslint:recommended',
    ],
    'rules': {
        'semi': ['error', 'never'],
        'quotes': ['error', 'single'],
        'comma-dangle': ['error', 'always-multiline'],
        'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],


        'promise/always-return': 'error',
        'promise/no-return-wrap': 'error',
        'promise/param-names': 'error',
        'promise/catch-or-return': 'error', // 似乎无效，运行 npx eslint .\src\sql\survey.js 并没有提示错误
        'promise/no-native': 'off',
        'promise/no-nesting': 'warn',
        'promise/no-promise-in-callback': 'warn',
        'promise/no-callback-in-promise': 'warn',
        'promise/avoid-new': 'warn',
        'promise/no-new-statics': 'error',
        'promise/no-return-in-finally': 'warn',
        'promise/valid-params': 'warn',
    },
}

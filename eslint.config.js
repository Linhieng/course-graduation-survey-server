// @ts-check
import js from '@eslint/js'
import globals from 'globals'

export default [
    js.configs.recommended,
    {
        files: [
            'src/**/*.js',
            '*.js',
        ],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'semi': ['error', 'never'],
            'quotes': ['error', 'single'],
            'comma-dangle': ['error', 'always-multiline'],
            'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
        },
    },
]

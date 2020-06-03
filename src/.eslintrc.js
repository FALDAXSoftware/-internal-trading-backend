module.exports = {
    extends: 'eslint-config-airbnb',
    // plugins: ["jest"],
    rules: {
        'function-paren-newline': 0,
        'no-param-reassign': 0,
    },
    env: {
        mocha: true,
        // jest: true,
    },
};
module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["eslint:recommended"],
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error",
  },
  env: {
    node: true,
    es2020: true,
  },
};

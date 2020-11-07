module.exports = {
  root: true,
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        project: ['tsconfig.*?.json', 'e2e/tsconfig.json'],
        createDefaultProgram: true,
      },
      extends: [
        'plugin:@angular-eslint/recommended',
        // AirBnB Styleguide rules
        'airbnb-typescript/base',
        // Settings for Prettier
        'prettier/@typescript-eslint',
        'plugin:prettier/recommended',
      ],
      rules: {
        //
      },
    },
    {
      files: ['*.component.html'],
      extends: ['plugin:@angular-eslint/template/recommended'],
      rules: {
        'max-len': ['error', { code: 140 }],
      },
    },
    {
      files: ['*.component.ts'],
      extends: ['plugin:@angular-eslint/template/process-inline-templates'],
    },
    {
      files: ['src/**/*.spec.ts', 'src/**/*.d.ts'],
      parserOptions: {
        project: './tsconfig.spec.json',
      },
      // Jasmine rules
      extends: ['plugin:jasmine/recommended'],
      // Plugin to run Jasmine rules
      plugins: ['jasmine'],
      env: { jasmine: true },
      // Turn off 'no-unused-vars' rule
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
};

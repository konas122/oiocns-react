module.exports = {
  root: true, // 指定这是项目的根配置文件，ESLint将不会向上寻找其他配置文件
  parser: '@typescript-eslint/parser', // 使用 @typescript-eslint/parser 解析器以支持 TypeScript
  parserOptions: {
    ecmaVersion: 2020, // 指定要使用的 ECMAScript 版本
    sourceType: 'module', // 启用 ECMAScript 模块
    ecmaFeatures: {
      jsx: true, // 支持 JSX 语法
    },
  },
  settings: {
    react: {
      version: 'detect', // 自动检测 React 版本
    },
  },
  env: {
    browser: true, // 支持浏览器环境的全局变量
    amd: true, // 支持 AMD 环境
    node: true, // 支持 Node.js 全局变量和作用域
  },
  extends: [
    'eslint:recommended', // 启用 ESLint 推荐的规则
    'plugin:react/recommended', // 启用 React 推荐的规则
    'plugin:prettier/recommended', // 启用 Prettier 推荐的规则，确保这是数组中的最后一个元素，以便与其他规则结合使用
  ],
  plugins: ['simple-import-sort', 'prettier', '@typescript-eslint'], // 使用的 ESLint 插件
  rules: {
    'no-debugger': 1, // 禁用 debugger 语句
    'prettier/prettier': ['error', {}, { usePrettierrc: true }], // 启用 Prettier 规则，并使用 .prettierrc 配置
    'react/react-in-jsx-scope': 'off', // React 17+不再需要在 JSX 中导入 React
    '@typescript-eslint/consistent-type-assertions': 'off', // 关闭一致性类型断言规则
    '@typescript-eslint/explicit-function-return-type': 'off', // 关闭显式函数返回类型规则
    'no-use-before-define': 'off', // 关闭在使用前定义规则
    'simple-import-sort/exports': 'error', // 强制导出顺序排序
    'no-useless-constructor': 'off', // 关闭无用构造函数规则，改用 TypeScript 规则
    '@typescript-eslint/no-useless-constructor': 'error', // 强制无用构造函数的 TypeScript 规则
    'no-constant-condition': 'error', // 禁止在条件中使用常量表达式
    'no-dupe-args': 'error', // 禁止 function 定义中出现重名参数
    'no-dupe-keys': 'error', // 禁止对象字面量中出现重复的 key
    'no-unused-vars': 'off', // 禁用基本的 no-unused-vars 规则，改用 TypeScript 规则
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_', // 忽略以 '_' 开头的参数
        varsIgnorePattern: '^_', // 忽略以 '_' 开头的变量
      },
    ],
    'no-empty-function': 'off', // 关闭空函数规则
    'no-undef': 'off', // 关闭 no-undef 规则，以支持 TypeScript 类型定义
    'import/prefer-default-export': 'off', // 关闭首选默认导出的规则
    'no-import-assign': 'error', // 禁止重新分配导入的绑定
    'no-dupe-class-members': 'off', // 关闭重复类成员规则，改用 TypeScript 规则
    'no-redeclare': 'off', // 关闭变量重复声明规则，改用 TypeScript 规则
    '@typescript-eslint/no-dupe-class-members': 'error', // 强制重复类成员的 TypeScript 规则
    '@typescript-eslint/no-redeclare': 'error', // 强制变量重复声明的 TypeScript 规则
  },
};

import * as Babel from '@babel/standalone';
import { ScriptContextPlugin } from './ScriptContextPlugin';
import { getBaseBabelOptions } from './util';

export function compileScript(code: string) {
  try {
    const result = Babel.transform(code, {
      ...getBaseBabelOptions(),
      filename: 'script1.ts',
      plugins: [
        [
          ScriptContextPlugin,
          {
            blacklist: [
              'window',
              'self',
              'top',
              'parent',
              'frames',
              'document',
              'navigator',
              'global',
              'globalThis',
              'process',
            ],
          },
        ],
      ],
    });
    if (result.code) {
      return result.code;
    }
    throw new Error('脚本不能为空');
  } catch (error: any) {
    throw new Error('脚本解析失败！\n' + error.message);
  }
}

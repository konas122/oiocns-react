import type { PluginObj } from '@babel/core';
import * as t from '@babel/types';

/* eslint-disable prettier/prettier */
/* prettier-ignore */

const CONTEXT_IDENTIFIER = '$$context$$';
export const VARIABLE_IDENTIFIER = '$$var$$';

export function ScriptContextPlugin(): PluginObj {
  return {
    name: 'ScriptContextPlugin',
    visitor: {
      Program(path, state: any) {
        const option = state?.opts ?? {};

        const body = path.node.body;
        if (body.length == 0) {
          throw new SyntaxError('脚本不能为空');
        }

        const blacklist: string[] = option.blacklist || [];

        path.node.body = [
          t.expressionStatement(  // (
            t.functionExpression(  // function(module, exports, context)
              null,
              [
                t.identifier('module'),
                t.identifier('exports'),
                t.identifier(CONTEXT_IDENTIFIER)
              ],
              t.blockStatement([ // {
                t.expressionStatement( // 'use strict';
                  t.stringLiteral('use strict')
                ),
                t.variableDeclaration(
                  'let',
                  blacklist.map(v => t.variableDeclarator(
                    t.identifier(v)
                  ))
                ),
                t.variableDeclaration( // const 
                  'const',
                  [
                    t.variableDeclarator( // { ... }
                      t.objectPattern(
                        [
                          t.objectProperty(
                            t.identifier(VARIABLE_IDENTIFIER),
                            t.identifier(VARIABLE_IDENTIFIER),
                            false,
                            true
                          )
                        ]
                      ),
                      t.identifier(CONTEXT_IDENTIFIER),
                    )
                  ]
                ), // ;
                ...body
              ]) // }
            ) // )
          ) //;
        ] as any[]
      },
    }
  }
}


import * as Babel from '@babel/standalone';
import type { PluginObj } from '@babel/core';
import { CellRefInfo } from '../core/graph/ref/RefParser';
import _ from 'lodash';

/* eslint-disable prettier/prettier */
/* prettier-ignore */

const cellRefRegex = /^[A-Z]{1,2}[0-9]+$/;

function CellRefParserPlugin(): PluginObj {
  return {
    name: 'CellRefParserPlugin',
    visitor: {
      Identifier(path, state: any) {
        const option: CellRefInfo = state?.opts ?? {
          cellRefs: [],
          otherSheetRefs: {}
        };

        if (cellRefRegex.test(path.node.name) && !path.findParent(p => p.isCallExpression())) {
          option.cellRefs.push(path.node.name);
        }
      },
      MemberExpression(path, state: any) {
        const option: CellRefInfo = state?.opts ?? {
          cellRefs: [],
          otherSheetRefs: {}
        };

        if (path.node.object.type !== 'Identifier') {
          return;
        }

        const objectName = path.node.object.name;

        let propertyName: string | undefined;
        if (path.node.property.type === 'Identifier') { // sheet1.A1
          propertyName = path.node.property.name;
        } else if (path.node.property.type === 'StringLiteral') { // sheet1['A1']
          propertyName = path.node.property.value;
        }

        if (!propertyName) {
          return;
        }

        if (cellRefRegex.test(propertyName) && !path.findParent(p => p.isCallExpression())) {
          if (!option.otherSheetRefs[objectName]) {
            option.otherSheetRefs[objectName] = [];
          }
          option.otherSheetRefs[objectName].push(propertyName);
          path.skip();
        }
      }
    }
  }
}


export function parseCellRefs(expression: string): CellRefInfo {
    
  const ret: CellRefInfo = {
    cellRefs: [],
    otherSheetRefs: {}
  };

  Babel.transform(`const __value__ = (${expression})`, {
    filename: 'function1.ts',
    parserOpts: {
      plugins: ['typescript'],
    },
    plugins: [
      [
        CellRefParserPlugin,
        ret,
      ]
    ]
  });

  return {
    cellRefs: _.uniq(ret.cellRefs),
    otherSheetRefs: Object.fromEntries(
      Object.entries(ret.otherSheetRefs).map(([key, value]) => [key, _.uniq(value)])
    )
  };
}

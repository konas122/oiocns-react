import { MappingData } from '@/ts/base/model';
import { generateCode } from '@/utils/script';
import * as t from '@babel/types';

/* eslint-disable prettier/prettier */
/* prettier-ignore */

export function createTsDefinition(value: MappingData[]) {
  return generateCode(
    t.program(
      value.map(m => 
        t.addComment(
          {
            type: "VariableDeclaration",
            kind: 'const',
            declare: true,
            declarations: [
              t.variableDeclarator(
                {
                  type: 'Identifier',
                  name: m.code,
                  typeAnnotation: t.tsTypeAnnotation(
                    m.typeName == '对象' ? t.tsAnyKeyword() : t.tsArrayType(t.tsAnyKeyword())
                  ),
                }
              )
            ]
          } as t.VariableDeclaration,
          'leading',
          `* [${m.formName}] ${m.name} `
        )
      )
    )
  );
}

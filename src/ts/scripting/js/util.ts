import * as Babel from '@babel/standalone';
import type { TransformOptions } from '@babel/core';
import generate from '@babel/generator';
import { parse, parseExpression, ParserOptions } from '@babel/parser';
import * as t from '@babel/types';
import { ValidateErrorInfo } from '@/ts/base/model';

/* eslint-disable prettier/prettier */
/* prettier-ignore */

export function getParserOptions(): ParserOptions {
  return {
    plugins: [
      'typescript',
      'jsx',
    ]
  };
}

export function getBaseBabelOptions(): TransformOptions {
  return {
    parserOpts: getParserOptions(),
    presets: [
      [
        Babel.availablePresets['env'],
        {
          useBuiltIns: false,
          targets: {
            node: '16',
            chrome: '80',
          },
        },
      ],
      [Babel.availablePresets['typescript'], {}],
    ],
    ast: true,
  };
}

/**
 * 校验并转换js/ts代码
 * @param code 代码
 */
export function transform(code: string) {
  try {
    const options = getBaseBabelOptions();
    Object.assign(options.parserOpts!, {
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true
    });
    const result = Babel.transform(code, {
      ...options,
      filename: '表达式',
    });
    return {
      code: result.code!,
      ast: result.ast!,
    };
  } catch (error: any) {
    throw new SyntaxError('语法错误：' + error.message, { cause: error });
  }
}

/**
 * 校验表达式
 * @param expression 表达式
 */
export function verifyExpression(expression: string) {
  try {
    const es = parseExpression(expression, getParserOptions());
    if (es.errors.length > 0) {
      throw new SyntaxError('语句不是表达式');
    }
    return es;
  } catch (error: any) {
    throw new SyntaxError('语法错误：' + error.message, { cause: error });
  }
}

/**
 * 校验并转换js/ts表达式
 * @param expression 表达式
 */
export function transformExpression(expression: string) {
  const result = transform(expression);
  const body = result.ast.program.body;

  if (body.length == 0) {
    throw new SyntaxError('内容为空');
  }
  if (body.length > 1) {
    throw new SyntaxError('只允许包含一条语句');
  }
  const es = body[0];
  if (es.type != 'ExpressionStatement') {
    throw new SyntaxError('语句不是表达式');
  }
  return es;
}

/**
 * 判断一个字符串能否作为合法的变量名
 * @param name 要判断的字符串
 * @returns 是否合法
 */
export function isValidVariableName(name: string) {
  try {
    const expression = `let ${name};`;
    transform(expression);
    return true;
  } catch (error) {
    return false;
  }
}

export function generateCode(type: t.Node) {
  const ret = generate(type, {
    jsescOption: {
      indent: '  ',
    },
  });
  return ret.code;
}

/**
 * 将代码包裹在立即执行函数表达式(IIFE)里面
 * @param code 代码
 */
export function wrapIIFE(code: string) {
  const ast = parse(code, getParserOptions());
  const stats = ast.program.body;

  return generateCode(
    t.expressionStatement(
      t.callExpression(t.arrowFunctionExpression([], t.blockStatement(stats)), []),
    ),
  );
}

/**
 * 将代码包裹在无参函数里面并导出
 * @param code 代码
 */
export function wrapExportedFunction(code: string, fnName: string, async = false) {
  let ast = parse(code, {
    ...getParserOptions(),
    allowAwaitOutsideFunction: true,
    allowReturnOutsideFunction: true,
  });
  const stats = ast.program.body;

  return generateCode(
    t.program([
      t.functionDeclaration(
        t.identifier(fnName),
        [],
        t.blockStatement(stats),
        false,
        async,
      ),
      t.expressionStatement(
        t.assignmentExpression(
          '=',
          parseExpression('exports.default') as t.MemberExpression,
          t.identifier(fnName),
        ),
      ),
    ]),
  );
}
export function mapErrorToValidateInfo(error: any, position?: string): ValidateErrorInfo {
  let msg = String(error);
  if (error instanceof Error) {
    msg = error.message;
    let match: RegExpExecArray | null;
    if ((match = /^(.+) is not defined/.exec(msg))) {
      msg = `变量或函数 '${match[1]}' 没有定义`;
    } else if ((match = /Unexpected token.+/.exec(msg))) {
      msg = '语法错误：' + msg;
    } else if ((match = /Cannot read properties of undefined \(reading '(.+)'\)/.exec(msg))) {
      msg = `尝试对空值读取属性 '${match[1]}'`;
    }
  }

  return {
    errorCode: 'ERR_FAILED',
    errorLevel: 'error',
    message: `错误：${msg} \n请检查配置`,
    position,
  };
}

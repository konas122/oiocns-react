import { IScriptHost } from '../core/types/script';
import { VARIABLE_IDENTIFIER } from './ScriptContextPlugin';
import { compileScript } from './compiler';
import { wrapExportedFunction } from './util';

export abstract class ScriptHost<T> implements IScriptHost<T> {
  readonly code: string;
  readonly exprTemplate: string;

  constructor(code: string) {
    this.code = code;
    this.exprTemplate = compileScript(code);
  }

  private transform(variableNames: string[] = []) {
    return this.exprTemplate.replaceAll(VARIABLE_IDENTIFIER, variableNames.join(', '));
  }

  abstract eval(context?: Dictionary<any>): T;
  protected evalCore<R extends {}>(ctx: Dictionary<any> = {}): R {
    const compiled = this.transform(Object.keys(ctx));

    try {
      const wrapper: Function = eval(compiled);

      const _module = {
        exports: {} as any,
      };
      const _exports = _module.exports;

      wrapper.call(undefined, _module, _exports, ctx);
      return _module.exports;
    } catch (error) {
      console.error('脚本发生未处理的异常', error);
      throw error;
    }
  }
}

export class Expression<T> extends ScriptHost<T> {
  constructor(expression: string) {
    super('exports.default = ' + expression);
  }

  eval(context?: Dictionary<any>): T {
    const _exports = super.evalCore<{ default: T }>(context);
    return _exports.default;
  }
}

export class Func<T extends () => any> extends ScriptHost<T> {
  constructor(code: string, async = false) {
    super(wrapExportedFunction(code, `$$wrapper_fn$$`, async));
  }

  eval(context?: Dictionary<any>): T {
    const _exports = super.evalCore<{ default: T }>(context);
    return _exports.default;
  }
}

export class Script<T> extends ScriptHost<T> {
  constructor(script: string) {
    super(script);
  }

  eval(context?: Dictionary<any>): T {
    const _exports = super.evalCore(context);
    return _exports as T;
  }
}

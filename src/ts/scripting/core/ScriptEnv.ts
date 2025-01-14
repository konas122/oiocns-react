/* eslint-disable no-dupe-class-members */
import { Expression, Func, Script } from '../js/ScriptHost';
import defaultProvider, { FunctionProvider } from './FunctionProvider';

export default class ScriptEnv {
  readonly fns: FunctionProvider;

  constructor(functionProvider?: FunctionProvider) {
    this.fns = functionProvider ?? defaultProvider;
  }

  evalExpression<T>(expression: string, context: Dictionary<any> = {}): T {
    const fullContext = Object.assign(this.fns.resolve(), context);
    return new Expression<T>(expression).eval(fullContext);
  }

  evalScript<T>(code: string, context: Dictionary<any> = {}): T | Promise<T> {
    const fullContext = Object.assign(this.fns.resolve(), context);
    return new Script<T>(code).eval(fullContext);
  }

  createFunction<T>(code: string, context?: Dictionary<any>): () => T;
  createFunction<T>(
    code: string,
    context?: Dictionary<any>,
    async?: true,
  ): () => Promise<T>;
  createFunction(code: string, context: Dictionary<any> = {}, async = false): () => any {
    const fullContext = Object.assign(this.fns.resolve(), context);
    return new Func<() => any>(code, async).eval(fullContext);
  }
}

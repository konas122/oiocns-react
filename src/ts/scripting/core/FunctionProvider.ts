import { defs, functions } from './functions';

export class FunctionProvider {
  private readonly functions: Dictionary<AnyFunction> = {};
  private readonly defs: string[] = [];

  register<F extends AnyFunction>(name: string, fn: F, def?: string): this {
    this.functions[name] = fn;
    if (def) {
      this.defs.push(def);
    }
    return this;
  }
  registerBatch(fns: Dictionary<AnyFunction>, def?: string): this {
    for (const [name, fn] of Object.entries(fns)) {
      this.functions[name] = fn;
    }
    if (def) {
      this.defs.push(def);
    }
    return this;
  }

  resolve() {
    return { ...this.functions };
  }

  getTSDefinition() {
    return this.defs.join('\n\n');
  }
}

const defaultProvider = new FunctionProvider().registerBatch(functions, defs);

export default defaultProvider;

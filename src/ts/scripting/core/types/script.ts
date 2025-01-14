export interface IScriptHost<T> {
  code: string;
  eval(context?: Dictionary<any>): T;
}

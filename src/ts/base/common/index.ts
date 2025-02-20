import { max, min, sum } from 'lodash';
export { CharCode } from './charCode';
export { Emitter } from './emitter';
export { decrypt, encrypt } from './encryption';
export {
  blobToDataUrl,
  blobToNumberArray,
  encodeKey,
  formatDate,
  formatSize,
  getAsyncTime,
  sliceFile,
  StringPako,
} from './format';
export type { IDisposable } from './lifecycle';
export { sleep } from './lifecycle';
export { logger, LoggerLevel } from './logger';
export {
  cloneAndChange,
  createProxyObject,
  deepClone,
  deepFreeze,
  distinct,
  equals,
  filter,
  getAllMethodNames,
  getAllPropertyNames,
  getCaseInsensitive,
  mixin,
  safeStringify,
} from './objects';
export { validRule } from './rule/condition';
export { filterConvert } from './rule/filter';
export type { WithChildren } from './tree';
export { AggregateTree, Node, Tree } from './tree';
export {
  isBoolean,
  isDefined,
  isEmptyObject,
  isFunction,
  isIterable,
  isNumber,
  isObject,
  isString,
  isStringArray,
  isTypedArray,
  isUndefined,
  isUndefinedOrNull,
  isSnowflakeId,
} from './types';
export { Constants, toUint8, toUint32 } from './uint';
export { generateUuid, isUUID } from './uuid';
export function Sandbox(code: string) {
  code = 'with (sandbox) {' + code + '}';
  const fn = new Function('sandbox', code);
  const unscopables = {};
  return function (sandbox: any) {
    sandbox.sum = (array: number[]) => {
      return sum(array);
    };
    sandbox.average = (array: number[]) => {
      return sum(array) / array.length;
    };
    sandbox.max = (array: number[]) => {
      return max(array);
    };
    sandbox.min = (array: number[]) => {
      return min(array);
    };
    const sandboxProxy = new Proxy(sandbox, {
      get(target, key) {
        if (key === Symbol.unscopables) return unscopables;
        return target[key];
      },
    });
    return fn(sandboxProxy);
  };
}

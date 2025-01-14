import { AssertResult, predicate } from '../util/AssertResult';
import { round } from './primitive';

export function equal(a: any, b: any) {
  if (isNaN(a) && isNaN(b)) {
    return AssertResult.success(a, b);
  }
  // 空字符串和null视为相等
  if ((a == '' && b == null) || (b == '' && a == null)) {
    return AssertResult.success(a, b);
  }
  // 0和空字符串、null视为相等
  if ((a == 0 && (b == null || b == '')) || (b == 0 && (a == null || a == ''))) {
    return AssertResult.success(a, b);
  }
  return predicate(a == b, a, b);
}

export function strictEqual(a: any, b: any) {
  if (isNaN(a) && isNaN(b)) {
    return AssertResult.success(a, b);
  }
  return predicate(a === b, a, b);
}

export function numberEqual(a: number | string, b: number | string, decimalPlaces = 2) {
  a ||= 0;
  b ||= 0;
  if (typeof a === 'string') {
    a = parseFloat(a);
  }
  if (typeof b === 'string') {
    b = parseFloat(b);
  }
  return predicate(round(a, decimalPlaces) == round(b, decimalPlaces), a, b);
}


export function isEmpty(a: any) {
  return predicate(a == null || a == '', a, '（空）');
}


export function isNotEmpty(a: any) {
  return predicate(a == null || a == '', a, '（非空）');
}

export function numberGreater(a: number | string, b: number | string, decimalPlaces = 2) {
  a ||= 0;
  b ||= 0;
  if (typeof a === 'string') {
    a = parseFloat(a);
  }
  if (typeof b === 'string') {
    b = parseFloat(b);
  }
  return predicate(round(a, decimalPlaces) > round(b, decimalPlaces), a, b);
}

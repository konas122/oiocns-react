import _ from 'lodash';

export function min(array: number[]) {
  return _.min(array.filter((n) => typeof n === 'number'));
}
export function max(array: number[]) {
  return _.max(array.filter((n) => typeof n === 'number'));
}
export function sum(array: number[]) {
  return _.sum(array.filter((n) => typeof n === 'number'));
}
export function average(array: number[]) {
  return array.length === 0 ? 0 : _.sum(array) / array.length;
}

export function allEqual(array: any[]) {
  return _.every(array, (value) => value === array[0]);
}
export function isEqual(value: any, other: any) {
  return _.isEqual(value, other);
}
export function isEqualWith(value: any, other: any, customizer?: any) {
  return _.isEqualWith(value, other, customizer);
}
export function pickItem(array: any[], idx: number) {
  return array[idx];
}

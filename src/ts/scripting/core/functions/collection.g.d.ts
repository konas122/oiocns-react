type IsEqualCustomizer = (
  value: any,
  other: any,
  indexOrKey: any,
  parent: any,
  otherParent: any,
  stack: any,
) => boolean | undefined;
/**
 * 求数字数组的最小值，如果数组为空则不存在
 * @param array 数字数组
 */
declare function min(array: number[]): number | undefined;
/**
 * 求数字数组的最大值，如果数组为空则不存在
 * @param array 数字数组
 */
declare function max(array: number[]): number | undefined;
/**
 * 求数字数组的和
 * @param array 数字数组
 */
declare function sum(array: number[]): number;
/**
 * 求数字数组的平均数
 * @param array 数字数组
 */
declare function average(array: number[]): number;

/**
 * 数组所有元素相同
 * @param array 数组
 */
declare function allEqual(array: any[]): boolean;

/**
 * 两个数据是否相同
 * @param value 数据1
 * @param other 数据2
 */
declare function isEqual(value: any, other: any): boolean;
/**
 * 两个数据是否相同
 * @param value 数据1
 * @param other 数据2
 * @param customizer 自定义比较函数
 */
declare function isEqualWith(value: any, other: any, customizer?: IsEqualCustomizer)
/**
 * 选取数组某个值
 * @param array 数据
 * @param idex 下标
 */
declare function pickItem(array: any[], idx: number)

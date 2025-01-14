/**
 * 比较两个数组是否完全一致（支持对象深度比较，忽略顺序）
 * @param array1 数组1
 * @param array2 数组2
 * @param options 可选配置，包括排序函数和深度比较函数
 * @returns 是否一致
 */
export function areArraysEqual<T>(
  array1: T[],
  array2: T[],
  options?: {
    sortFn?: (a: T, b: T) => number; // 自定义排序函数
    isDeepEqualFn?: (a: T, b: T) => boolean; // 自定义深度比较函数
    isEqual?: (a: T, b: T) => boolean; // 自定义比较函数
  },
): boolean {
  if (!array1 || !array2 || array1.length !== array2.length) {
    return false;
  }

  // 默认深度比较函数
  const defaultIsDeepEqual = (a: any, b: any): boolean => {
    if (a === b) return true;

    if (typeof a === 'object' && typeof b === 'object' && a && b) {
      if (options?.isEqual) {
        return options.isEqual(a, b);
      }
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      return keysA.every((key) => defaultIsDeepEqual(a[key], b[key]));
    }

    return false;
  };

  const isDeepEqual = options?.isDeepEqualFn || defaultIsDeepEqual;

  // 排序数组
  const sortedArray1 = [...array1].sort(options?.sortFn);
  const sortedArray2 = [...array2].sort(options?.sortFn);

  // 比较排序后的数组
  return sortedArray1.every((item, index) => isDeepEqual(item, sortedArray2[index]));
}

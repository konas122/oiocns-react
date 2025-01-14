declare interface AssertResult {
  success: boolean;
  message: string;
  leftValue: any;
  rightValue: any;
}




/**
 * 比较两个值是否相等。
 *
 * @param a - 第一个要比较的值。
 * @param b - 第二个要比较的值。
 * @returns 返回一个断言结果，success字段表示两个值是否相等。
 */
declare function areEqual(a: any, b: any): AssertResult;
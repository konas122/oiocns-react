type ResultType<T> = {
  code: number;
  data: T;
  msg: string;
  success: boolean;
}

declare const api: Record<string, (...args: any[]) => Promise<ResultType<any>>>;

/**
 * 加载表单数据
 * @param formCode 表单编码
 * @param match 筛选条件，会叠加在表单过滤条件之上
 */
declare function loadThing(formCode: string, match: Record<string, any>): Promise<any[]>;
/**
 * 获取当前账期
 */
declare function getFinancial(): Promise<string>;
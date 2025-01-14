import { schema } from '@/ts/base';

export interface IReceptionProvider {
  /** 根据节点id获取任务接收列表 */
  findReportReceptions(nodeIds: string[]): Promise<Dictionary<schema.XReception | null>>;
}

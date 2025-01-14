import { model, schema } from '@/ts/base';
import { PeriodType } from '@/ts/base/enum';
import { formatDate } from '@/utils';
import { IWork, Work } from '@/ts/core/work';
import message from '@/utils/message';
import { IApplication, ISession, ITarget } from '@/ts/core';
import { IDistributionTask } from '@/ts/core/thing/standard/distributiontask';

type Base = model.TaskContentBase<model.TaskContentType>;

export interface IDistribution<C extends Base = Base> {
  /** 键 */
  key: string;
  /** 空间 */
  target: ITarget;
  /** 元数据 */
  metadata: schema.XDistribution;
  /** 主键 */
  id: string;
  /** 分发类型 */
  periodType: PeriodType;
  /** 时期 */
  period: string;
  /** 办事 */
  workId: string | undefined;
  /** 任务 */
  task: IDistributionTask;
  /** 内容 */
  data: C;
  /** 查找办事 */
  findWorkAuto(session: ISession): Promise<IWork>;
  /** 返回已发起的任务数量 */
  existsReceptionCount(): Promise<number>;
  /** 计算任务接收对应的往期任务时期 */
  getHistoryPeriod(timeSpan: number): string;
}

export abstract class Distribution<C extends Base> implements IDistribution<C> {
  protected constructor(task: IDistributionTask, metadata: schema.XDistribution) {
    this.task = task;
    this.metadata = metadata;
  }
  abstract data: C;
  metadata: schema.XDistribution;
  task: IDistributionTask;

  get id() {
    return this.metadata.id;
  }
  get key() {
    return this.metadata.id;
  }
  get target() {
    return this.task.directory.target;
  }
  get typeName() {
    return this.metadata.typeName;
  }
  get periodType() {
    return this.metadata.periodType;
  }
  get period() {
    return this.metadata.period;
  }
  get workId() {
    return this.metadata.content.workId;
  }
  get treeId() {
    return this.metadata.content.treeId;
  }

  async findWorkAuto(session: ISession): Promise<IWork> {
    const res = await this.target.resource.workDefineColl.loadResult({
      options: {
        match: {
          primaryId: this.workId,
          shareId: session.target.metadata.id,
          isDeleted: false,
          applicationId: {
            _gt_: '0',
          },
        },
      },
    });
    if (res.success && res.data && res.data.length > 0) {
      const target = session.target;
      if (target) {
        return new Work(res.data[0], { directory: target.directory } as IApplication);
      } else {
        message.warn('未找到该关联办事!');
      }
    }
    throw new Error('未获取到相关办事信息!');
  }

  async existsReceptionCount(): Promise<number> {
    return await this.target.resource.publicTaskReceptionColl.count({
      options: {
        match: {
          taskId: this.task.id,
          period: this.period,
          distId: this.id,
          _and_: [
            { instanceId: { _exists_: true } },
            { instanceId: { _ne_: '' } },
            { instanceId: { _ne_: null } },
          ],
        },
      },
    });
  }

  getHistoryPeriod(timeSpan = -1) {
    const period = this.metadata.period;
    const date = new Date(period);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    switch (this.metadata.periodType) {
      case PeriodType.Year:
        return year + timeSpan + '';
      case PeriodType.Quarter: {
        const newDate = new Date(year, month + timeSpan * 3, 1);
        return formatDate(newDate, 'yyyy-MM');
      }
      case PeriodType.Month: {
        const newDate = new Date(year, month + timeSpan, 1);
        return formatDate(newDate, 'yyyy-MM');
      }
      case PeriodType.Day: {
        const newDate = new Date(year, month, day + timeSpan);
        return formatDate(newDate, 'yyyy-MM-dd');
      }
      case PeriodType.Week: {
        const newDate = new Date(year, month, day + 7 * timeSpan);
        return formatDate(newDate, 'yyyy-MM-dd');
      }
      case PeriodType.Once:
      case PeriodType.Any:
      default:
        return period;
    }
  }
}

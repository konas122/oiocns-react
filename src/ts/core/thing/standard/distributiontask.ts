import { schema } from '@/ts/base';
import { XCollection } from '../../public/collection';
import { IDirectory } from '../directory';
import { IStandardFileInfo, StandardFileInfo } from '../fileinfo';
import { TaskContentType } from '@/ts/base/model';

export interface IDistributionTask extends IStandardFileInfo<schema.XDistributionTask> {
  /** 任务分发 */
  distributions: schema.XDistribution[];
  /** 应用 */
  directoryId: string;
  /** 办事 */
  workId: string;
  /** 类型 */
  type: TaskContentType;
  /** 创建下发信息 */
  create(dist: schema.XDistribution): Promise<schema.XDistribution | undefined>;
  /** 删除下发信息 */
  hardDeleteDistribution(dist: schema.XDistribution): Promise<void>;
  /** 加载下发信息 */
  loadDistributions(): Promise<schema.XDistribution[]>;
}

export class DistributionTask
  extends StandardFileInfo<schema.XDistributionTask>
  implements IDistributionTask
{
  constructor(_metadata: schema.XDistributionTask, directory: IDirectory) {
    super(_metadata, directory, directory.resource.distributionTaskColl);
    const resource = directory.resource;
    this.distributionColl = resource.genColl<schema.XDistribution>('work-distribution');
  }
  distributionColl: XCollection<schema.XDistribution>;
  distributions: schema.XDistribution[] = [];
  get type() {
    return this.metadata.content.type;
  }
  get cacheFlag() {
    return 'distribution-task';
  }
  get directoryId() {
    return this.metadata.content.directoryId;
  }
  get workId() {
    return this.metadata.content.workId;
  }
  async copy(destination: IDirectory): Promise<boolean> {
    if (this.allowCopy(destination)) {
      return await super.copyTo(
        destination.id,
        destination.resource.distributionTaskColl,
      );
    }
    return false;
  }
  async move(destination: IDirectory): Promise<boolean> {
    if (this.allowMove(destination)) {
      return await super.moveTo(destination, destination.resource.distributionTaskColl);
    }
    return false;
  }
  async create(dist: schema.XDistribution): Promise<schema.XDistribution | undefined> {
    const result = await this.distributionColl.loadSpace({
      options: {
        match: {
          taskId: dist.taskId,
          periodType: dist.periodType,
          period: dist.period,
        },
      },
    });
    if (result.length > 0) {
      throw new Error(`分发 ${dist.period} 已存在`);
    }
    
    return await this.distributionColl.insert({
      ...dist,
      typeName: '分发任务',
      name: dist.name ?? '' + ' ' + dist.period,
      code: dist.period,
    });
  }

  async hardDeleteDistribution(dist: schema.XDistribution): Promise<void> {
    await this.distributionColl.remove(dist);
  }

  async loadDistributions(): Promise<schema.XDistribution[]> {
    const result = await this.distributionColl.loadSpace({
      options: {
        match: {
          taskId: this.id,
          periodType: this.metadata.periodType,
        },
        sort: {
          period: -1,
        },
      },
    });
    this.distributions = result;
    return result;
  }

  async checkDistribution() {
    const dists = await this.loadDistributions();
    if (dists.length > 0) {
      throw new Error('任务已下发，无法删除，请先删除所有任务分发');
    }
  }

  override async delete(notify?: boolean): Promise<boolean> {
    await this.checkDistribution();
    return super.delete(notify);
  }

  override async hardDelete(notify?: boolean): Promise<boolean> {
    await this.checkDistribution();
    return super.hardDelete(notify);
  }
}

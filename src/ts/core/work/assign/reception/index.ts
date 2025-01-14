import { XWorkInstance } from '@/ts/base/schema';
import { IWork, Work } from '@/ts/core/work';
import { IApplication, IFileInfo, IGroup, ITarget, XCollection } from '@/ts/core';
import { model, schema } from '@/utils/excel';
import { getStatus, ReceptionStatus } from '@/ts/core/work/assign/reception/status';
import { FileInfo } from '@/ts/core/thing/fileinfo';
import { entityOperates } from '@/ts/core/public';
import { kernel } from '@/ts/base';

type Base = model.ReceptionContentBase<model.TaskContentType>;

export interface IReception<C extends Base = Base> extends IFileInfo<schema.XReception> {
  /** 键 */
  key: string;
  /** 期数 */
  period: string;
  /** 办事 */
  workId: string;
  /** 操作空间 */
  target: ITarget;
  /** 任务文件群 */
  group: IGroup;
  /** 元数据 */
  metadata: schema.XReception;
  /** 内容 */
  data: C;
  /** 办事对象 */
  work: IWork | undefined;
  /** 状态 */
  status: ReceptionStatus;
  /** 加载办事信息 */
  loadWork(reload?: boolean): Promise<IWork | undefined>;
  /** 加载办事实例 */
  loadInstanceDetail(instanceId: string): Promise<XWorkInstance | undefined>;
  /** 提交（更新流程实例ID） */
  submit(instanceId: string): Promise<boolean>;
  /** 变更（重新发起） */
  change(): Promise<boolean>;
  /** 保存草稿 ID */
  draft(id: string): Promise<schema.XReception | undefined> | undefined;
}

export class Reception<C extends Base = Base>
  extends FileInfo<schema.XReception>
  implements IReception<C>
{
  group: IGroup;
  work: IWork | undefined;
  private _workLoaded = false;
  publicReceptionColl: XCollection<schema.XReception> | null = null;

  constructor(_metadata: schema.XReception, target: ITarget) {
    super(_metadata, target.directory);
    this.group = target.targets.find((t) => t.id == this.metadata.sessionId) as IGroup;
    if (this.group) {
      this.publicReceptionColl = this.group.resource.publicTaskReceptionColl;
    } else {
      console.warn('找不到接收任务的群聊');
    }
  }

  override operates(): model.OperateModel[] {
    return [
      entityOperates.Open,
      entityOperates.Remark,
      entityOperates.QrCode,
      entityOperates.CancelReceptionTask,
    ];
  }

  get data() {
    return this.metadata.content as C;
  }
  get cacheFlag() {
    return 'work-reception';
  }
  get code() {
    return this.metadata.period;
  }
  get name() {
    return this.period + this.metadata.name;
  }
  get period() {
    return this.metadata.period;
  }
  get workId() {
    return this.metadata.content.workId;
  }

  get status() {
    return getStatus(this.metadata);
  }
  get groupTags() {
    const tags: string[] = [this.metadata.content.type];
    if (this.metadata.belongId != this.userId) {
      if (this.metadata.content.type == model.TaskContentType.Report) {
        if (this.metadata.content.treeNode?.name) {
          tags.push(this.metadata.content.treeNode.name);
        }
      } else {
        tags.push(this.target.user.findShareById(this.metadata.belongId)?.name);
      }
    } else {
      tags.push(this.target.name);
    }
    if (this.metadata.isAutoFill) {
      tags.push('自动补全');
    }
    return tags;
  }
  async loadWork(reload?: boolean | undefined): Promise<IWork | undefined> {
    if (reload || !this._workLoaded) {
      this._workLoaded = true;
      if (!this.group) {
        console.warn('找不到接收任务群聊的会话，无法加载办事');
        return;
      }
      const res = await this.group.resource.workDefineColl.loadResult({
        options: {
          match: {
            primaryId: this.workId,
            shareId: this.metadata.sessionId,
            applicationId: {
              _gt_: '0',
            },
            isDeleted: false,
          },
        },
      });
      if (res.success && res.data.length == 1) {
        const work = new Work(res.data[0], {
          directory: this.group.directory,
        } as IApplication);
        if (work) {
          this.work = work as IWork;
          return this.work;
        }
      }
    }
    return this.work;
  }

  async loadInstanceDetail(instanceId: string): Promise<XWorkInstance | undefined> {
    const belongId = this.metadata.content.treeNode.belongId;
    // 先查群里
    let detail = await kernel.findInstance(this.metadata.sessionId, belongId, instanceId);

    if (!detail) {
      // 再查自己的
      detail = await kernel.findInstance(belongId, belongId, instanceId);
    }
    if (detail) {
      detail.tasks = await kernel.LoadInstanceTask(detail.shareId, belongId, instanceId);
    }
    return detail;
  }

  async submit(instanceId: string) {
    this.metadata.instanceId = instanceId;
    this.metadata.isReject = false;
    const data = await this.publicReceptionColl?.replace(this.metadata);
    return !!data;
  }

  async change(): Promise<boolean> {
    if (!this.metadata.thingId) {
      return false;
    }
    this.metadata.receiveUserId = this.userId;
    this.metadata.previousInstanceId = this.metadata.instanceId;
    this.metadata.isReject = false;
    delete this.metadata.instanceId;
    const data = await this.publicReceptionColl?.replace(this.metadata);
    return !!data;
  }

  draft(id: string): Promise<schema.XReception | undefined> | undefined {
    return this.publicReceptionColl?.update(this.metadata.id, { _set_: { draftId: id } });
  }

  delete(): Promise<boolean> {
    return Promise.resolve(false);
  }
}

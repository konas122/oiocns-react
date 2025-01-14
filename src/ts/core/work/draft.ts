import { IWork } from '.';
import { schema, model, kernel, common } from '../../base';
import { PageAll, entityOperates } from '../public';
import { IBelong } from '../target/base/belong';
import { DataProvider } from '@/ts/core/provider';
import { IWorkApply } from './apply';
import { FileInfo, IFile } from '../thing/fileinfo';
import { ITarget } from '../target/base/target';

export interface IWorkDarft extends IFile {
  /** 内容 */
  comment: string;
  /** 当前用户 */
  user: DataProvider;
  /** 归属空间 */
  belong: IBelong;
  /** 任务元数据 */
  draftData: schema.XWorkInstance;
  /** 流程实例 */
  instance: schema.XWorkInstance | undefined;
  /** 实例携带的数据 */
  instanceData: model.InstanceDataModel | undefined;
  /** 加用户任务信息 */
  targets: schema.XTarget[];
  /** 是否满足条件 */
  isMatch(filter: string): boolean;
  /** 加载流程实例数据 */
  loadInstance(reload?: boolean): Promise<boolean>;
  /** 生成办事申请单 */
  createApply(
    taskId?: string,
    pdata?: model.InstanceDataModel,
  ): Promise<IWorkApply | undefined>;
}

export class WorkDarft extends FileInfo<schema.XEntity> implements IWorkDarft {
  constructor(
    _metadata: schema.XWorkInstance,
    _user: DataProvider,
    _notity: common.Emitter,
  ) {
    super(
      {
        ..._metadata,
        name: _metadata.title ?? '',
        code: _metadata.defineId,
        icon: '',
        typeName: '暂存',
        belong: _user.user!.metadata,
      },
      _user.user!.directory,
    );
    this.draftData = _metadata;
    this.user = _user;
    this.notity = _notity;
  }
  user: DataProvider;
  cacheFlag: string = 'worktask';
  draftData: schema.XWorkInstance;
  instance: schema.XWorkInstance | undefined;
  instanceData: model.InstanceDataModel | undefined;
  notity: common.Emitter;
  get groupTags(): string[] {
    return [this.belong.name];
  }
  get metadata(): schema.XEntity {
    let typeName = '事项';
    return {
      ...this.draftData,
      icon: '',
      typeName,
      belong: undefined,
      name: this.draftData.title,
      code: this.draftData.id,
      remark: this.comment || '暂无信息',
    };
  }
  delete(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  async hardDelete(): Promise<boolean> {
    const success = await this.user.user?.workStagging.remove(this.draftData);
    if (success) {
      this.notity.changCallback('草稿', '已删除');
    }
    return !!success;
  }
  operates(): model.OperateModel[] {
    return [
      entityOperates.Open,
      entityOperates.Remark,
      entityOperates.QrCode,
      entityOperates.HardDelete,
    ];
  }
  get comment(): string {
    if (this.targets.length === 2) {
      return `${this.targets[0].name}[${this.targets[0].typeName}]申请加入${this.targets[1].name}[${this.targets[1].typeName}]`;
    }
    return this.draftData.content;
  }
  get belong(): IBelong {
    for (const company of this.user.user!.companys) {
      if (company.id === this.draftData.belongId) {
        return company;
      }
    }
    return this.user.user!;
  }
  get targets(): schema.XTarget[] {
    return [];
  }
  isMatch(filter: string): boolean {
    return JSON.stringify(this.draftData).includes(filter);
  }
  async loadInstance(reload: boolean = false): Promise<boolean> {
    if (this.instanceData !== undefined && !reload) return true;
    if (this.draftData?.data) {
      this.instance = this.draftData;
      this.instanceData = eval(`(${this.draftData?.data})`);
      return this.instanceData !== undefined;
    }
    return false;
  }

  async createApply(): Promise<IWorkApply | undefined> {
    await this.loadInstance();
    var define = await this.findWorkById(
      this.draftData.defineId,
      this.draftData.shareId, 
    );
    if (define) {
      return await define.createApply('0', this.instanceData);
    }
  }

  async findWorkById(wrokId: string, shareId: string): Promise<IWork | undefined> {
    const res = await kernel.queryWorkDefine({
      id: wrokId,
      shareId: shareId,
    });
    if (res.success && res.data && res.data.result && res.data.result.length > 0) {
      var define = res.data.result[0];
      var target = this.user.targets.find((i: ITarget) => i.id === define.shareId);
      if (target) {
        for (var app of await target.directory.loadAllApplication()) {
          const work = await app.findWork(wrokId, define.applicationId);
          if (work) {
            return work;
          }
        }
      }
    }
  }
}

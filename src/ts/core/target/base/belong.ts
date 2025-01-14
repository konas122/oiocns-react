import { schema, kernel, model, command } from '@/ts/base';
import { PageAll } from '../../public/consts';
import { TargetType } from '../../public/enums';
import { IAuthority, Authority } from '../authority/authority';
import { Cohort, ICohort } from '../outTeam/cohort';
import { ITarget, Target } from './target';
import { Session } from '../../chat/session';
import { entityOperates, targetOperates } from '../../public';
import { IStorage } from '../outTeam/storage';
import TargetResources from './resource';
import { IPerson } from '../person';
import { IFile } from '../../thing/fileinfo';
import { XCollection } from '../../public/collection';
import { Financial, IFinancial } from '../../work/financial';
import { ISubscriptionManager, SubscriptionManager } from '../../thing/subscribe';
import { IReception, Reception } from '../../work/assign/reception';
import { ReportReception } from '../../work/assign/reception/report';
import { IActivity } from '../../chat/activity';

/** 自归属用户接口类 */
export interface IBelong extends ITarget {
  /** 超管权限，权限为树结构 */
  superAuth: IAuthority | undefined;
  /** 加入/管理的群 */
  cohorts: ICohort[];
  /** 用户相关的所有动态会话 */
  activitys: IActivity[];
  /** 激活的数据核 */
  activated: IStorage | undefined;
  /** 存储资源群 */
  storages: IStorage[];
  /** 上级用户 */
  parentTarget: ITarget[];
  /** 共享组织 */
  shareTarget: ITarget[];
  /** 办事暂存集合 */
  workStagging: XCollection<schema.XWorkInstance>;
  /** 财务接口 */
  financial: IFinancial;
  /** 订阅接口 */
  manager: ISubscriptionManager;
  /** 接收任务 */
  tasks: IReception[];
  /** 常用文件 */
  commons: schema.XCommon[];
  /** 获取存储占用情况 */
  getDiskInfo(): Promise<model.DiskInfoType | undefined>;
  /** 加载超管权限 */
  loadSuperAuth(reload?: boolean): Promise<IAuthority | undefined>;
  /** 申请加用户 */
  applyJoin(members: schema.XTarget[]): Promise<boolean>;
  /** 设立人员群 */
  createCohort(data: model.TargetModel): Promise<ICohort | undefined>;
  /** 发送职权变更消息 */
  sendAuthorityChangeMsg(operate: string, authority: schema.XAuthority): Promise<boolean>;
  /** 加载接收任务 */
  loadTasks(reload?: boolean): Promise<IReception[]>;
  /** 加载指定集合任务 */
  loadGroupTasks(
    receptionXCollection: XCollection<schema.XReception>,
    receptionId: string,
  ): Promise<IReception[]>;
  /** 常用设置 */
  updateCommon(data: schema.XCommon, set: boolean): Promise<boolean>;
}

/** 自归属用户基类实现 */
export abstract class Belong extends Target implements IBelong {
  constructor(
    _metadata: schema.XTarget,
    _relations: string[],
    _user?: IPerson,
    _memberTypes: TargetType[] = [TargetType.Person],
  ) {
    super([], _metadata, _relations, undefined, _user, _memberTypes);
    this.financial = new Financial(this);
    this.manager = new SubscriptionManager(this);
    this.workStagging = new XCollection<schema.XWorkInstance>(
      _metadata,
      'work-instance-staging',
      [_metadata.id],
      [this.key],
    );
    this.lajidaima(_metadata);
  }
  financial: IFinancial;
  manager: ISubscriptionManager;
  workStagging: XCollection<schema.XWorkInstance>;
  cohorts: ICohort[] = [];
  storages: IStorage[] = [];
  tasks: IReception[] = [];
  superAuth: IAuthority | undefined;
  _taskLoaded: boolean = false;
  commons: schema.XCommon[] = [];
  commonsApp: schema.XCommon[] = [];
  commonsWork: schema.XCommon[] = [];
  commonsForm: schema.XCommon[] = [];
  abstract get activitys(): IActivity[];
  get activated(): IStorage | undefined {
    return this.storages.find((i) => i.isActivate);
  }
  get superior(): IFile {
    return 'disk' as unknown as IFile;
  }
  async loadMembers(reload: boolean = false): Promise<schema.XTarget[]> {
    if (this.isMyTeam && (!TargetResources.loaded(this.id) || reload)) {
      TargetResources.setLoaded(this.id);
      const res = await this.getPartMembers(0);
      res.offset = 0;
      this.memberCount = res.total;
      this.memberFilterCount = res.total;
      TargetResources.pullMembers(this.id, res.result || []);
      while (res.offset + res.limit < res.total) {
        res.offset += res.limit;
        const part = await this.getPartMembers(res.offset);
        TargetResources.pullMembers(this.id, part.result || []);
      }
      this.members.forEach((i) => this.updateMetadata(i));
      this.loadMemberChats(this.members, true);
    }
    return this.members;
  }
  async loadSuperAuth(reload: boolean = false): Promise<IAuthority | undefined> {
    if (!this.superAuth || reload) {
      const res = await kernel.queryAuthorityTree({
        id: this.id,
        page: PageAll,
      });
      if (res.success && res.data?.id) {
        this.superAuth = new Authority(res.data, this);
      }
    }
    return this.superAuth;
  }
  async findEntityAsync(id: string): Promise<schema.XEntity | undefined> {
    const metadata = this.findMetadata<schema.XEntity>(id);
    if (metadata) {
      return metadata;
    }
    const res = await kernel.queryEntityById({ id: id });
    if (res.success && res.data?.id) {
      this.updateMetadata(res.data);
      return res.data;
    }
  }
  async createCohort(data: model.TargetModel): Promise<ICohort | undefined> {
    data.typeName = TargetType.Cohort;
    const metadata = await this.create(data);
    if (metadata) {
      const cohort = new Cohort(metadata, this, metadata.belongId);
      if (this.typeName != TargetType.Person) {
        if (!(await this.pullSubTarget(cohort))) {
          return;
        }
      }
      this.cohorts.push(cohort);
      await cohort.pullMembers([this.user.metadata]);
      await cohort.deepLoad();
      return cohort;
    }
  }
  async getDiskInfo(): Promise<model.DiskInfoType | undefined> {
    const res = await kernel.diskInfo(this.id, this.id, this.relations);
    if (res.success && res.data) {
      return res.data;
    }
  }
  override loadMemberChats(_newMembers: schema.XTarget[], _isAdd: boolean): void {
    _newMembers = _newMembers.filter((i) => i.id != this.userId);
    if (_isAdd) {
      const labels = this.id === this.user.id ? ['好友'] : [this.name, '同事'];
      _newMembers.forEach((i) => {
        if (!this.memberChats.some((a) => a.id === i.id)) {
          this.memberChats.push(new Session(i.id, this, i, labels));
        }
      });
    } else {
      this.memberChats = this.memberChats.filter((i) =>
        _newMembers.every((a) => a.id != i.sessionId),
      );
    }
  }
  async loadContent(reload: boolean = false): Promise<boolean> {
    await super.loadContent(reload);
    await this.loadSuperAuth(reload);
    return true;
  }
  override operates(): model.OperateModel[] {
    const operates = super.operates();
    if (this.hasRelationAuth()) {
      operates.unshift(targetOperates.NewCohort);
    }
    if (this.hasRelationAuth()) {
      operates.unshift(entityOperates.LookSubscribes);
    }
    return operates;
  }
  abstract get shareTarget(): ITarget[];
  abstract get parentTarget(): ITarget[];
  abstract applyJoin(members: schema.XTarget[]): Promise<boolean>;
  async sendAuthorityChangeMsg(
    operate: string,
    authority: schema.XAuthority,
  ): Promise<boolean> {
    const res = await kernel.dataNotify({
      data: {
        operate,
        authority,
        operater: this.user.metadata,
      },
      flag: 'authority',
      onlineOnly: true,
      belongId: this.metadata.belongId,
      relations: this.relations,
      onlyTarget: true,
      ignoreSelf: true,
      targetId: this.metadata.id,
      targetType: 'target',
    });
    return res.success;
  }
  async loadTasks(reload?: boolean): Promise<IReception[]> {
    if (reload || !this._taskLoaded) {
      this._taskLoaded = true;
      const result = await this.resource.receptionColl.loadSpace({
        options: {
          match: {
            isDeleted: false,
            belongId: this.id,
            receiveUserId: this.userId,
          },
        },
      });
      this.tasks = this.convert(result);
    }
    return this.tasks;
  }
  async loadGroupTasks(
    _receptionXCollection: XCollection<schema.XReception>,
    receptionId: string,
  ): Promise<IReception[]> {
    const result = await _receptionXCollection.loadSpace({
      options: {
        match: {
          isDeleted: false,
          belongId: this.id,
          receiveUserId: this.userId,
          id: receptionId,
        },
      },
    });
    this.tasks = this.convert(result);
    return this.tasks;
  }
  protected convert(result: schema.XReception[]) {
    const data: IReception[] = [];
    for (const item of result) {
      switch (item.content.type) {
        case '报表':
          data.push(new ReportReception(item, this));
          break;
        default:
          data.push(new Reception(item, this));
          break;
      }
    }
    return data;
  }

  async updateCommon(data: schema.XCommon, set: boolean): Promise<boolean> {
    if (set) {
      this.commons.unshift(data);
    } else {
      this.commons = this.commons.filter(
        (i) => !(i.id === data.id && i.spaceId === data.spaceId),
      );
    }
    if (await this.cacheObj.set('commons', this.commons)) {
      await this.cacheObj.notity('commons', this.commons, this.id === this.userId);
      return true;
    }
    return false;
  }

  async _loadCommons(): Promise<void> {
    const data = await this.cacheObj.get<schema.XCommon[]>('commons');
    if (data && Array.isArray(data) && data.length > 0) {
      this.commons = data;
    }
    this.cacheObj.subscribe('commons', (res: schema.XCommon[]) => {
      if (res && Array.isArray(res)) {
        this.commons = res;
        if (this.id === this.userId) {
          command.emitterFlag('commons', true);
        } else {
          command.emitterFlag(`${this.id}commons`, true);
        }
      }
    });
  }

  private lajidaima(_metadata: schema.XTarget) {
    kernel.subscribe(
      `${_metadata.belongId}-${_metadata.id}-authority`,
      [this.key],
      (data: any) => this.superAuth?.receiveAuthority(data),
    );
    this.resource.receptionColl.subscribe(['work-reception-' + this.id], (result) => {
      switch (result.operate) {
        case 'replace':
          {
            const converted = this.convert([result.data]);
            for (const one of converted) {
              const index = this.tasks.findIndex((item) => item.id == one.id);
              if (index == -1) {
                this.tasks.push(one);
              } else {
                this.tasks[index] = one;
              }
            }
          }
          break;
        case 'remove':
          this.tasks = this.tasks.filter((item) => item.id != result.data.id);
          break;
      }
    });
  }
}

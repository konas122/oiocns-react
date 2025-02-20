import { kernel, model, schema } from '@/ts/base';
import { IBelong, Belong } from '../base/belong';
import { IGroup, Group } from '../outTeam/group';
import { IDepartment, Department } from '../innerTeam/department';
import { IStation, Station } from '../innerTeam/station';
import { IPerson } from '../person';
import { PageAll, departmentTypes } from '../../public/consts';
import { TargetType } from '../../public/enums';
import { ITarget } from '../base/target';
import { ITeam } from '../base/team';
import { targetOperates } from '../../public';
import { Storage } from '../outTeam/storage';
import { Cohort } from '../outTeam/cohort';
import { ISession } from '../../chat/session';
import { IFile } from '../../thing/fileinfo';
import { IActivity } from '../../chat/activity';
import { IReception } from '@/ts/core/work/assign/reception';

/** 单位类型接口 */
export interface ICompany extends IBelong {
  /** 加入/管理的组织集群 */
  groups: IGroup[];
  /** 设立的岗位 */
  stations: IStation[];
  /** 设立的部门 */
  departments: IDepartment[];
  /** 集群任务 */
  groupTask: IReception[];

  /** 退出单位 */
  exit(): Promise<boolean>;

  /** 加载组织集群 */
  loadGroups(reload?: boolean): Promise<IGroup[]>;

  /** 加载单位的部门 */
  loadDepartments(reload?: boolean): Promise<IDepartment[]>;

  /** 设立岗位 */
  createStation(data: model.TargetModel): Promise<IStation | undefined>;

  /** 设立组织集群 */
  createGroup(data: model.TargetModel): Promise<IGroup | undefined>;

  /** 设立内部机构 */
  createDepartment(data: model.TargetModel): Promise<IDepartment | undefined>;

  /** 加载接收任务 */
  loadPublicTasks(reload?: boolean): Promise<IReception[]>;
}

/** 单位类型实现 */
export class Company extends Belong implements ICompany {
  constructor(_metadata: schema.XTarget, _user: IPerson) {
    super(_metadata, [_metadata.id], _user);
  }

  groups: IGroup[] = [];
  stations: IStation[] = [];
  departments: IDepartment[] = [];
  groupTask: IReception[] = [];
  private _groupLoaded: boolean = false;
  private _departmentLoaded: boolean = false;

  async loadGroups(reload: boolean = false): Promise<IGroup[]> {
    if (!this._groupLoaded || reload) {
      const res = await kernel.queryJoinedTargetById({
        id: this.id,
        typeNames: [TargetType.Group, TargetType.Storage],
        page: PageAll,
      });
      if (res.success) {
        this._groupLoaded = true;
        this.storages = [];
        this.groups = [];
        for (const mdata of res.data.result || []) {
          switch (mdata.typeName) {
            case TargetType.Storage:
              this.storages.push(new Storage(mdata, [this.id], this));
              break;
            default:
              this.groups.push(new Group([this.key], mdata, [this.id], this));
              break;
          }
        }
      }
    }
    return this.groups;
  }

  async loadDepartments(reload?: boolean | undefined): Promise<IDepartment[]> {
    if (!this._departmentLoaded || reload) {
      const res = await kernel.querySubTargetById({
        id: this.id,
        subTypeNames: [...departmentTypes, TargetType.Cohort, TargetType.Station],
        page: PageAll,
      });
      if (res.success) {
        this._departmentLoaded = true;
        this.departments = [];
        this.stations = [];
        this.cohorts = [];
        (res.data.result || []).forEach((i) => {
          switch (i.typeName) {
            case TargetType.Cohort:
              this.cohorts.push(new Cohort(i, this, this.id));
              break;
            case TargetType.Station:
              this.stations.push(new Station(i, this));
              break;
            default:
              this.departments.push(new Department([this.key], i, this));
          }
        });
      }
    }
    return this.departments;
  }

  async createGroup(data: model.TargetModel): Promise<IGroup | undefined> {
    data.typeName = TargetType.Group;
    const metadata = await this.create(data);
    if (metadata) {
      const group = new Group([this.key], metadata, [this.id], this);
      this.groups.push(group);
      await group.pullMembers([this.metadata]);
      await group.deepLoad();
      return group;
    }
  }

  async createDepartment(data: model.TargetModel): Promise<IDepartment | undefined> {
    if (!departmentTypes.includes(data.typeName as TargetType)) {
      data.typeName = TargetType.Department;
    }
    data.public = false;
    const metadata = await this.create(data);
    if (metadata) {
      const department = new Department([this.key], metadata, this);
      await department.deepLoad();
      if (await this.pullSubTarget(department)) {
        this.departments.push(department);
        return department;
      }
    }
  }

  async createStation(data: model.TargetModel): Promise<IStation | undefined> {
    data.public = false;
    data.typeName = TargetType.Station;
    const metadata = await this.create(data);
    if (metadata) {
      const station = new Station(metadata, this);
      if (await this.pullSubTarget(station)) {
        this.stations.push(station);
        return station;
      }
    }
  }

  async createTarget(data: model.TargetModel): Promise<ITeam | undefined> {
    switch (data.typeName) {
      case TargetType.Cohort:
        return this.createCohort(data);
      case TargetType.Station:
        return this.createStation(data);
      case TargetType.Group:
        return this.createGroup(data);
      default:
        return this.createDepartment(data);
    }
  }

  async applyJoin(members: schema.XTarget[]): Promise<boolean> {
    for (const member of members) {
      if (
        member.typeName === TargetType.Group ||
        member.typeName === TargetType.Storage
      ) {
        await kernel.applyJoinTeam({
          id: member.id,
          subId: this.id,
        });
      }
      if (departmentTypes.includes(member.typeName as TargetType)) {
        await kernel.applyJoinTeam({
          id: member.id,
          subId: this.user.id,
        });
      }
    }
    return true;
  }

  async exit(): Promise<boolean> {
    if (await this.removeMembers([this.user.metadata])) {
      this.user.companys = this.user.companys.filter((i) => i.key != this.key);
      this.user.changCallback();
      return true;
    }
    return false;
  }

  override async delete(notity: boolean = false): Promise<boolean> {
    const success = await super.delete(notity);
    if (success) {
      this.user.companys = this.user.companys.filter((i) => i.key != this.key);
      this.user.changCallback();
    }
    return success;
  }

  get subTarget(): ITarget[] {
    return [...this.departments, ...this.cohorts];
  }

  get shareTarget(): ITarget[] {
    return [this, ...this.groups, ...this.storages];
  }

  get parentTarget(): ITarget[] {
    return this.groups;
  }

  get chats(): ISession[] {
    const chats: ISession[] = [this.session];
    for (const item of this.departments) {
      chats.push(...item.chats);
    }
    for (const item of this.cohorts) {
      chats.push(...item.chats);
    }
    chats.push(...this.memberChats);
    return chats;
  }

  get activitys(): IActivity[] {
    const activitys: IActivity[] = [this.session.activity];
    for (const item of this.cohorts) {
      activitys.push(item.session.activity);
    }
    for (const item of this.departments) {
      activitys.push(...item.chats.map((i) => i.activity));
    }
    for (const item of this.groups) {
      activitys.push(...item.chats.map((i) => i.activity));
    }
    return activitys;
  }

  get targets(): ITarget[] {
    const targets: ITarget[] = [this];
    for (const item of this.groups) {
      targets.push(...item.targets);
    }
    for (const item of this.departments) {
      targets.push(...item.targets);
    }
    for (const item of this.cohorts) {
      targets.push(...item.targets);
    }
    for (const item of this.storages) {
      targets.push(...item.targets);
    }
    return targets;
  }

  async deepLoad(reload: boolean = false): Promise<void> {
    await this.cacheObj.all();
    await this._loadCommons();
    await Promise.all([
      this.loadSuperAuth(reload),
      this.loadIdentitys(reload),
      this.loadGroups(reload),
      this.loadDepartments(reload),
    ]);
    await this.directory.loadDirectoryResource(reload);
    setTimeout(async () => {
      await Promise.all(
        this.departments.map((department) => department.deepLoad(reload)),
      );
      await Promise.all(this.cohorts.map((cohort) => cohort.deepLoad(reload)));
      await this.manager.loadSubscriptions();
      await Promise.all(this.groups.map((group) => group.deepLoad(reload)));
      await Promise.all(this.storages.map((storage) => storage.deepLoad(reload)));
      await Promise.all(this.stations.map((station) => station.deepLoad(reload)));
      await this.superAuth?.deepLoad(reload);
    }, 1000);
  }

  override operates(): model.OperateModel[] {
    const operates = super.operates();
    if (this.hasRelationAuth()) {
      operates.unshift(
        targetOperates.JoinGroup,
        targetOperates.JoinStorage,
        targetOperates.NewGroup,
        targetOperates.NewDepartment,
      );
    }
    return operates;
  }

  content(): IFile[] {
    return [
      ...this.groups,
      ...this.departments,
      ...this.cohorts,
      ...this.storages,
    ].filter((i) => i.isMyTeam);
  }

  override async removeMembers(
    members: schema.XTarget[],
    notity: boolean = false,
  ): Promise<boolean> {
    notity = await super.removeMembers(members, notity);
    if (notity) {
      this.subTarget.forEach((a) => a.removeMembers(members, true));
    }
    return notity;
  }

  override async _removeJoinTarget(target: schema.XTarget): Promise<string> {
    var find = [...this.groups, ...this.storages].find((i) => i.id === target.id);
    if (find) {
      await find.delete(true);
      return `${this.name}已被从${target.name}移除.`;
    }
    return '';
  }

  override async _addJoinTarget(target: schema.XTarget): Promise<string> {
    switch (target.typeName) {
      case TargetType.Group:
        if (this.groups.every((i) => i.id != target.id)) {
          const group = new Group([this.key], target, [this.id], this);
          await group.deepLoad();
          this.groups.push(group);
          return `${this.name}已成功加入到${target.name}.`;
        }
        break;
      case TargetType.Storage:
        if (this.storages.every((i) => i.id != target.id)) {
          const storage = new Storage(target, [], this);
          await storage.deepLoad();
          this.storages.push(storage);
          return `${this.name}已成功加入到${target.name}.`;
        }
        break;
    }
    return '';
  }

  override async _addSubTarget(target: schema.XTarget): Promise<string> {
    switch (target.typeName) {
      case TargetType.Cohort:
        if (this.cohorts.every((i) => i.id != target.id)) {
          const cohort = new Cohort(target, this, this.id);
          await cohort.deepLoad();
          this.cohorts.push(cohort);
          return `${this.name}创建了${target.name}.`;
        }
        break;
      case TargetType.Station:
        if (this.stations.every((i) => i.id != target.id)) {
          const station = new Station(target, this);
          await station.deepLoad();
          this.stations.push(station);
          return `${this.name}创建了${target.name}.`;
        }
        break;
      default:
        if (departmentTypes.includes(target.typeName as TargetType)) {
          if (this.departments.every((i) => i.id != target.id)) {
            const department = new Department([this.key], target, this);
            await department.deepLoad();
            this.departments.push(department);
            return `${this.name}创建了${target.name}.`;
          }
        }
        break;
    }
    return '';
  }

  async loadPublicTasks(reload?: boolean): Promise<IReception[]> {
    if (reload || !this._taskLoaded) {
      this._taskLoaded = true;
      const GroupTasks: IReception[] = [];
      const taskPromises = this.groups.map((group) => {
        return group.resource.publicTaskReceptionColl.loadSpace({
          options: {
            match: {
              isDeleted: false,
              receiveUserId: this.userId,
              'content.treeNode.belongId': this.id,
              sessionId: group.id,
            },
          },
        });
      });
      const taskResults = await Promise.all(taskPromises);
      taskResults.forEach((res) => {
        GroupTasks.push(...this.convert(res));
      });
      this.groupTask = GroupTasks;
    }
    return this.groupTask;
  }
}

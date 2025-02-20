import { schema, kernel, model } from '../../../base';
import { OperateType, TargetType } from '../../public/enums';
import { orgAuth } from '../../public/consts';
import { IBelong } from './belong';
import { Entity, IEntity, entityOperates } from '../../public';
import { ISession } from '../../chat/session';
import { IPerson } from '../person';
import { logger, sleep } from '@/ts/base/common';
import TargetResources from './resource';
import { IFile } from '../..';

/** 团队抽象接口类 */
export interface ITeam extends IEntity<schema.XTarget> {
  /** 当前用户 */
  user: IPerson;
  /** 加载归属组织 */
  space: IBelong;
  /** 是否为我的团队 */
  isMyTeam: boolean;
  /** 成员 */
  members: schema.XTarget[];
  /** 成员总数 */
  memberCount: number;
  /** 搜索成员总数 */
  memberFilterCount: number;
  /** 限定成员类型 */
  memberTypes: TargetType[];
  /** 成员会话 */
  memberChats: ISession[];
  /** 关系 */
  relations: string[];
  /** 获取成员会话 */
  findChat(id: string): ISession | undefined;
  /** 深加载 */
  deepLoad(reload?: boolean): Promise<void>;
  /** 加载成员 */
  loadMembers(reload?: boolean, filter?: string): Promise<schema.XTarget[]>;
  /** 创建用户 */
  createTarget(data: model.TargetModel): Promise<ITeam | undefined>;
  /** 更新团队信息 */
  update(data: model.TargetModel): Promise<boolean>;
  /** 删除(注销)团队 */
  delete(notity?: boolean): Promise<boolean>;
  /** 删除(注销)团队 */
  hardDelete(notity?: boolean): Promise<boolean>;
  /** 用户拉入新成员 */
  pullMembers(members: schema.XTarget[], notity?: boolean): Promise<boolean>;
  /** 用户移除成员 */
  removeMembers(members: schema.XTarget[], notity?: boolean): Promise<boolean>;
  /** 是否有管理数据的权限 */
  hasDataAuth(): boolean;
  /** 是否有管理关系的权限 */
  hasRelationAuth(): boolean;
  /** 是否有超管的权限 */
  hasSuperAuth(): boolean;
  /** 判断是否拥有某些权限 */
  hasAuthoritys(authIds: string[]): boolean;
  /** 发送组织变更消息 */
  sendTargetNotity(
    operate: OperateType,
    sub?: schema.XTarget,
    subTargetId?: string,
  ): Promise<boolean>;
}

/** 团队基类实现 */
export abstract class Team extends Entity<schema.XTarget> implements ITeam {
  constructor(
    _keys: string[],
    _metadata: schema.XTarget,
    _relations: string[],
    _memberTypes: TargetType[] = [TargetType.Person],
  ) {
    super(_metadata, [_metadata.typeName]);
    this.memberTypes = _memberTypes;
    this.relations = _relations;
    kernel.subscribe(
      `${_metadata.belongId}-${_metadata.id}-target`,
      [..._keys, this.key],
      (data) => this._receiveTarget(data),
    );
  }
  memberFilter: string = '';
  memberFilterCount: number = 0;
  memberCount: number = 0;
  memberTypes: TargetType[];
  memberChats: ISession[] = [];
  relations: string[];
  get superior(): IFile {
    return this.space;
  }
  get isMyTeam(): boolean {
    return (
      this.id === this.userId ||
      this.typeName === TargetType.Group ||
      this.hasDataAuth() ||
      this.hasRelationAuth() ||
      this.hasSuperAuth() ||
      this.user.hasJoinedTeam(this.id)
    );
  }
  findChat(id: string): ISession | undefined {
    return this.memberChats.find((i) => i.id === id);
  }
  get members(): schema.XTarget[] {
    return TargetResources.members(this.id);
  }
  get groupTags(): string[] {
    if (this.id === this.userId) {
      return ['本人'];
    }
    const gtags: string[] = [...super.groupTags];
    if (this.metadata.belongId !== this.space.id) {
      gtags.push(this.user.findShareById(this.belongId).name);
    }
    return gtags;
  }
  async loadMembers(reload: boolean = false, filter?: string): Promise<schema.XTarget[]> {
    if (this.isMyTeam) {
      if (reload || (filter ?? '') != this.memberFilter) {
        TargetResources.clear(this.id);
        this.memberFilter = filter ?? '';
      }
      const part = await this.getPartMembers(this.members.length, 30);
      TargetResources.pullMembers(this.id, part.result || []);
      this.members.forEach((i) => this.updateMetadata(i));
      if (this.memberFilter === '') {
        this.memberCount = part.total ?? 0;
      }
      this.memberFilterCount = part.total ?? 0;
      return part.result;
    }
    return [];
  }
  async pullMembers(
    members: schema.XTarget[],
    notity: boolean = false,
  ): Promise<boolean> {
    members = members
      .filter((i) => this.memberTypes.includes(i.typeName as TargetType))
      .filter((i) => this.members.every((a) => a.id != i.id));
    if (members.length > 0) {
      if (!notity) {
        const res = await kernel.pullAnyToTeam({
          id: this.id,
          subIds: members.map((i) => i.id),
        });
        if (!res.success) return false;
        members.forEach((a) => {
          this.sendTargetNotity(OperateType.Add, a, a.id);
        });
        this.notifySession(true, members);
      }
      TargetResources.pullMembers(this.id, members);
      this.loadMemberChats(members, true);
    }
    return true;
  }
  async removeMembers(
    members: schema.XTarget[],
    notity: boolean = false,
  ): Promise<boolean> {
    members = members
      .filter((i) => this.memberTypes.includes(i.typeName as TargetType))
      .filter((i) => this.members.some((a) => a.id == i.id));
    for (const member of members) {
      if (this.memberTypes.includes(member.typeName as TargetType)) {
        if (!notity) {
          const res = await kernel.removeOrExitOfTeam({
            id: this.id,
            subId: member.id,
          });
          if (!res.success) return false;
          this.sendTargetNotity(OperateType.Remove, member, member.id);
          this.notifySession(false, [member]);
        }
        TargetResources.removeMembers(this.id, [member]);
        this.loadMemberChats([member], false);
      }
    }
    return true;
  }
  protected async create(
    data: model.TargetModel,
    belong: boolean = false,
  ): Promise<schema.XTarget | undefined> {
    if (belong === false) {
      data.belongId = this.space.id;
    }
    data.teamCode = data.teamCode || data.code;
    data.teamName = data.teamName || data.name;
    const res = await kernel.createTarget(data);
    if (res.success && res.data?.id) {
      this.space.user.loadGivedIdentitys(true);
      return res.data;
    }
  }
  async update(data: model.TargetModel): Promise<boolean> {
    data.id = this.id;
    data.typeName = this.typeName;
    data.belongId = this.metadata.belongId;
    data.name = data.name || this.name;
    data.code = data.code || this.code;
    data.icon = data.icon || this.metadata.icon;
    data.teamName = data.teamName || data.name;
    data.teamCode = data.teamCode || data.code;
    data.remark = data.remark || this.remark;
    data.public = data.public ?? true;
    const res = await kernel.updateTarget(data);
    if (res.success && res.data?.id) {
      this.setMetadata(res.data);
      this.sendTargetNotity(OperateType.Update);
    }
    return res.success;
  }
  async delete(notity: boolean = false): Promise<boolean> {
    if (!notity) {
      if (this.hasRelationAuth() && this.id != this.belongId) {
        await this.sendTargetNotity(OperateType.Delete);
      }
      const res = await kernel.deleteTarget({
        id: this.id,
      });
      notity = res.success;
    }
    if (notity) {
      kernel.unSubscribe(this.key);
    }
    return notity;
  }
  async hardDelete(notity: boolean = false): Promise<boolean> {
    return await this.delete(notity);
  }
  async loadContent(reload: boolean = false): Promise<boolean> {
    await this.loadMembers(reload);
    return true;
  }
  operates(): model.OperateModel[] {
    const operates = super.operates();
    if (this.hasRelationAuth()) {
      operates.unshift(entityOperates.Update);
    }
    return operates;
  }
  abstract space: IBelong;
  abstract user: IPerson;
  abstract deepLoad(reload?: boolean): Promise<void>;
  abstract createTarget(data: model.TargetModel): Promise<ITeam | undefined>;
  loadMemberChats(_newMembers: schema.XTarget[], _isAdd: boolean): void {
    this.memberChats = [];
  }
  hasDataAuth(): boolean {
    return this.hasAuthoritys([orgAuth.DataAuthId]);
  }
  hasRelationAuth(): boolean {
    return this.hasAuthoritys([orgAuth.RelationAuthId]);
  }
  hasSuperAuth(): boolean {
    return this.hasAuthoritys([orgAuth.SuperAuthId]);
  }
  hasAuthoritys(authIds: string[]): boolean {
    authIds = this.space.superAuth?.loadParentAuthIds(authIds) ?? authIds;
    const orgIds = [this.metadata.belongId, this.id];
    return this.user.authenticate(orgIds, authIds);
  }
  async sendTargetNotity(
    operate: OperateType,
    sub?: schema.XTarget,
    subTargetId?: string,
  ): Promise<boolean> {
    const res = await kernel.dataNotify({
      data: {
        operate,
        target: this.metadata,
        subTarget: sub,
        operater: this.user.metadata,
      },
      flag: 'target',
      onlineOnly: true,
      belongId: this.belongId,
      relations: this.relations,
      onlyTarget: false,
      ignoreSelf: false,
      subTargetId: subTargetId,
      targetId: this.id,
      targetType: 'target',
    });
    return res.success;
  }

  async _receiveTarget(data: model.TargetOperateModel) {
    if (this.isMyTeam) {
      let message = '';
      switch (data.operate) {
        case OperateType.Delete:
          message = `${data.operater.name}将${data.target.name}删除.`;
          this.delete(true);
          break;
        case OperateType.Update:
          message = `${data.operater.name}将${data.target.name}信息更新.`;
          this.setMetadata(data.target);
          break;
        case OperateType.Remove:
          if (data.subTarget) {
            if (this.id == data.target.id && data.subTarget.id != this.space.id) {
              if (this.memberTypes.includes(data.subTarget.typeName as TargetType)) {
                message = `${data.operater.name}把${data.subTarget.name}从${data.target.name}移除.`;
                await this.removeMembers([data.subTarget], true);
              }
            } else {
              message = await this._removeJoinTarget(data.target);
            }
          }
          break;
        case OperateType.Add:
          if (data.subTarget) {
            if (this.id == data.target.id) {
              if (this.memberTypes.includes(data.subTarget.typeName as TargetType)) {
                message = `${data.operater.name}把${data.subTarget.name}与${data.target.name}建立关系.`;
                await this.pullMembers([data.subTarget], true);
              } else {
                message = await this._addSubTarget(data.subTarget);
              }
            } else {
              message = await this._addJoinTarget(data.target);
            }
          }
          break;
      }
      if (message.length > 0) {
        if (data.operater.id != this.user.id) {
          logger.info(message);
        }
      }
      this.changCallback();
    }
  }
  async _removeJoinTarget(_: schema.XTarget): Promise<string> {
    await sleep(0);
    return '';
  }
  async _addSubTarget(_: schema.XTarget): Promise<string> {
    await sleep(0);
    return '';
  }
  async _addJoinTarget(_: schema.XTarget): Promise<string> {
    await sleep(0);
    return '';
  }
  async notifySession(_: boolean, __: schema.XTarget[]): Promise<void> {
    await sleep(0);
  }
  async getPartMembers(offset: number, limit: number = 2000, memberTypes: TargetType[] = this.memberTypes, memberFilter: string = this.memberFilter): Promise<model.PageResult<schema.XTarget>> {
    const res = await kernel.querySubTargetById({
      id: this.id,
      subTypeNames: memberTypes,
      page: {
        offset: offset,
        limit: limit,
        filter: memberFilter,
      },
    });
    return res.data || { offset: offset, limit: 2000, result: [] };
  }
}

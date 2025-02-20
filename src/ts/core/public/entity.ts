import { Emitter } from '../../base/common';
import { schema, model, parseAvatar, kernel } from '../../base';
import { generateUuid } from '../../base/common/uuid';
import { entityOperates } from './operates';
/** 默认实体类接口 */
export interface IDEntity extends IEntity<schema.XEntity> {}
/** 共享信息数据集 */
export const ShareIdSet = new Map<string, any>();
/** 实体类接口 */
export interface IEntity<T> extends Emitter {
  /** 实体唯一键 */
  key: string;
  /** 唯一标识 */
  id: string;
  /** 实体名称 */
  name: string;
  /** 实体编号 */
  code: string;
  /** 实体类型 */
  typeName: string;
  /** 实体描述 */
  remark: string;
  /** 最后变更时间 */
  updateTime: string;
  /** 提示数量 */
  badgeCount: number;
  /** 数据实体 */
  metadata: T;
  /** 用户ID */
  userId: string;
  /** 归属Id */
  belongId: string;
  /** 共享信息 */
  share: model.ShareIcon;
  /** 创建人 */
  creater: model.ShareIcon;
  /** 变更人 */
  updater: model.ShareIcon;
  /** 归属 */
  belong: model.ShareIcon;
  /** 是否快捷方式 */
  isShortcut: boolean;
  /** 分组标签 */
  groupTags: string[];
  /** 过滤标签 */
  filterTags: string[];
  /** 查找元数据 */
  findMetadata<U>(id: string): U | undefined;
  /** 更新元数据 */
  updateMetadata<U extends schema.XEntity>(data: U): void;
  /** 设置元数据 */
  setMetadata(_metadata: T): void;
  /**
   * 对实体可进行的操作
   * @param mode 模式,默认为配置模式
   */
  operates(): model.OperateModel[];
}

/** 实体类实现 */
export abstract class Entity<T extends schema.XEntity>
  extends Emitter
  implements IEntity<T>
{
  private _gtags: string[];
  constructor(_metadata: T, gtags: string[]) {
    super();
    this._gtags = gtags;
    this.key = generateUuid();
    this._metadata = _metadata;
    ShareIdSet.set(_metadata.id, _metadata);
  }
  _metadata: T;
  key: string;

  get id(): string {
    return this._metadata.id;
  }

  /** 是否快捷方式 */
  get isShortcut() {
    return false;
  }
  get name(): string {
    return this.metadata.name ?? '';
  }
  get code(): string {
    return this.metadata.code;
  }
  get typeName(): string {
    return this.metadata.typeName;
  }
  get remark(): string {
    return this.metadata.remark ?? '';
  }
  get updateTime(): string {
    return this.metadata.updateTime;
  }
  get metadata(): T {
    if (ShareIdSet.has(this._metadata.id)) {
      return ShareIdSet.get(this._metadata.id);
    }
    return this._metadata;
  }
  get userId(): string {
    return kernel.user!.id;
  }
  get belongId(): string {
    return this._metadata.belongId;
  }
  get share(): model.ShareIcon {
    return this.findShare(this.id);
  }
  get creater(): model.ShareIcon {
    return this.findShare(this.metadata.createUser);
  }
  get updater(): model.ShareIcon {
    return this.findShare(this.metadata.updateUser);
  }
  get belong(): model.ShareIcon {
    return this.findShare(this.metadata.belongId);
  }
  get badgeCount(): number {
    return 0;
  }
  get groupTags(): string[] {
    if (
      ('isDeleted' in this._metadata && this._metadata.isDeleted === true) ||
      ('isDeleted' in this.metadata && this.metadata.isDeleted === true)
    ) {
      return ['已删除'];
    }
    return this._gtags;
  }
  get filterTags(): string[] {
    return this.groupTags;
  }
  setMetadata(_metadata: T, force: boolean = false): void {
    if (_metadata.id === this.id || force) {
      this._metadata = _metadata;
      ShareIdSet.set(this.id, _metadata);
      this.changCallback();
    }
  }
  findMetadata<U>(id: string): U | undefined {
    if (ShareIdSet.has(id)) {
      return ShareIdSet.get(id) as U;
    }
    return undefined;
  }
  updateMetadata<U extends schema.XEntity>(data: U): void {
    ShareIdSet.set(data.id, data);
  }
  setEntity(): void {
    ShareIdSet.set(this.id + '*', this);
  }
  getEntity<U>(id: string): U | undefined {
    return ShareIdSet.get(id + '*');
  }
  findShare(id: string): model.ShareIcon {
    const metadata = this.findMetadata<schema.XTarget>(id);
    return {
      name: metadata?.name ?? '加载中...',
      typeName: metadata?.typeName ?? '未知',
      avatar: parseAvatar(metadata?.icon),
    };
  }
  operates(): model.OperateModel[] {
    return [entityOperates.Open, entityOperates.Remark, entityOperates.QrCode];
  }
}

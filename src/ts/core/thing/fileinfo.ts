import { sleep } from '../../base/common';
import { command, model, schema } from '../../base';
import { IDirectory } from './directory';
import { Entity, IEntity, directoryOperates, entityOperates } from '../public';
import { fileOperates } from '../public';
import { XCollection } from '../public/collection';
import { ITarget } from '../target/base/target';
import { IRecorder, Recorder } from './recorder';
import { changeManager } from '../public/operates';
import { IBelong } from '../target/base/belong';

/** 默认文件接口 */
export interface IFile extends IFileInfo<schema.XEntity> {}
/** 文件类接口 */
export interface IFileInfo<T extends schema.XEntity> extends IEntity<T> {
  /** 缓存 */
  cache: schema.XCache;
  /** 空间ID */
  spaceId: string;
  /** 归属ID */
  belongId: string;
  /** 源ID */
  sourceId?: string;
  /** 是否为继承的类别 */
  isInherited: boolean;
  /** 是否允许设计 */
  canDesign: boolean;
  /** 是否为容器 */
  isContainer: boolean;
  /** 目录 */
  directory: IDirectory;
  /** 上级 */
  superior: IFile;
  /** 路径Key */
  locationKey: string;
  /** 路径 */
  path: string[];
  /** 记录者 */
  recorder: IRecorder<T>;
  /** 撤回已删除 */
  restore(): Promise<boolean>;
  /** 删除文件系统项 */
  delete(notity?: boolean): Promise<boolean>;
  /** 彻底删除文件系统项 */
  hardDelete(notity?: boolean): Promise<boolean>;
  /**
   * 重命名
   * @param {string} name 新名称
   */
  rename(name: string): Promise<boolean>;
  /**
   * 拷贝文件系统项（目录）
   * @param {IDirectory} destination 目标文件系统
   */
  copy(destination: IDirectory): Promise<boolean>;
  /**
   * 移动文件系统项（目录）
   * @param {IDirectory} destination 目标文件系统
   */
  move(destination: IDirectory): Promise<boolean>;
  /** 加载文件内容 */
  loadContent(reload?: boolean): Promise<boolean>;
  /** 目录下的内容 */
  content(args?: boolean): IFile[];
  /** 缓存用户数据 */
  cacheUserData(notify?: boolean, isCompany?: boolean): Promise<boolean>;
  /** 常用标签切换 */
  toggleCommon(isCompany?: boolean): Promise<boolean>;
}
/** 文件类抽象实现 */
export abstract class FileInfo<T extends schema.XEntity>
  extends Entity<T>
  implements IFileInfo<T>
{
  constructor(_metadata: T, _directory: IDirectory) {
    super(_metadata, [_metadata.typeName]);
    this.directory = _directory;
    this.cache = { fullId: `${this.spaceId}_${_metadata.id}` };
    this.companyCache = { fullId: `${this.spaceId}_${_metadata.id}` };
    this.recorder = new Recorder<T>(this);
    this.path = [...(_directory?.path ?? []), _metadata.id];
    this.loadUserData(this.target.user, false);
    if (this.userId != this.spaceId) {
      this.loadUserData(this.target.space, true);
    }
  }
  path: string[];
  cache: schema.XCache;
  directory: IDirectory;
  canDesign: boolean = false;
  recorder: IRecorder<T>;
  companyCache: schema.XCache;
  get isInherited(): boolean {
    return this.directory.isInherited;
  }
  get isContainer(): boolean {
    return false;
  }
  get target(): ITarget {
    if (this.directory.typeName.includes('目录')) {
      return this.directory.target;
    } else {
      return this.directory as unknown as ITarget;
    }
  }
  get belongId(): string {
    return this.target.belongId;
  }
  get spaceId(): string {
    return this.target.spaceId;
  }
  get sourceId() {
    return this.metadata.sourceId;
  }
  get locationKey(): string {
    return this.directory.key;
  }
  get cachePath(): string {
    return `${this.cacheFlag}.${this.cache.fullId}`;
  }
  get superior(): IFile {
    return this.directory;
  }
  abstract cacheFlag: string;
  abstract delete(): Promise<boolean>;
  async rename(_: string): Promise<boolean> {
    await sleep(0);
    return true;
  }
  async copy(_: IDirectory): Promise<boolean> {
    await sleep(0);
    return true;
  }
  async move(_: IDirectory): Promise<boolean> {
    await sleep(0);
    return true;
  }
  async restore(): Promise<boolean> {
    await sleep(0);
    return true;
  }
  async hardDelete(): Promise<boolean> {
    await sleep(0);
    return true;
  }
  async loadUserData(space: IBelong, isCompany: boolean): Promise<void> {
    if (!space.cacheObj || !space.cacheObj.loaded) {
      await sleep(100);
      return this.loadUserData(space, isCompany);
    }
    const data = await space.cacheObj.get<schema.XCache>(this.cachePath);
    if (data && data.fullId === this.cache.fullId) {
      if (isCompany) {
        this.companyCache = data;
      } else {
        this.cache = data;
      }
    }
    space.cacheObj.subscribe(this.cachePath, (data: schema.XCache) => {
      if (data && data.fullId === this.cache.fullId) {
        if (isCompany) {
          this.companyCache = data;
        } else {
          this.cache = data;
        }
        space.cacheObj.setValue(this.cachePath, data);
        this.superior.changCallback();
        command.emitterFlag(this.cacheFlag);
      }
    });
  }
  async cacheUserData(
    notify: boolean = true,
    isCompany: boolean = false,
  ): Promise<boolean> {
    const cache = isCompany ? this.companyCache : this.cache;
    const target = isCompany ? this.target.space : this.target.user;
    const success = await target.cacheObj.set(this.cachePath, cache);
    if (success && notify) {
      await target.cacheObj.notity(this.cachePath, cache, true, false);
    }
    return success;
  }

  public async toggleCommon(isCompany: boolean = false): Promise<boolean> {
    let set: boolean = false;
    const tags = (isCompany ? this.companyCache.tags : this.cache.tags) ?? [];
    const target = isCompany ? this.target.space : this.target.user;
    if (tags.includes('常用')) {
      if (isCompany) {
        this.companyCache.tags = tags.filter((i) => i != '常用');
      } else {
        this.cache.tags = tags.filter((i) => i != '常用');
      }
    } else {
      if (isCompany) {
        this.companyCache.tags = [...tags, '常用'];
      } else {
        this.cache.tags = [...tags, '常用'];
      }
      set = true;
    }
    const success = await this.cacheUserData(true, isCompany);
    if (success) {
      return await target.updateCommon(
        {
          id: this.id,
          spaceId: this.spaceId,
          targetId: this.target.id,
          directoryId: this.directory.id,
          applicationId: this.superior.id,
          groupName: '',
          typeName: this.typeName,
        },
        set,
      );
    }
    return false;
  }

  async loadContent(reload: boolean = false): Promise<boolean> {
    return await sleep(reload ? 10 : 0);
  }
  content(): IFile[] {
    return [];
  }
  operates(): model.OperateModel[] {
    const operates = super.operates();
    operates.unshift(fileOperates.Copy);
    if (this.target.hasRelationAuth()) {
      operates.unshift(
        fileOperates.Move,
        fileOperates.Rename,
        fileOperates.Download,
        entityOperates.Update,
        entityOperates.Delete,
      );
      if (this.canDesign) {
        operates.unshift(entityOperates.Design);
      }
    }
    return operates;
  }
}
export interface IStandardFileInfo<T extends schema.XStandard> extends IFileInfo<T> {
  /** 归属组织key */
  spaceKey: string;
  /** 设置当前元数据 */
  setMetadata(_metadata: schema.XStandard): void;
  /** 变更通知 */
  notify(operate: string, data: T): Promise<boolean>;
  /** 更新 */
  update(data: T): Promise<boolean>;
  /** 接收通知 */
  receive(operate: string, data: schema.XStandard): boolean;
  /** 创建快捷方式 */
  createShortcut(newName?: string): Promise<boolean>;
}

export interface IStandard extends IStandardFileInfo<schema.XStandard> {}
export abstract class StandardFileInfo<T extends schema.XStandard>
  extends FileInfo<T>
  implements IStandardFileInfo<T>
{
  coll: XCollection<T>;
  constructor(_metadata: T, _directory: IDirectory, _coll: XCollection<T>) {
    super(_metadata, _directory);
    this.coll = _coll;
  }
  get spaceKey(): string {
    return this.directory.target.space.directory.key;
  }
  abstract copy(destination: IDirectory): Promise<boolean>;
  abstract move(destination: IDirectory): Promise<boolean>;
  override get metadata(): T {
    return this._metadata;
  }
  allowCopy(destination: IDirectory): boolean {
    return this.isSpanBelong(destination);
  }
  allowMove(destination: IDirectory): boolean {
    return destination.id != this.directory.id && this.isSameBelong(destination);
  }
  isSameBelong(destination: IDirectory) {
    if (this.target.belongId == destination.target.belongId) {
      let thisStoreId = this.target.storeId || this.target.space.storeId;
      let destStoreId = destination.target.storeId || destination.target.space.storeId;
      return thisStoreId == destStoreId;
    }
    return false;
  }
  isSpanBelong(destination: IDirectory) {
    return !this.isSameBelong(destination);
  }
  async update(data: T): Promise<boolean> {
    const result = await this.coll.replace({
      ...this.metadata,
      ...data,
      directoryId: this.metadata.directoryId,
      typeName: this.metadata.typeName,
    });
    if (result) {
      await this.recorder.update({ coll: this.coll, next: result });
      await this.notify('replace', result);
      return true;
    }
    return false;
  }
  async delete(notify: boolean = true): Promise<boolean> {
    if (this.directory) {
      const data = await this.coll.delete(this.metadata);
      if (data) {
        await this.recorder.update({
          coll: this.coll,
          next: { ...this.metadata, isDeleted: true },
          notify,
        });
        if (notify) {
          await this.notify('delete', this.metadata);
        }
      }
    }
    return false;
  }
  async hardDelete(notify: boolean = true): Promise<boolean> {
    if (this.directory) {
      const data = await this.coll.remove(this.metadata);
      if (data) {
        await this.recorder.remove({ coll: this.coll, next: this.metadata, notify });
        if (notify) {
          await this.notify('remove', this.metadata);
        }
      }
    }
    return false;
  }
  async restore(): Promise<boolean> {
    return this.update({ ...this.metadata, isDeleted: false });
  }
  async rename(name: string): Promise<boolean> {
    return await this.update({ ...this.metadata, name });
  }
  async copyTo(directoryId: string, coll: XCollection<T> = this.coll): Promise<boolean> {
    const data = await coll.replace({
      ...this.metadata,
      directoryId: directoryId,
    });
    if (data) {
      return await coll.notity({
        data: data,
        operate: 'insert',
      });
    }
    return false;
  }
  async moveTo(dest: IDirectory, coll: XCollection<T> = this.coll): Promise<boolean> {
    const data = await coll.replace({
      ...this.metadata,
      directoryId: dest.id,
    });
    if (data) {
      await this.recorder.moving({
        coll,
        destination: dest,
        next: data,
      });
      await this.notify('remove', this.metadata);
      return await coll.notity({
        data: data,
        operate: 'insert',
      });
    }
    return false;
  }
  async createShortcut(newName?: string): Promise<boolean> {
    const newEntity = { ...this._metadata };
    if (newName) {
      newEntity.name = newName;
    }
    const result = await this.coll.insert({
      ...newEntity,
      id: 'snowId()',
      sourceId: this._metadata.id,
    });
    return await this.coll.notity({
      data: result,
      operate: 'insert',
    });
  }

  override operates(): model.OperateModel[] {
    const operates = super.operates();
    if (this.userId != this.spaceId && this.target.space.hasRelationAuth()) {
      if (
        [
          '应用',
          '模块',
          '办事',
          '集群模板',
          '表单',
          '视图',
          '报表',
          '任务',
          '打印模板',
          '商城模板',
          '目录',
        ].includes(this.typeName)
      ) {
        if (this.companyCache.tags?.includes('常用')) {
          operates.unshift(fileOperates.DelCompanyCommon);
        } else {
          operates.unshift(fileOperates.SetCompanyCommon);
        }
      }
    }
    if (this.cache.tags?.includes('常用')) {
      operates.unshift(fileOperates.DelCommon);
    } else {
      operates.unshift(fileOperates.SetCommon);
    }
    if (this.target.hasRelationAuth()) {
      operates.unshift(changeManager);
    }

    if (this.isShortcut) {
      // 快捷方式不能创建快捷方式和复制
      let i: number;
      if ((i = operates.indexOf(fileOperates.Copy)) >= 0) {
        operates.splice(i, 1);
      }
      if ((i = operates.indexOf(directoryOperates.Shortcut)) >= 0) {
        operates.splice(i, 1);
      }
    }
    return operates;
  }
  async notify(operate: string, data: T): Promise<boolean> {
    return await this.coll.notity({ data, operate });
  }
  receive(operate: string, data: schema.XStandard): boolean {
    switch (operate) {
      case 'delete':
      case 'replace':
        if (data) {
          if (operate === 'delete') {
            data = { ...data, isDeleted: true } as unknown as T;
            this.setMetadata(data as T);
          } else {
            this.setMetadata(data as T);
            this.loadContent(true);
          }
        }
    }
    return true;
  }
}

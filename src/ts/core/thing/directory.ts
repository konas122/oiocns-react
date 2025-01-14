import { common, model, schema } from '../../base';
import { directoryNew, directoryOperates, entityOperates, fileOperates } from '../public';
import { ITarget } from '../target/base/target';
import { IFile } from './fileinfo';
import { StandardFiles } from './standard';
import { IApplication } from './standard/application';
import { IPrint } from './standard/print';
import { BucketOpreates, FileItemModel } from '@/ts/base/model';
import { encodeKey, formatDate, sleep } from '@/ts/base/common';
import { DataResource } from './resource';
import { ISysFileInfo, SysDirectoryInfo, SysFileInfo } from './systemfile';
import { IPageTemplate } from './standard/page';
import { Recorder } from './recorder';
import { Container, IContainer } from './container';
import { IDocumentTemplate } from './standard/document';

/** 可为空的进度回调 */
export type OnProgress = (p: number, key?: string) => void;

/** 目录接口类 */
export interface IDirectory extends IContainer<schema.XDirectory> {
  /** 真实的目录Id */
  directoryId: string;
  /** 目录下标准类 */
  standard: StandardFiles;
  /** 当前加载目录的用户 */
  target: ITarget;
  /** 资源类 */
  resource: DataResource;
  /** 上级目录 */
  parent: IDirectory | undefined;
  /** 文件目录 */
  sysDirectory: SysDirectoryInfo;
  /** 下级文件系统项数组 */
  children: IDirectory[];
  /** 是否有权限 */
  isAuth: boolean;
  /** 目录下的内容 */
  content(store?: boolean): IFile[];
  /** 创建子目录 */
  create(data: schema.XDirectory): Promise<schema.XDirectory | undefined>;
  /** 目录下的文件 */
  files: ISysFileInfo[];
  /** 是否快捷方式 */
  isShortcut: boolean;
  /** 上传任务列表 */
  taskList: model.TaskModel[];
  /** 任务发射器 */
  taskEmitter: common.Emitter;
  /** 加载所有表单，报表，视图的属性 */
  load(): Promise<boolean>;
  /** 加载文件 */
  loadFiles(reload?: boolean): Promise<ISysFileInfo[]>;
  /** 加载模板配置 */
  loadAllTemplate(): Promise<IPageTemplate[]>;
  /** 加载全部应用 */
  loadAllApplication(): Promise<IApplication[]>;
  /** 加载全部打印模板 */
  loadAllPrints(): Promise<IPrint[]>;
  /** 加载全部文档模板 */
  loadAllDocument(): Promise<IDocumentTemplate[]>;
  /** 加载全部目录 */
  loadAllDirectory(): Promise<IDirectory[]>;
  /** 加载目录资源 */
  loadDirectoryResource(reload?: boolean): Promise<void>;
  /** 通知重新加载文件列表 */
  notifyReloadFiles(): Promise<boolean>;
  /** 搜索文件 */
  searchFile(
    directoryId: string,
    applicationId: string,
    id: string,
    key?: 'id' | 'sourceId' | 'or',
  ): Promise<IFile | undefined>;
  /** 搜索常用文件 */
  searchComment(commont: schema.XCommon): Promise<IFile | undefined>;
  /** 上传文件 */
  createFile(name: string, file: Blob, p?: OnProgress): Promise<ISysFileInfo | undefined>;
}

/** 目录实现类 */
export class Directory extends Container<schema.XDirectory> implements IDirectory {
  private fileLoaded: boolean = false;
  constructor(
    _metadata: schema.XDirectory,
    _target: ITarget,
    _parent?: IDirectory,
    _directorys?: schema.XDirectory[],
  ) {
    super(
      {
        ..._metadata,
        typeName: _metadata.typeName || '目录',
      },
      _parent ?? (_target as unknown as IDirectory),
      _target.resource.directoryColl,
    );
    this.parent = _parent;
    this.standard = new StandardFiles(this);
    this.recorder = new Recorder<schema.XDirectory>(this);
    this.sysDirectory = new SysDirectoryInfo(this, '文件夹');
  }
  standard: StandardFiles;
  parent: IDirectory | undefined;
  files: ISysFileInfo[] = [];
  sysDirectory: SysDirectoryInfo;
  accepts: string[] = [
    '目录',
    '文件',
    '应用',
    '办事',
    '模块',
    '表单',
    '视图',
    '属性',
    '字典',
    '分类',
    '报表',
    '打印模板',
    '文档模板',
    '报表树',
    '迁移',
    '任务',
    '页面模板',
    '商城模板'
  ];
  get isContainer(): boolean {
    return true;
  }
  get cacheFlag(): string {
    return 'directorys';
  }
  get isShortcut() {
    return this.metadata.sourceId != undefined;
  }
  get superior(): IFile {
    return this.parent ?? this.target.superior.directory;
  }
  get taskList(): model.TaskModel[] {
    return this.sysDirectory.taskList;
  }
  get taskEmitter(): common.Emitter {
    return this.sysDirectory.taskEmitter;
  }
  get groupTags(): string[] {
    let tags: string[] = [];
    if (this.parent) {
      tags = [...super.groupTags];
    } else {
      tags = [this.target.typeName];
    }
    const item = this.target.space.manager.find(this.id);
    if (item) {
      tags.push('已订阅');
      if (this.target.belongId == item.manager.space.id && item.remainder > 0) {
        tags.push('可更新');
      }
    }
    return tags;
  }
  get spaceKey(): string {
    return this.target.space.directory.key;
  }
  get children(): IDirectory[] {
    return this.standard.directorys;
  }
  get id(): string {
    if (!this.parent) {
      return this.target.id;
    }
    return super.id;
  }
  get directoryId(): string {
    return this.metadata.sourceId ?? this.id;
  }
  get isInherited(): boolean {
    return this.target.isInherited;
  }
  get locationKey(): string {
    return this.key;
  }
  get resource(): DataResource {
    return this.target.resource;
  }
  get isAuth(): boolean {
    if (!this._metadata.applyAuths?.length || this._metadata.applyAuths[0] === '0') return true;
    return this.target.hasAuthoritys(this._metadata.applyAuths);
  }
  content(_store: boolean = false): IFile[] {
    const cnt: IFile[] = [...this.children];
    cnt.push(...this.standard.forms);
    cnt.push(...this.standard.reports);
    cnt.push(...this.standard.views);
    cnt.push(...this.standard.print);
    cnt.push(...this.standard.applications);
    cnt.push(...this.standard.propertys);
    cnt.push(...this.standard.specieses);
    cnt.push(...this.standard.transfers);
    cnt.push(...this.standard.templates);
    cnt.push(...this.standard.documents);
    cnt.push(...this.standard.reportTrees);
    cnt.push(...this.standard.distributionTasks);
    if (this.files.length > 0) {
      if (cnt.length > 0) {
        cnt.unshift(this.sysDirectory);
      } else {
        cnt.push(...this.files);
      }
    }
    if (this.metadata.sorts) {
      const map = new Map(this.metadata.sorts.map((sort) => [sort.id, sort.sort]));
      return cnt.sort((f, n) => (map.get(f.id) || 0) - (map.get(n.id) || 0));
    }
    return cnt.sort((a, b) => (a.metadata.updateTime < b.metadata.updateTime ? 1 : -1));
  }
  async loadContent(reload: boolean = false): Promise<boolean> {
    if (reload) {
      await this.loadDirectoryResource(reload);
    }
    await this.loadFiles(reload);
    await this.standard.loadStandardFiles(reload);
    return true;
  }
  async load(): Promise<boolean> {
    await this.standard.loadStandardFiles(true);
    try {
      await Promise.all(
        this.standard.standardFiles.map(async (file: any) => {
          await file.load();
        }),
      );
      return true;
    } catch (error) {
      return false;
    }
  }
  override async copy(destination: IDirectory): Promise<boolean> {
    if (this.allowCopy(destination)) {
      var isSameBelong = this.isSameBelong(destination);
      var id = this.id;
      var name = this.metadata.name;
      var code = this.metadata.code;
      if (isSameBelong) {
        id = 'snowId()';
        const uuid = formatDate(new Date(), 'yyyyMMddHHmmss');
        name = this.metadata.name + `-副本${uuid}`;
        code = this.metadata.code + uuid;
      }
      const data = await destination.resource.directoryColl.replace({
        ...this.metadata,
        directoryId: destination.id,
        name: name,
        code: code,
        id: id,
      });
      if (data) {
        const directory = new Directory(data, destination.target, destination);
        await this.recursionCopy(this, directory, isSameBelong);
        await destination.notify('reload', data);
      }
    }
    return false;
  }
  override async move(destination: IDirectory): Promise<boolean> {
    if (this.parent && this.allowMove(destination)) {
      const data = await destination.resource.directoryColl.replace({
        ...this.metadata,
        directoryId: destination.id,
      });
      if (data) {
        await this.recursionMove(this, destination.resource);
        await this.notify('remove', this._metadata);
        await destination.notify('reload', data);
      }
    }
    return false;
  }
  override async delete(): Promise<boolean> {
    if (this.parent) {
      await this.resource.directoryColl.delete(this.metadata);
      await this.recorder.update({
        coll: this.resource.directoryColl,
        next: { ...this.metadata, isDeleted: true },
      });
      await this.notify('delete', this.metadata);
    }
    return false;
  }
  override async hardDelete(): Promise<boolean> {
    if (this.parent) {
      await this.resource.directoryColl.remove(this.metadata);
      await this.recursionDelete(this);
      await this.recorder.remove({
        coll: this.resource.directoryColl,
        next: this.metadata,
      });
      await this.notify('reload', this.metadata);
    }
    return false;
  }
  async create(data: schema.XDirectory): Promise<schema.XDirectory | undefined> {
    const result = await this.resource.directoryColl.insert({
      ...data,
      typeName: '目录',
      directoryId: this.id,
    });
    if (result) {
      await this.recorder.creating({ coll: this.resource.directoryColl, next: result });
      await this.notify('insert', result);
      return result;
    }
  }
  async loadFiles(reload: boolean = false): Promise<ISysFileInfo[]> {
    if (this.fileLoaded === false || reload) {
      this.fileLoaded = true;
      const res = await this.resource.bucketOpreate<FileItemModel[]>({
        key: encodeKey(this.directoryId),
        operate: BucketOpreates.List,
      });
      if (res.success) {
        this.files = (res.data || [])
          .filter((i) => !i.isDirectory)
          .map((item) => {
            return new SysFileInfo(item, this.sysDirectory);
          });
      }
      // 查询是否包含引用文件
      const fileLinks = this.resource.fileLinkColl.cache.filter(
        (i) => i.directoryId === this.id,
      );
      if (Array.isArray(fileLinks) && fileLinks.length > 0) {
        const linkFiles = fileLinks.map((item) => {
          return new SysFileInfo(item, this.sysDirectory);
        });
        this.files.push(...linkFiles);
      }
    }
    return this.files;
  }
  async loadAllApplication(): Promise<IApplication[]> {
    const applications = [];
    for (const item of await this.loadAllDirectory()) {
      applications.push(...(await item.standard.loadApplications()));
    }
    return applications;
  }
  async loadAllPrints(): Promise<IPrint[]> {
    const prints = [];
    for (const item of await this.loadAllDirectory()) {
      prints.push(...(await item.standard.loadPrints()));
    }
    return prints;
  }
  async loadAllDocument(): Promise<IDocumentTemplate[]> {
    const prints = [];
    for (const item of await this.loadAllDirectory()) {
      prints.push(...(await item.standard.loadDocuments()));
    }
    return prints;
  }
  async loadAllTemplate(): Promise<IPageTemplate[]> {
    const templates: IPageTemplate[] = [];
    for (const item of await this.loadAllDirectory()) {
      templates.push(...(await item.standard.loadTemplates()));
    }
    return templates;
  }
  async loadAllDirectory(reload: boolean = false): Promise<IDirectory[]> {
    if (this.parent === undefined) {
      await this.resource.preLoad(reload);
      await this.standard.loadDirectorys();
    }
    const directories: IDirectory[] = [this];
    for (const item of this.children) {
      directories.push(...(await item.loadAllDirectory()));
    }
    return directories;
  }
  async createFile(
    name: string,
    file: Blob,
    p?: OnProgress,
  ): Promise<ISysFileInfo | undefined> {
    while (this.sysDirectory.taskList.filter((i) => i.finished < i.size).length > 2) {
      await sleep(1000);
    }
    p?.apply(this, [0]);
    const task: model.TaskModel = {
      name: name,
      finished: 0,
      size: file.size,
      createTime: new Date(),
    };
    this.sysDirectory.taskList.push(task);
    const data = await this.resource.fileUpdate(file, `${this.id}/${name}`, (pn) => {
      task.finished = pn;
      p?.apply(this, [Number(((pn / file.size) * 100).toFixed(2)), `${this.id}/${name}`]);
      this.sysDirectory.taskEmitter.changCallback();
    });
    if (data) {
      const file = new SysFileInfo(data, this.sysDirectory);
      this.files.push(file);
      return file;
    }
  }
  async searchComment(commont: schema.XCommon): Promise<IFile | undefined> {
    if (this.id === commont.directoryId) {
      if (commont.applicationId === commont.directoryId) {
        await this.loadContent();
        return [...this.content(), ...this.files].find((i) => i.id === commont.id);
      } else {
        // 加载所有应用，解決初次渲染可能找不到对应file
        await this.standard.loadApplications();
        for (const item of this.standard.applications) {
          const file = await item.searchComment(commont);
          if (file) {
            return file;
          }
        }
      }
    } else {
      for (const item of this.children) {
        const file = await item.searchComment(commont);
        if (file) {
          return file;
        }
      }
    }
  }
  async searchFile(
    directoryId: string,
    applicationId: string,
    id: string,
    key: 'id' | 'sourceId' | 'or' = 'id',
  ): Promise<IFile | undefined> {
    if (this.id === directoryId) {
      if (applicationId === directoryId) {
        await this.loadContent();
        return [...this.content(), ...this.files].find((i) => {
          switch (key) {
            case 'id':
              return i.id == id;
            case 'sourceId':
              return i.sourceId == id;
            case 'or':
              return i.sourceId == id || i.id == id;
          }
        });
      } else {
        await this.loadAllApplication();
        for (const item of this.standard.applications) {
          const file = await item.searchFile(applicationId, id, key);
          if (file) {
            return file;
          }
        }
      }
    } else {
      for (const item of this.children) {
        const file = await item.searchFile(directoryId, applicationId, id, key);
        if (file) {
          return file;
        }
      }
    }
  }
  override operates(): model.OperateModel[] {
    const operates: model.OperateModel[] = [];
    operates.push(
      directoryOperates.Refesh,
      directoryOperates.NewFile,
      directoryOperates.TaskList,
    );
    if (this.target.hasRelationAuth()) {
      if (this.name.includes('业务')) {
        operates.push({
          ...directoryNew,
          menus: [...directoryNew.menus, directoryOperates.Business],
        });
      } else if (this.name.includes('标准')) {
        operates.push({
          ...directoryNew,
          menus: [...directoryNew.menus, directoryOperates.Standard],
        });
      } else {
        operates.push(directoryNew);
      }
      if (this.target.user.copyFiles.size > 0) {
        operates.push(fileOperates.Parse);
      }
    }
    if (this.parent) {
      if (this.target.hasRelationAuth()) {
        operates.push(directoryOperates.Shortcut);
      }
      operates.push(...super.operates());
    } else {
      operates.push(entityOperates.Open);
    }
    if (this.id != this.target.id) {
      const subscribed = this.target.space.manager.find(this.id);
      if (this.target.belongId != this.target.spaceId) {
        if (subscribed) {
          operates.push(directoryOperates.CancelSubscribe);
        } else {
          operates.push(directoryOperates.Subscribe);
        }
      } else {
        if (subscribed) {
          operates.push(directoryOperates.LookSubscribe);
          if (subscribed.remainder > 0) {
            operates.push(directoryOperates.SubscribeUpdate);
          }
        }
      }
    }
    return operates;
  }
  public async loadDirectoryResource(reload: boolean = false) {
    if (this.parent === undefined || reload) {
      await this.resource.preLoad(reload);
    }
    await this.standard.loadDirectorys(reload);
    await this.standard.loadApplications(reload);
  }
  /** 文件夹递归拷贝 */
  private async recursionCopy(
    directory: IDirectory,
    destDirectory: IDirectory,
    isSameBelong: boolean,
  ) {
    if (!this.isShortcut) {
      for (const child of directory.children) {
        const dirData = await destDirectory.resource.directoryColl.replace({
          ...child.metadata,
          id: isSameBelong ? 'snowId()' : child.id,
          directoryId: destDirectory.id,
        });
        if (dirData) {
          const newDirectory = new Directory(
            dirData,
            destDirectory.target,
            destDirectory,
          );
          await this.recursionCopy(child, newDirectory, isSameBelong);
        }
      }
      await directory.standard.copyStandradFile(
        destDirectory.resource,
        destDirectory.id,
        isSameBelong,
      );
      await directory.loadFiles();
      for (const file of await directory.files) {
        await file.copy(destDirectory);
      }
      for (const app of await directory.standard.applications) {
        await app.copy(destDirectory);
      }
    }
  }
  /** 文件夹递归移动 */
  private async recursionMove(directory: IDirectory, to: DataResource) {
    if (!this.isShortcut) {
      for (const child of directory.children) {
        const dirData = await to.directoryColl.replace(child.metadata);
        if (dirData) {
          await this.recursionMove(child, to);
        }
      }
      await directory.standard.moveStandradFile(to);
      for (const app of directory.standard.applications) {
        await app.move(directory);
      }
    }
  }
  private async recursionDelete(directory: IDirectory) {
    if (!this.isShortcut) {
      for (const child of directory.children) {
        await this.recursionDelete(child);
      }
      this.resource.deleteDirectory(directory.id);
      await directory.standard.delete();
    }
  }
  override receive(operate: string, data: schema.XStandard): boolean {
    this.coll.removeCache((i) => i.id != data.id);
    super.receive(operate, data);
    this.coll.cache.push(this._metadata);
    return true;
  }
  async notifyReloadFiles(): Promise<boolean> {
    return await this.notify('reloadFiles', {
      ...this.metadata,
      directoryId: this.id,
    });
  }
}

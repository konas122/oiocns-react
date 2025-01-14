import { common, model, schema } from '@/ts/base';
import { encodeKey, formatDate, formatSize, generateUuid } from '../../base/common';
import { BucketOpreates, FileItemModel, FileItemShare } from '../../base/model';
import { FileInfo, IFile, IFileInfo } from './fileinfo';
import { IDirectory } from './directory';
import { directoryOperates, entityOperates, fileOperates } from '../public';
import { Container, IContainer } from './container';

/** 可为空的进度回调 */
export type OnProgress = (p: number) => void;

/** 文件转实体 */
export const fileToEntity = (
  data: model.FileItemModel,
  directory: schema.XDirectory,
): schema.XStandard => {
  return {
    id: data.shareLink?.substring(1) ?? generateUuid(),
    name: data.name,
    code: data.key,
    status: 0,
    version: directory.version,
    icon: JSON.stringify(data),
    belong: directory.belong,
    belongId: data.belongId ?? directory.belongId,
    shareId: directory.shareId,
    typeName: data.contentType ?? '文件',
    createTime: data.dateCreated,
    updateTime: data.dateModified,
    directoryId: directory.id,
    createUser: directory.createUser,
    updateUser: directory.updateUser,
    isLinkFile: data.isLinkFile,
    remark: `${data.name}(${formatSize(data.size)})`,
    isDeleted: false,
  } as schema.XStandard;
};

/** 系统文件接口 */
export interface ISysFileInfo extends IFileInfo<schema.XEntity> {
  /** 文件系统项对应的目标 */
  filedata: FileItemModel;
  /** 分享信息 */
  shareInfo(): FileItemShare;
  /** 视频切片 */
  hslSplit(): Promise<boolean>;
}

/** 文件类实现 */
export class SysFileInfo extends FileInfo<schema.XEntity> implements ISysFileInfo {
  constructor(
    _metadata: model.FileItemModel,
    _directory: ISysDirectoryInfo,
    _readonly: boolean = false,
  ) {
    super(fileToEntity(_metadata, _directory.directory.metadata), _directory.directory);
    this.filedata = _metadata;
    this.readonly = _readonly;
  }
  readonly: boolean = false;
  get cacheFlag(): string {
    return 'files';
  }
  get groupTags(): string[] {
    const gtags: string[] = [];
    if (this.typeName.startsWith('image')) {
      gtags.push('图片');
    } else if (this.typeName.startsWith('video')) {
      gtags.push('视频');
    } else if (this.typeName.startsWith('text')) {
      gtags.push('文本');
    } else if (this.typeName.includes('pdf')) {
      gtags.push('PDF');
    } else if (this.typeName.includes('office')) {
      gtags.push('Office');
    }
    return [...gtags, '文件'];
  }
  get belongId(): string {
    return this.filedata.belongId ?? this.target.belongId;
  }
  filedata: FileItemModel;
  shareInfo(): model.FileItemShare {
    return {
      size: this.filedata.size,
      name: this.filedata.name,
      poster: this.filedata.poster,
      extension: this.filedata.extension,
      contentType: this.filedata.contentType,
      shareLink: this.filedata.shareLink,
      thumbnail: this.filedata.thumbnail,
    };
  }
  async rename(name: string): Promise<boolean> {
    if (this.filedata.name != name) {
      const res = await this.directory.resource.bucketOpreate<FileItemModel>({
        name: name,
        key: encodeKey(this.filedata.key),
        operate: BucketOpreates.Rename,
      });
      if (res.success && res.data) {
        this.directory.notifyReloadFiles();
        this.filedata = res.data;
        return true;
      }
    }
    return false;
  }
  async delete(): Promise<boolean> {
    if (this.filedata.isLinkFile) {
      return await this.linkFileDelete();
    } else {
      const res = await this.directory.resource.bucketOpreate<FileItemModel[]>({
        key: encodeKey(this.filedata.key),
        operate: BucketOpreates.Delete,
      });
      if (res.success) {
        this.directory.notifyReloadFiles();
        this.directory.files = this.directory.files.filter((i) => i.key != this.key);
      }
      return res.success;
    }
  }
  async linkFileDelete(): Promise<boolean> {
    await this.directory.resource.fileLinkColl.removeMany([
      this.filedata as schema.XFileLink,
    ]);
    await this.directory.resource.fileLinkColl.all(true);
    this.directory.notifyReloadFiles();
    this.directory.files = this.directory.files.filter((i) => i.key != this.key);
    return true;
  }
  async hardDelete(): Promise<boolean> {
    return await this.delete();
  }
  async copy(destination: IDirectory): Promise<boolean> {
    if ('isVirtual' in destination && destination.isVirtual) {
      destination = (destination as unknown as ISysDirectoryInfo).directory;
    }
    if (destination.spaceId !== this.directory.target.belongId) {
      return await this.linkFileCopy(destination);
    } else if (destination.id != this.directory.id) {
      const res = await this.directory.resource.bucketOpreate<FileItemModel[]>({
        key: encodeKey(this.filedata.key),
        destination: destination.id,
        operate: BucketOpreates.Copy,
      });
      if (res.success) {
        destination.notifyReloadFiles();
        destination.files.push(this);
      }
      return res.success;
    }
    return false;
  }
  async linkFileCopy(destination: IDirectory): Promise<boolean> {
    destination = (destination as unknown as ISysDirectoryInfo).directory;
    const params = {
      ...this.filedata,
      belongId: this.belongId,
      directoryId: destination.id,
      name: this.filedata.name,
      typeName: this.typeName,
      dateCreated: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss.S'),
      isLinkFile: true,
      id: 'snowId()',
    } as unknown as schema.XFileLink;
    const data = await destination.resource.fileLinkColl.replace(params);
    if (data) {
      await destination.resource.fileLinkColl.all(true);
      destination.notifyReloadFiles();
    }
    return true;
  }
  async move(destination: IDirectory): Promise<boolean> {
    if ('isVirtual' in destination && destination.isVirtual) {
      destination = (destination as unknown as ISysDirectoryInfo).directory;
    }
    if (destination.id != this.directory.id) {
      const res = await this.directory.resource.bucketOpreate<FileItemModel[]>({
        key: encodeKey(this.filedata.key),
        destination: destination.id,
        operate: BucketOpreates.Move,
      });
      if (res.success) {
        this.directory.notifyReloadFiles();
        this.directory.files = this.directory.files.filter((i) => i.key != this.key);
        this.directory = destination;
        destination.notifyReloadFiles();
        destination.files.push(this);
      }
      return res.success;
    }
    return false;
  }
  async hslSplit(): Promise<boolean> {
    if (this.filedata.contentType?.startsWith('video')) {
      await this.directory.resource.bucketOpreate<boolean>({
        key: encodeKey(this.filedata.key),
        operate: BucketOpreates.HslSplit,
      });
      this.directory.loadFiles(true);
      this.directory.changCallback();
    }
    return false;
  }
  override operates(): model.OperateModel[] {
    if (this.readonly) return [entityOperates.QrCode];
    const operates = super.operates();
    if (operates.includes(entityOperates.Delete)) {
      operates.push(entityOperates.HardDelete);
    }
    if (this.typeName.startsWith('video') && this.target.hasRelationAuth()) {
      operates.push(fileOperates.HslSplit);
    }
    return operates
      .filter((i) => i != entityOperates.Delete)
      .filter((i) => i != entityOperates.Update);
  }
  content(): IFile[] {
    return [];
  }
}

export interface ISysDirectoryInfo extends IContainer<schema.XDirectory> {
  /** 是否为虚拟目录 */
  isVirtual: boolean;
  /** 上传任务列表 */
  taskList: model.TaskModel[];
  /** 任务发射器 */
  taskEmitter: common.Emitter;
  /** 上传文件 */
  createFile(name: string, file: Blob, p?: OnProgress): Promise<ISysFileInfo | undefined>;
}

export class SysDirectoryInfo extends Container<schema.XDirectory> implements ISysDirectoryInfo {
  constructor(directory: IDirectory, name: string) {
    super({ ...directory.metadata, name, id: generateUuid(), typeName: '目录', icon: '' },
      directory, directory.resource.directoryColl);
    this.taskEmitter = new common.Emitter();
  }
  isVirtual: boolean = true;
  cacheFlag: string = '';
  taskEmitter: common.Emitter;
  taskList: model.TaskModel[] = [];
  accepts: string[] = ['文件'];
  get isContainer(): boolean {
    return true;
  }
  get superior(): IFile {
    return this.directory;
  }
  operates(): model.OperateModel[] {
    const operates = [directoryOperates.NewFile,
    directoryOperates.TaskList,
    directoryOperates.Refesh];
    if (this.target.user.copyFiles.size > 0) {
      operates.push(fileOperates.Parse);
    }
    return operates;
  }
  copy(_: IDirectory): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  move(_: IDirectory): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  content(): IFile[] {
    return [...this.directory.files];
  }
  async loadContent(reload?: boolean): Promise<boolean> {
    await this.directory.loadFiles(reload);
    return true;
  }
  async createFile(
    name: string,
    file: Blob,
    p?: OnProgress,
  ): Promise<ISysFileInfo | undefined> {
    return await this.directory.createFile(name, file, p);
  }
}
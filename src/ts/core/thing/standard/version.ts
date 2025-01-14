import { schema } from '../../../base';
import { IDEntity } from '../../public';
import { FileInfo, IFileInfo } from '../fileinfo';
import { sleep } from '../../../base/common';

export interface IVersion<T extends schema.XEntity = schema.XEntity, P = IDEntity>
  extends IFileInfo<T> {
  versionsLoaded: boolean;
  /** 版本列表 */
  _versions: T[];
  /** 是否在用版本 */
  isUsed: boolean;
  /** 获取版本资源信息 */
  load(): Promise<void>;
  /** 获取所有版本 */
  loadAllVersion(reload?: boolean): Promise<P[]>;
  /** 切换到某个版本 */
  switchToVersion(): Promise<boolean>;
  /** 删除某个版本 */
  deleteVersion(): Promise<boolean>;
  /** 获取暂存版本信息 */
  loadUserVersion(): Promise<T | undefined>;
  /** 暂存版本信息 */
  save(): Promise<boolean>;
}

export abstract class Version<T extends schema.XEntity, P extends IDEntity>
  extends FileInfo<T>
  implements IVersion<T, P>
{
  versionsLoaded = false;
  _versions: T[] = [];
  abstract isUsed: boolean;
  abstract load(): Promise<void>;
  abstract loadAllVersion(reload?: boolean): Promise<P[]>;
  abstract switchToVersion(): Promise<boolean>;
  abstract deleteVersion(): Promise<boolean>;
  async loadUserVersion(): Promise<T | undefined> {
    await sleep(0);
    return undefined;
  }
  async save(): Promise<boolean> {
    await sleep(0);
    return true;
  }
}

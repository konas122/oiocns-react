import { schema } from '@/ts/base';
import { FileInfo, IFileInfo } from '../../thing/fileinfo';
import { IDirectory } from '../..';
import { OperateModel } from '@/ts/base/model';
import { entityOperates } from '../../public';
import { IDevCompany } from './company';

/** 开发人员 */
export interface IDevPerson extends IFileInfo<schema.XTarget> {
  /**单位开发者  */
  devCompany: IDevCompany;
}

/** 开发人员 */
export class DevPerson extends FileInfo<schema.XTarget> implements IDevPerson {
  constructor(_metadata: schema.XTarget, _company: IDevCompany) {
    super(_metadata, _company.directory);
    this.devCompany = _company;
  }
  devCompany: IDevCompany;
  get cacheFlag(): string {
    return 'devPerson';
  }
  get superior(): IDevCompany {
    return this.devCompany;
  }
  get groupTags(): string[] {
    return ['人员'];
  }
  async rename(_: string): Promise<boolean> {
    throw new Error('暂不支持.');
  }
  async copy(_: IDirectory): Promise<boolean> {
    throw new Error('暂不支持.');
  }
  async move(_: IDirectory): Promise<boolean> {
    throw new Error('暂不支持.');
  }
  async delete(): Promise<boolean> {
    throw new Error('暂不支持.');
  }
  async hardDelete(): Promise<boolean> {
    throw new Error('暂不支持.');
  }
  override operates(): OperateModel[] {
    return [entityOperates.Remark, entityOperates.QrCode];
  }
}

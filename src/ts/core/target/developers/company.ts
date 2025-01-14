import { kernel, schema } from '@/ts/base';
import { IFile } from '../../thing/fileinfo';
import { IContainer, IDirectory, IPerson, ISysFileInfo } from '../..';
import { BucketOpreates, FileItemModel, OperateModel } from '@/ts/base/model';
import { PageAll, entityOperates } from '../../public';
import { IDevPerson } from './person';
import { SysFileInfo } from '../../thing/systemfile';
import { encodeKey } from '@/ts/base/common';
import { Container } from '../../thing/container';

/** 单位开发者 */
export interface IDevCompany extends IContainer<schema.XDeveloper> {
  /** 得分 */
  score: number;
  /** 开发人员 */
  members: IDevPerson[];
  /** 文件 */
  files: ISysFileInfo[];
}

/** 单位开发者 */
export class DevCompany extends Container<schema.XDeveloper> implements IDevCompany {
  constructor(_metadata: schema.XDeveloper, _user: IPerson) {
    super(_metadata, _user.directory, _user.directory.resource.genColl('developer'));
    this.dev = _metadata.dev;
  }
  dev: number;
  files: ISysFileInfo[] = [];
  members: IDevPerson[] = [];
  get score(): number {
    return this.dev;
  }
  get cacheFlag(): string {
    return 'devCompany';
  }
  get groupTags(): string[] {
    return ['单位'];
  }
  content(): IFile[] {
    return [...this.files];
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
  override async loadContent(reload: boolean = false): Promise<boolean> {
    if (this.files.length < 1 || reload) {
      const res = await kernel.bucketOperate<FileItemModel[]>(
        '358221262448889856',
        '358221262448889856',
        ['358221262448889856'],
        {
          key: encodeKey(this._metadata.devId),
          operate: BucketOpreates.List,
        },
      );
      if (res.success) {
        this.files = (res.data || [])
          .filter((i) => !i.isDirectory)
          .map((item) => {
            return new SysFileInfo(item, this.directory.sysDirectory, true);
          });
      }
    }
    return true;
  }
  override operates(): OperateModel[] {
    return [entityOperates.Remark, entityOperates.QrCode];
  }
}

export const loadDevCompanys = async (_user: IPerson) => {
  const result = await kernel.queryTargetById({
    ids: testData.map((i) => i.id),
    page: PageAll,
  });
  if (result.success && Array.isArray(result.data?.result)) {
    return result.data.result.map((item) => {
      const data = testData.find((i) => i.id === item.id)!;
      return new DevCompany(
        {
          ...item,
          dev: data.dev,
          devId: data.devId,
          sorts: [],
          directoryId: data.devId,
          isDeleted: false,
        },
        _user,
      );
    });
  }
  return [];
};

const testData = [
  {
    id: '445967867377225728',
    dev: 1180,
    devId: '550442186420920321',
  },
  {
    id: '499615987113529344',
    dev: 152,
    devId: '550421607072538625',
  },
  {
    id: '446719087343702016',
    dev: 178,
    devId: '550423955702423553',
  },
  {
    id: '464370475766779904',
    dev: 52,
    devId: '550449108243062785',
  },
  {
    id: '446268505713676288',
    dev: 35,
    devId: '550427315566419969',
  },
  {
    id: '570972458463666176',
    dev: 28,
    devId: '550442995346972673',
  },
  {
    id: '445720097923928064',
    dev: 9,
    devId: '550424927589769217',
  },
  {
    id: '607246718731431936',
    dev: 6,
    devId: '607246718731431936',
  },
  {
    id: '528568707522371584',
    dev: 2,
    devId: '528568707522371584',
  },
  {
    id: '646400003006455808',
    dev: 0,
    devId: '646400003006455808',
  },
  {
    id: '586146006769487872',
    dev: 0,
    devId: '586146006769487872',
  },
  {
    id: '577798780762591232',
    dev: 0,
    devId: '577798780762591232',
  },
  {
    id: '445877108401639424',
    dev: 0,
    devId: '550442805416304641',
  },
];

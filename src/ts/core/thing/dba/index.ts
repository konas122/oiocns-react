import { IStorage, XCollection } from '../..';
import { schema, model, kernel } from '../../../base';

export interface PageParams {
  take: number;
  skip: number;
}

export interface IDataManager {
  /** 数据核 */
  store: IStorage;
  /** 集合 */
  definedColl: XCollection<schema.XDefinedColl>;
  /** 创建集合 */
  createColl(coll: schema.XDefinedColl): Promise<schema.XDefinedColl | undefined>;
  /** 删除集合 */
  removeColl(coll: schema.XDefinedColl): Promise<boolean>;
  /** 加载自定义集合 */
  loadDefinedColl(args: PageParams): Promise<model.LoadResult<schema.XDefinedColl[]>>;
  /** 加载所有集合 */
  loadCollections(belongId: string): Promise<string[]>;
  /** 发送命令 */
  runCommand(command: model.Command): Promise<any>;
}

export class DataManager implements IDataManager {
  constructor(_store: IStorage) {
    this.store = _store;
    this.definedColl = _store.space.resource.genColl('standard-defined-coll');
  }

  store: IStorage;
  definedColl: XCollection<schema.XDefinedColl>;

  async createColl(coll: schema.XDefinedColl): Promise<schema.XDefinedColl | undefined> {
    coll.id = 'formdata-' + coll.id;
    if (!/^[_a-z-0-9]{5,30}$/.test(coll.id)) {
      throw new Error("集合名称必须是长度为5~30个字符的小写英文字母、数字或('-','_')!");
    }
    return await this.definedColl.replace(coll);
  }

  async removeColl(coll: schema.XDefinedColl): Promise<boolean> {
    return await this.definedColl.remove(coll);
  }

  async loadDefinedColl(
    args: PageParams,
  ): Promise<model.LoadResult<schema.XDefinedColl[]>> {
    return await this.definedColl.loadResult({
      ...args,
      requireTotalCount: true,
    });
  }

  async loadCollections(belongId: string): Promise<string[]> {
    const result = await kernel.collectionList(belongId, belongId, []);
    if (result.success) {
      return Object.keys(result.data as any);
    }
    return [];
  }

  async runCommand(command: model.Command): Promise<any> {
    switch (command.type) {
      case 'collection':
        switch (command.cmd) {
          case 'clear': {
            const coll = this.store.space.resource.genColl(command.params.collName);
            await coll.removeMatch({ belongId: this.store.space.id });
            break;
          }
        }
        break;
    }
  }
}

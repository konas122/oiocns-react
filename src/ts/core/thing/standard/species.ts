import { schema } from '../../../base';
import { IDirectory } from '../directory';
import { LoadResult } from '@/ts/base/model';
import { IStandardFileInfo, StandardFileInfo } from '../fileinfo';
import { ITarget } from '@/ts/core';

/** 元数据分类接口 */
export interface ISpecies extends IStandardFileInfo<schema.XSpecies> {
  /** 类目项 */
  items: schema.XSpeciesItem[];
  /** 当前加载分类的用户*/
  target: ITarget;
  /** 加载类目项 */
  loadItems(reload?: boolean): Promise<schema.XSpeciesItem[]>;
  /** 新增类目项 */
  createItem(data: schema.XSpeciesItem): Promise<schema.XSpeciesItem | undefined>;
  /** 删除类目项 */
  deleteItem(item: schema.XSpeciesItem): Promise<boolean>;
  /** 硬删除类目项 */
  hardDeleteItem(item: schema.XSpeciesItem): Promise<boolean>;
  /** 更新类目项 */
  updateItem(prev: schema.XSpeciesItem, next: schema.XSpeciesItem): Promise<boolean>;
  /** 查询绑定的属性 */
  loadBindingProperity(options: any): Promise<LoadResult<schema.XProperty[]>>;
}

/** 元数据分类实现 */
export class Species extends StandardFileInfo<schema.XSpecies> implements ISpecies {
  constructor(_metadata: schema.XSpecies, _directory: IDirectory) {
    super(_metadata, _directory, _directory.resource.speciesColl);
  }
  canDesign: boolean = false;
  items: schema.XSpeciesItem[] = [];
  private _itemLoaded: boolean = false;
  get cacheFlag(): string {
    return 'species';
  }
  get groupTags(): string[] {
    const tags = [...super.groupTags];
    if (this.metadata.generateTargetId) {
      tags.push('组织分类');
    } else if (this.metadata.tags) {
      tags.push(this.metadata.tags);
    }
    return tags;
  }
  get itemColl() {
    return this.directory.resource.speciesItemColl;
  }
  override async delete(): Promise<boolean> {
    if (this.directory) {
      let success = true;
      if (this.items.length > 0) {
        const items = await this.loadItems(true);
        for (const item of items) {
          success = await this.deleteItem(item);
        }
      }
      return success && super.delete();
    }
    return false;
  }
  async loadContent(reload: boolean = false): Promise<boolean> {
    await this.loadItems(reload);
    return true;
  }
  async loadItems(reload: boolean = false): Promise<schema.XSpeciesItem[]> {
    if (!this._itemLoaded || reload) {
      this._itemLoaded = true;
      this.items = (await this.loadAllItems()) || [];
    }
    return this.items;
  }
  async loadAllItems(skip: number = 0): Promise<schema.XSpeciesItem[]> {
    var items: schema.XSpeciesItem[] = [];
    const res = await this.itemColl.loadSpace({
      options: { match: { speciesId: this.id } },
      skip: skip,
    });
    if (res.length > 0) {
      items.push(...res);
      items.push(...(await this.loadAllItems(skip + items.length)));
    }
    return items;
  }
  async createItem(data: schema.XSpeciesItem): Promise<schema.XSpeciesItem | undefined> {
    const res = await this.itemColl.insert({
      ...data,
      typeName: '分类项',
      speciesId: this.id,
    });
    if (res) {
      await this.recorder.creating({
        coll: this.itemColl,
        next: res,
      });
      this.items.push(res);
    }
    return res;
  }
  async deleteItem(item: schema.XSpeciesItem): Promise<boolean> {
    const success = await this.itemColl.delete(item);
    if (success) {
      await this.recorder.updating({
        coll: this.itemColl,
        prev: item,
        next: { ...item, isDeleted: true },
      });
      this.items = this.items.filter((i) => i.id != item.id);
    }
    return success;
  }
  async hardDeleteItem(item: schema.XSpeciesItem): Promise<boolean> {
    const success = await this.itemColl.remove(item);
    if (success) {
      await this.recorder.deleting({ coll: this.itemColl, next: item });
      this.items = this.items.filter((i) => i.id != item.id);
    }
    return success;
  }
  async updateItem(
    prev: schema.XSpeciesItem,
    next: schema.XSpeciesItem,
  ): Promise<boolean> {
    if (next.children) {
      delete next.children;
    }
    const res = await this.itemColl.replace({
      ...next,
      speciesId: this.id,
    } as schema.XSpeciesItem);
    if (res) {
      await this.recorder.updating({ coll: this.itemColl, prev, next });
      const index = this.items.findIndex((i) => i.id === next.id);
      if (index > -1) {
        this.items[index] = res;
      }
      return true;
    }
    return false;
  }
  async loadBindingProperity(options: any): Promise<LoadResult<schema.XProperty[]>> {
    var res = await this.directory.resource.propertyColl.loadResult({
      ...options,
      ...{
        requireTotalCount: true,
        options: {
          match: {
            isDeleted: false,
            speciesId: this.id,
          },
        },
      },
    });
    if (res.success && !Array.isArray(res.data)) {
      res.data = [];
    }
    res.totalCount = res.totalCount ?? 0;
    res.groupCount = res.groupCount ?? 0;
    res.summary = res.summary ?? [];
    return res;
  }
  override async copy(destination: IDirectory): Promise<boolean> {
    if (this.allowCopy(destination)) {
      await super.copyTo(destination.id, destination.resource.speciesColl);
      await this.loadItems();
      await destination.resource.speciesItemColl.replaceMany(this.items);
      return true;
    }
    return false;
  }
  override async move(destination: IDirectory): Promise<boolean> {
    if (this.allowMove(destination)) {
      return await super.moveTo(destination, destination.resource.speciesColl);
    }
    return false;
  }
}

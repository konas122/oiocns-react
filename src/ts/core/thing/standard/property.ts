import { LoadResult } from '@/ts/base/model';
import { schema } from '../../../base';
import { IDirectory } from '../directory';
import { IStandardFileInfo, StandardFileInfo } from '../fileinfo';
import { Form } from './form';
import { deepClone } from '@/ts/base/common';

export interface IProperty extends IStandardFileInfo<schema.XProperty> {
  /** 表单特性 */
  attributes: schema.XAttribute[];
  lookups: schema.XSpeciesItem[];
  /** 查询绑定的表单 */
  loadBindingForms(options: any): Promise<LoadResult<schema.XForm[]>>;
  /** 更新所有表单 */
  updateForms(): Promise<boolean>;
  /** 删除表单 */
  delete(): Promise<boolean>;
  /** 更新表单字典项的信息 */
  updateDictionaries(): Promise<boolean>;
  /** 加载字典的分类项 */
  loadSpeciesLookups(): Promise<boolean>;
  /** 加载和更新表单项 */
  loadAndProcessForms(take: number, skip: number): Promise<boolean>;
  /** 根据字典ID加载字典项 */
  loadSpeciesById(id: string): Promise<schema.XSpecies | undefined>;
}

export class Property extends StandardFileInfo<schema.XProperty> implements IProperty {
  constructor(_metadata: schema.XProperty, _directory: IDirectory) {
    super(
      { ..._metadata, typeName: '属性' },
      _directory,
      _directory.resource.propertyColl,
    );
  }
  attributes: schema.XAttribute[] = [];
  lookups: schema.XSpeciesItem[] = [];
  get cacheFlag(): string {
    return 'propertys';
  }
  get groupTags(): string[] {
    const tags = [this.metadata.valueType, ...super.groupTags];
    if (this.metadata.isChangeTarget) {
      tags.push('可记录的');
    }
    if (this.metadata.isChangeSource) {
      tags.push('变更源');
    }
    if (this.metadata.isCombination) {
      tags.push('可拆分或合并');
    }
    return tags;
  }
  override async copy(destination: IDirectory): Promise<boolean> {
    if (this.allowCopy(destination)) {
      return await super.copyTo(destination.id, destination.resource.propertyColl);
    }
    return false;
  }
  override async move(destination: IDirectory): Promise<boolean> {
    if (this.allowMove(destination)) {
      return await super.moveTo(destination, destination.resource.propertyColl);
    }
    return false;
  }
  async loadBindingForms(options: any): Promise<LoadResult<schema.XForm[]>> {
    var res = await this.directory.resource.formColl.loadResult({
      ...options,
      ...{
        requireTotalCount: true,
        options: {
          match: {
            isDeleted: false,
            'attributes.propId': this.id,
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
  async updateForms(): Promise<boolean> {
    let take = 20;
    let skip = 0;
    let running = true;
    while (running) {
      const forms = await this.loadBindingForms({ take, skip });
      if (forms.data.length == 0) {
        running = false;
      } else {
        for (const form of forms.data) {
          const meta = new Form(form, this.target.directory);
          const index = form.attributes.findIndex((attr) => attr.propId == this.id);
          if (index > -1) {
            const cloned = deepClone(form);
            cloned.attributes[index].property = this.metadata;
            await meta.update(cloned);
          }
        }
        skip += take;
      }
    }
    return true;
  }
  async loadSpeciesLookups(): Promise<boolean> {
    if (this.metadata?.speciesId) {
      try {
        const result = await this.directory.resource.speciesItemColl.loadResult({
          options: {
            match: {
              speciesId: { _in_: [this.metadata.speciesId] },
            },
          },
        });
        if (result.success) {
          this.lookups = result.data;
          return true;
        }
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  async loadSpeciesById(id: string): Promise<schema.XSpecies | undefined> {
    if (this.metadata?.speciesId) {
      try {
        const result = await this.directory.resource.speciesColl.find([id]);
        return result[0];
      } catch (error) {
        return undefined;
      }
    }
    return undefined;
  }

  async updateFormDatas(form: Form) {
    let running = true;
    let loadOptions: any = {
      take: 20,
      skip: 0,
    };
    loadOptions.options = loadOptions.options || {};
    loadOptions.options.match = {
      ['T' + this.id]: {
        $exists: true,
        $ne: null,
        $not: {
          _regex_: '^S',
        },
      },
    };

    while (running) {
      const formData = await form.loadThing(loadOptions);
      if (formData.data.length === 0) {
        running = false;
      } else {
        loadOptions.skip += loadOptions.take;
        formData.data.forEach((item: schema.XForm) => {
          const findItem = this.lookups.find(
            (i) => i.relevanceId === item['T' + this.id],
          );
          if (findItem) {
            form.thingColl.update(item.id, {
              _set_: {
                ['T' + this.id]: 'S' + findItem.id,
              },
            });
          }
        });
      }
    }
    return true;
  }

  async loadAndProcessForms(take: number, skip: number): Promise<boolean> {
    try {
      const forms = await this.loadBindingForms({ take, skip });
      if (forms.data.length === 0) {
        return false;
      }
      for (const form of forms.data) {
        const meta = new Form(form, this.directory);
        await this.updateFormDatas(meta);
      }
      return true;
    } catch (_error) {
      return false;
    }
  }

  async updateDictionaries(): Promise<boolean> {
    let take = 20;
    let skip = 0;
    let running = true;
    await this.loadSpeciesLookups();
    while (running) {
      running = await this.loadAndProcessForms(take, skip);
      if (running) {
        skip += take;
      }
    }
    return true;
  }
}

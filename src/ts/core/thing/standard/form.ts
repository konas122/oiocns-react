import { LoadOptions, LoadResult, NodeCalcRule, SummaryOptions } from '@/ts/base/model';
import { schema, model, kernel, common } from '../../../base';
import { entityOperates, fileOperates, orgAuth } from '../../../core/public';
import { IDirectory } from '../directory';
import { IStandardFileInfo, StandardFileInfo } from '../fileinfo';
import { formatDate } from '@/utils';
import { ITemporaryStorage, TemporaryStorage } from '../../work/storage';
import { XCollection } from '../../public/collection';
import { IApplication } from './application';
import { XThing } from '@/ts/base/schema';
import orgCtrl from '@/ts/controller';
import { ICompany } from '../../target/team/company';
import { TargetType } from '@/ts/core';
import { deprecitionForm, validForDepreciation } from '@/ts/core/public/consts';
import ArrayStore from 'devextreme/data/array_store';
import { Constants } from '@/ts/base/common';
import _ from 'lodash';

/** 表单类接口 */
export interface IForm extends IStandardFileInfo<schema.XForm> {
  /** 表单特性 */
  attributes: schema.XAttribute[];
  /** 表单字段 */
  fields: model.FieldModel[];
  /** 汇总字段 */
  summaryFields: model.FieldModel[];
  /** 暂存箱 */
  storage: ITemporaryStorage;
  /** 物的集合 */
  thingColl: XCollection<schema.XThing>;
  /** 是否有权限 */
  isAuth: boolean;
  /** 加载完整表单信息 */
  load(): Promise<schema.XForm>;
  /** 加载分类字典项 */
  loadItems(speciesIds: string[]): Promise<schema.XSpeciesItem[]>;
  /** 根据名称模糊搜索分类字典项 */
  loadItemsByName(speciesIds: string[], name: string): Promise<schema.XSpeciesItem[]>;
  /** 根据节点分类id加载子级分类字典项 */
  loadItemsByParentId(
    speciesIds: string[],
    parentIds: any[],
  ): Promise<schema.XSpeciesItem[]>;
  /** 根据节点分类id加载分类字典项 */
  loadItemsById(speciesIds: string[], ids: string[]): Promise<schema.XSpeciesItem[]>;
  /** 根据节点分类id加载当前分类及所有父级分类字典项 */
  loadAllParents(speciesIds: string[], id: string): Promise<schema.XSpeciesItem[]>;
  /** 加载引用表单 */
  loadReferenceForm(formIs: string): Promise<schema.XForm>;
  /** 加载字段 */
  loadFields(reload?: boolean): Promise<model.FieldModel[]>;
  /** 保存 */
  save(): Promise<boolean>;
  /** 新建表单特性 */
  createAttribute(propertys: schema.XProperty[]): Promise<schema.XAttribute[]>;
  /** 创建表单视图 */
  generateView(destination: IDirectory): Promise<boolean>;
  /** 更新表单特性 */
  updateAttribute(
    data: model.AttributeModel,
    property?: schema.XProperty,
  ): Promise<boolean>;
  /** 删除表单特性 */
  deleteAttribute(data: schema.XAttribute): Promise<boolean>;
  /** 查询表数据 */
  loadThing(loadOptions: LoadOptions<XThing>): Promise<LoadResult<XThing[]>>;
  /** 查询数据归档集 */
  loadArchives(loadOptions: LoadOptions<XThing>): Promise<LoadResult<XThing[]>>;
  /** 查询表汇总数据 */
  loadSummary(
    loadOptions: LoadOptions & { ids?: string[] },
  ): Promise<{ [key: string]: number } | undefined>;
  /** 查询历史流程 */
  loadHistoryFlows(id: string): Promise<LoadResult<schema.XHistoryFlow[]>>;
  /** 加载历史文件 */
  loadHistoryFiles(id: string): Promise<LoadResult<schema.XHistoryFile[]>>;
  /** 新建报表临时坐标属性 */
  createReportAttribute(options: any): Promise<schema.XProperty | undefined>;
  /** 过滤条件解析 */
  parseFilter(filters?: any[]): any[];
  /** 分类条件解析 */
  parseClassify(): any;
  /** 高亮设置解析 */
  parseRedRow(): any;
  /** 拼接查询条件 */
  combineFilter(origin: any[], filters?: any[], isAuth?: boolean): any[];
  /** 查询资产分类汇总数据 */
  loadAssetClassSummary(
    loadOptions: LoadOptions,
    speciesId: string | undefined,
  ): Promise<{ [key: string]: number }>;
  /** 查询资产分类配置限额可更新数汇总 */
  loadAssetClassQuotaSummary(
    loadOptions: LoadOptions,
    speciesCode: string | undefined,
    selectSpeciesIds: string[],
    quotaRule: model.QuotaRuleType,
  ): Promise<{ [key: string]: number }>;
  /** 解锁 */
  unlock(things: schema.XThing[]): Promise<schema.XThing[]>;
  /** 加载图表统计 */
  loadChartSummary(loadOptions: LoadOptions<XThing>): Promise<LoadResult<any>>;
}

const getString = (datas: any[]) => {
  const ret: string[] = [];
  if (!datas) {
    return ret;
  }
  for (const data of datas) {
    if (typeof data == 'string') {
      ret.push(data.replace('T', ''));
    } else if (Array.isArray(data)) {
      ret.push(...getString(data));
    }
  }
  return ret;
};

// 提取属性内的规则汇总到表单规则，统一解析
export const resetFormRule = <T extends schema.XForm>(data: T) => {
  let allAttrRule: any[] = [];
  data.attributes?.forEach((attr) => {
    if (attr.rule && attr.rule != '{}') {
      let attrCalcRule = JSON.parse(attr.rule);
      allAttrRule.push(attrCalcRule);
    }

    if (attr.options) {
      if (attr.options.readOnlyConditions) {
        allAttrRule.push({
          ...attr.options.readOnlyConditions,
          name: '只读',
          remark: '',
          target: attr.id,
          showType: 'readOnly',
          value: null,
          type: 'condition',
          trigger: getString(JSON.parse(attr.options.readOnlyConditions.condition)),
        });
      }
      if (attr.options.hideFieldConditions) {
        allAttrRule.push({
          ...attr.options.hideFieldConditions,
          name: '隐藏',
          remark: '',
          target: attr.id,
          showType: 'visible',
          value: null,
          type: 'condition',
          trigger: getString(JSON.parse(attr.options.hideFieldConditions.condition)),
        });
      }
      if (attr.options.isRequiredConditions) {
        allAttrRule.push({
          ...attr.options.isRequiredConditions,
          name: '必填',
          remark: '',
          target: attr.id,
          showType: 'isRequired',
          value: null,
          type: 'condition',
          trigger: getString(JSON.parse(attr.options.isRequiredConditions.condition)),
        });
      }
    }
  });
  data.rule = allAttrRule;
  return data;
};

export class Form extends StandardFileInfo<schema.XForm> implements IForm {
  constructor(_metadata: schema.XForm, _directory: IDirectory, app?: IApplication) {
    super(resetFormRule(_metadata), _directory, _directory.resource.formColl);
    this.canDesign = !_metadata.id.includes('_');
    this.setEntity();
    this.application = app;
    this.storage = new TemporaryStorage(this);
    const resource = this.directory.resource;
    if (this.metadata.collName) {
      this.thingColl = resource.genColl<schema.XThing>(this.metadata.collName);
    } else {
      this.thingColl = resource.thingColl;
    }
  }
  application: IApplication | undefined;
  thingColl: XCollection<schema.XThing>;
  storage: ITemporaryStorage;
  canDesign: boolean;
  private _fieldsLoaded: boolean = false;
  fields: model.FieldModel[] = [];
  get attributes(): schema.XAttribute[] {
    const attrs: schema.XAttribute[] = [];
    const prodIds: string[] = [];
    for (const item of this.metadata.attributes || []) {
      if (item.propId && item.propId.length > 0 && !prodIds.includes(item.propId)) {
        attrs.push(item);
        prodIds.push(item.propId);
      }
    }
    return attrs;
  }
  get summaryFields(): model.FieldModel[] {
    return this.fields.filter((item) => item.options?.isSummary);
  }
  get id(): string {
    return this._metadata.id.replace('_', '');
  }
  get superior(): IApplication | IDirectory {
    return this.application ?? this.directory;
  }
  get cacheFlag(): string {
    return 'forms';
  }
  get isAuth(): boolean {
    if (!this._metadata.applyAuths?.length || this._metadata.applyAuths[0] === '0') return true;
    return this.target.hasAuthoritys(this._metadata.applyAuths);
  }
  override update(data: schema.XForm): Promise<boolean> {
    if (data.attributes) {
      data.attributes = data.attributes?.map((i) => {
        if (i.property?.valueType === '选择型') {
          i.widget = '单选框';
        }
        return i;
      });
    }

    return super.update(data);
  }
  async load(): Promise<schema.XForm> {
    try {
      const data = (await this.directory.resource.formColl.find([this.id])) || [];
      const firstItem = data[0] || {};
      const mergedObject = _.merge({}, this.metadata, firstItem);
      if (Object.keys(firstItem).length > 0) {
        this._metadata = mergedObject;
      }
      return mergedObject;
    } catch (error) {
      return this.metadata;
    }
  }
  async save(): Promise<boolean> {
    resetFormRule(this.metadata);
    return this.update(this.metadata);
  }
  override allowMove(destination: IDirectory): boolean {
    if ('works' in destination) {
      var app = destination as unknown as IApplication;
      return (
        this.metadata.applicationId !== app.id &&
        this.directory.belongId === app.directory.belongId
      );
    }
    return (
      destination.id != this.directory.id &&
      destination.target.belongId == this.target.belongId
    );
  }
  async loadContent(reload: boolean = false): Promise<boolean> {
    await this.loadFields(reload);
    return true;
  }
  async loadFields(reload: boolean = false): Promise<model.FieldModel[]> {
    if (!this._fieldsLoaded || reload) {
      const speciesIds = this.attributes
        .map((i) => i.property?.speciesId)
        .filter((i) => i && i.length > 0)
        .map((i) => i!);
      let data = await this.loadItems(speciesIds);
      this.fields = this.attributes
        .filter((i) => i.property && i.property.id)
        .map((attr) => {
          const field: model.FieldModel = {
            id: attr.id,
            rule: attr.rule,
            name: attr.name,
            widget: attr.widget,
            options: attr.options,
            code: attr.options?.isNative ? attr.propId : `T${attr.propId}`,
            info: attr.code,
            remark: attr.remark,
            speciesId: attr.property?.speciesId,
            lookups: [],
            propId: attr.propId,
            valueType: attr.property!.valueType,
            isChangeTarget: attr.property?.isChangeTarget,
            isChangeSource: attr.property?.isChangeSource,
            isCombination: attr.property?.isCombination,
          };
          if (attr.property!.speciesId && attr.property!.speciesId.length > 0) {
            field.lookups = data
              .filter((i) => i.speciesId === attr.property!.speciesId)
              .map((i) => {
                return {
                  id: i.id,
                  text: i.name,
                  code: i.code,
                  value: `S${i.id}`,
                  icon: i.icon,
                  info: i.info,
                  remark: i.remark,
                  parentId: i.parentId,
                  relevanceId: i.relevanceId,
                  propertyId: attr.property!.id,
                };
              });
          } else if ((attr as any).lookups) {
            //处理内置属性自带的选项
            field.lookups = (attr as any).lookups as model.FiledLookup[];
          }
          return field;
        });
      this._fieldsLoaded = true;
    }
    return this.fields;
  }
  async loadItems(speciesIds: string[]): Promise<schema.XSpeciesItem[]> {
    const ids = speciesIds.filter((i) => i && i.length > 0);
    if (ids.length < 1) return [];
    return await this.directory.resource.speciesItemColl.loadSpace({
      options: {
        match: {
          speciesId: { _in_: ids },
        },
      },
    });
  }

  async loadItemsByName(
    speciesIds: string[],
    name: string,
  ): Promise<schema.XSpeciesItem[]> {
    const ids = speciesIds.filter((i) => i && i.length > 0);
    if (ids.length < 1) return [];
    return await this.directory.resource.speciesItemColl.loadSpace({
      options: {
        match: {
          speciesId: { _in_: ids },
          name: { _regex_: name },
        },
      },
    });
  }

  async loadItemsByParentId(
    speciesIds: string[],
    parentIds: any[],
  ): Promise<schema.XSpeciesItem[]> {
    const ids = speciesIds.filter((i) => i && i.length > 0);
    return await this.directory.resource.speciesItemColl.loadSpace({
      options: {
        match: {
          speciesId: { _in_: ids },
          parentId: {
            _in_: parentIds,
          },
        },
      },
    });
  }

  async loadItemsById(
    speciesIds: string[],
    itemsIds: string[],
  ): Promise<schema.XSpeciesItem[]> {
    const ids = speciesIds.filter((i) => i && i.length > 0);
    return await this.directory.resource.speciesItemColl.loadSpace({
      options: {
        match: {
          speciesId: { _in_: ids },
          id: { _in_: itemsIds },
        },
      },
    });
  }

  async loadAllParents(speciesIds: string[], id: string) {
    let result = [];
    result = await this.recursionFindAllParent(speciesIds, id);
    return result;
  }

  async recursionFindAllParent(speciesIds: string[], id: string) {
    let result: any = [];
    const arr = (await this.loadItemsById(speciesIds, [id])) ?? [];
    if (arr.length === 0) return result;
    const parentNode = arr[0];
    result.unshift(parentNode);
    if (parentNode.parentId) {
      const _arr = await this.recursionFindAllParent(speciesIds, parentNode.parentId);
      result.unshift(..._arr);
    }
    return result;
  }

  async loadReferenceForm(formId: string): Promise<schema.XForm> {
    const data = await this.directory.resource.formColl.find([formId]);
    return data[0];
  }
  async createAttribute(propertys: schema.XProperty[]): Promise<schema.XAttribute[]> {
    const data = propertys.map((prop) => {
      return {
        id: 'snowId()',
        propId: prop.id,
        name: prop.name,
        code: prop.code,
        rule: '{}',
        remark: prop.remark,
        property: prop,
        authId: orgAuth.SuperAuthId,
      } as schema.XAttribute;
    });
    await this.update({
      ...this.metadata,
      attributes: [...(this.metadata.attributes || []), ...data],
    });
    return data;
  }
  async updateAttribute(
    data: schema.XAttribute,
    property?: schema.XProperty,
  ): Promise<boolean> {
    const oldData = this.attributes.find((i) => i.id === data.id);
    if (oldData) {
      data = { ...oldData, ...data };
      if (property) {
        data.propId = property.id;
        data.property = property;
      }
      const res = await this.update({
        ...this.metadata,
        attributes: [...this.attributes.filter((a) => a.id != data.id), data],
      });
      return res;
    }
    return false;
  }
  async deleteAttribute(data: schema.XAttribute): Promise<boolean> {
    const index = this.attributes.findIndex((i) => i.id === data.id);
    if (index > -1) {
      const res = await this.update({
        ...this.metadata,
        attributes: [...this.attributes.filter((a) => a.id != data.id)],
      });
      return res;
    }
    return false;
  }
  override async copy(destination: IDirectory): Promise<boolean> {
    var newMetaData = {
      ...this.metadata,
      directoryId: destination.id,
      sourceId: this.metadata.sourceId ?? this.id,
    };
    if ('works' in destination) {
      newMetaData.applicationId = destination.id;
      destination = destination.directory;
      newMetaData.directoryId = destination.id;
    } else {
      newMetaData.applicationId = undefined;
    }
    if (this.isSameBelong(destination)) {
      return await this.duplicate(newMetaData, destination);
    } else {
      await this.copyAutoProperties(destination);
    }
    const data = await destination.resource.formColl.replace(newMetaData);
    if (data) {
      return await destination.resource.formColl.notity({
        data: data,
        operate: 'insert',
      });
    }
    return false;
  }

  async duplicate(newMetaData: schema.XForm, destination: IDirectory): Promise<boolean> {
    const uuid = formatDate(new Date(), 'yyyyMMddHHmmss');
    newMetaData.name = this.metadata.name + `-副本${uuid}`;
    newMetaData.code = this.metadata.code + uuid;
    newMetaData.id = 'snowId()';

    const data = await destination.resource.formColl.replace(newMetaData);
    if (!data) {
      return false;
    }

    const newId = data.id;

    // 更新规则依赖
    for (const attr of data.attributes || []) {
      attr.formId = newId;
      if (attr.rule && attr.rule != '{}') {
        let attrCalcRule: NodeCalcRule = JSON.parse(attr.rule);
        attrCalcRule.target.formId = newId;
        attrCalcRule.mappingData.forEach((m) => {
          m.formId = newId;
        });
        attr.rule = JSON.stringify(attrCalcRule);
      }
    }
    resetFormRule(data);
    await destination.resource.formColl.replace(data);

    return await destination.resource.formColl.notity({
      data: data,
      operate: 'insert',
    });
  }

  private async copyAutoProperties(destination: IDirectory): Promise<void> {
    if (this.typeName == '报表') {
      const properties = await this.directory.resource.propertyColl.loadSpace({
        options: { match: { directoryId: this.metadata.sourceId ?? this.id } },
      });
      await destination.resource.propertyColl.replaceMany(properties);
    }
  }
  override async move(destination: IDirectory): Promise<boolean> {
    if (this.allowMove(destination)) {
      var newData = {
        ...this.metadata,
        directoryId: destination.id,
      };
      if ('works' in destination) {
        newData.applicationId = destination.id;
        newData.directoryId = destination.directory.id;
      } else {
        newData.applicationId = undefined;
      }
      const data = await destination.resource.formColl.replace(newData);
      if (data) {
        await this.directory.recorder.moving({
          coll: destination.resource.formColl,
          destination: destination,
          next: data,
        });
        await this.notify('remove', this.metadata);
        return await destination.resource.formColl.notity({
          data: data,
          operate: 'insert',
        });
      }
    }
    return false;
  }
  override operates(): model.OperateModel[] {
    if (this.directory.target.typeName === TargetType.Group && this.typeName == '视图') {
      const operates = super.operates().filter((i) => i !== entityOperates.Open);
      operates.push(entityOperates.GroupOpen);
      return operates;
    }
    if (this.typeName == '表单') {
      const operates = super.operates().filter((i) => i !== entityOperates.Open);
      operates.push(entityOperates.FormOpen, fileOperates.GenerateView);
      return operates;
    }
    if (this.canDesign) {
      return super.operates();
    }
    return [fileOperates.Copy, entityOperates.Remark];
  }
  updataSort(loadOptions: LoadOptions): LoadOptions {
    if (['升序', '降序'].includes(this._metadata.sort) && !loadOptions.isExporting) {
      if (!loadOptions?.sort || loadOptions.sort?.length < 2) {
        loadOptions.sort = [
          { selector: 'updateTime', desc: this._metadata.sort === '降序' },
        ];
      }
    }
    if (loadOptions.sort?.length === 2) {
      loadOptions.sort = loadOptions.sort.filter((i) => i.selector !== 'id');
    }
    return loadOptions;
  }
  async loadThing(loadOptions: LoadOptions): Promise<LoadResult<any>> {
    loadOptions = loadOptions || {};
    loadOptions.options = loadOptions.options || {};
    loadOptions.options.match = loadOptions.options.match || {};
    loadOptions.options.project = loadOptions.options.project || {};
    loadOptions.options.match.isDeleted = false;
    loadOptions.options.match = {
      ...loadOptions.options.match,
      ...this.parseClassify(),
    };
    loadOptions.options.project = {
      ...loadOptions.options.project,
      archives: 0,
    };
    loadOptions.clusterId = this.metadata.options?.dataRange?.clusterId;
    await this.loadGroupThingOptions(loadOptions);
    const res = await this.thingColl.loadResult(this.updataSort(loadOptions));
    res.data = await this.highlightRule(Array.isArray(res.data) ? res.data : []);
    res.totalCount = res.totalCount ?? 0;
    res.groupCount = res.groupCount ?? 0;
    res.summary = Array.isArray(res.summary) ? res.summary : [];
    console.log('reee', res);

    return res;
  }

  async loadArchives(loadOptions: LoadOptions): Promise<LoadResult<any>> {
    loadOptions = loadOptions || {};
    loadOptions.options = loadOptions.options || {};
    loadOptions.options.match = loadOptions.options.match || {};
    loadOptions.options.match.isDeleted = false;
    loadOptions.options.project = {
      archives: 1,
    };
    await this.loadGroupThingOptions(loadOptions);
    const res = await this.thingColl.loadResult(this.updataSort(loadOptions));
    return res;
  }

  //获取集群数据
  async loadGroupThingOptions(loadOptions: LoadOptions): Promise<LoadOptions> {
    const [groupId, filter] = this.parseGroupFilter();
    if (!groupId || !filter || filter.length == 0) return loadOptions;

    const groupTarget = this.directory.target.targets.find((g) => g.id === groupId);
    if (groupTarget && groupTarget.id) {
      const groupOptions: LoadOptions = {
        belongId: groupTarget.belongId,
        filter,
        options: {
          match: { isDeleted: false, belongId: this.belongId },
        },
        userData: [],
        skip: 0,
        take: 100,
      };
      const res = await groupTarget.resource.thingColl.loadResult(groupOptions);
      res.data = Array.isArray(res.data) ? res.data : [];
      if (res.data.length > 0) {
        loadOptions.options.match = {
          ...loadOptions.options.match,
          id: {
            _in_: res.data.map((d) => d.id),
          },
        };
      }
    }

    return loadOptions;
  }
  async filterSummary(loadOptions: LoadOptions): Promise<any[]> {
    const result = await this.loadSummary(loadOptions);
    return this.summaryFields.map((item) => {
      return result?.[item.code] ?? 0;
    });
  }
  async loadSummary(loadOptions: any): Promise<{ [key: string]: number } | undefined> {
    const filters = this.summaryFields;
    if (filters.length == 0) {
      return {};
    }

    const options: SummaryOptions = {
      collName: this.thingColl.collName,
      fields: filters.map((f) => f.code),
    };

    const match = {
      ...loadOptions.options?.match,
      ...common.filterConvert(JSON.stringify(loadOptions.filter ?? '[]')),
    };
    if (loadOptions.userData?.length > 0) {
      if (match.labels) {
        match._and_ = match._and_ || [];
        match._and_.push({ labels: { _in_: loadOptions.userData } });
        match._and_.push({ labels: { ...match.labels } });
        delete match.labels;
      } else {
        match.labels = { _in_: loadOptions.userData };
      }
    }
    let _targetId = this.target.id;
    let _relations = [...this.target.relations];
    if (loadOptions?.extraReations && loadOptions.extraReations.length > 5) {
      _relations.push(loadOptions.extraReations);
      _targetId = loadOptions.extraReations;
      delete loadOptions.extraReations;
    }

    if (Array.isArray(loadOptions.ids) && loadOptions.ids.length > 0) {
      options.ids = loadOptions.ids;
      // 经过月报全省大树测试，在最快情况下的每批大小，大于1800会单个查询超时，小于600会因并发压力超时
      options.chunkSize = 1000;
    }

    options.match = match;
    const result = await kernel.collectionSummary(
      _targetId,
      this.target.spaceId,
      _relations,
      options,
    );

    return result.data;
  }

  async loadChartSummary(loadOptions: LoadOptions): Promise<LoadResult<any>> {
    loadOptions = loadOptions || {};
    loadOptions.options = loadOptions.options || {};
    loadOptions.options.match = loadOptions.options.match || {};
    loadOptions.options.match.isDeleted = false;
    loadOptions.options.match = {
      ...loadOptions.options.match,
      ...this.parseClassify(),
    };
    const match = {
      ...loadOptions.options?.match,
      ...common.filterConvert(JSON.stringify(loadOptions.filter ?? '[]')),
    };
    const options = [
      { match },
      { group: loadOptions.group },
      { project: loadOptions.options.project },
      { limit: Constants.MAX_INT_32 },
    ];
    const result = await kernel.collectionAggregate(
      this.target.id,
      this.target.belongId,
      this.target.relations,
      this.thingColl.collName,
      options,
      loadOptions.filter,
    );
    return result.data;
  }

  async loadAssetClassSummary(
    loadOptions: LoadOptions,
    speciesId: string,
  ): Promise<{ [key: string]: number }> {
    loadOptions = loadOptions || {};
    loadOptions.options = loadOptions.options || {};
    loadOptions.options.match = loadOptions.options.match || {};
    loadOptions.options.match.isDeleted = false;
    loadOptions.options.match = {
      ...loadOptions.options.match,
      ...this.parseClassify(),
    };
    const filters = this.summaryFields;
    const group: { [key: string]: any } = { key: [] };
    for (const field of filters) {
      group[field.code] = { _sum_: '$' + field.code };
    }
    const match = {
      ...loadOptions.options?.match,
      ...common.filterConvert(JSON.stringify(loadOptions.filter ?? '[]')),
    };
    match[speciesId] = { _ne_: null };
    group.key = [speciesId];
    const options = [{ match }, { group }, { limit: 3000 }];
    const result = await kernel.collectionAggregate(
      this.target.id,
      this.target.belongId,
      this.target.relations,
      this.thingColl.collName,
      options,
    );
    return result.data;
  }

  async loadAssetClassQuotaSummary(
    loadOptions: LoadOptions,
    speciesCode: string,
    selectSpeciesIds: string[],
    quotaRule: model.QuotaRuleType,
  ): Promise<{ [key: string]: number }> {
    loadOptions = loadOptions || {};
    loadOptions.options = loadOptions.options || {};
    loadOptions.options.match = loadOptions.options.match || {};
    loadOptions.options.match.isDeleted = false;
    loadOptions.options.match = {
      ...loadOptions.options.match,
      ...this.parseClassify(),
    };

    const matchAsset = {
      ...loadOptions.options?.match,
      ...common.filterConvert(JSON.stringify(loadOptions.filter ?? '[]')),
    };

    const lookup = {
      lookup: {
        from: quotaRule.quotaDeprecitionForm![0].collName || 'formdata-business',
        localField: speciesCode,
        foreignField: speciesCode,
        as: deprecitionForm,
      },
    };

    const unwind: any = {
      _unwind_: `$${deprecitionForm}`,
    };

    const resultCode = this.summaryFields.map((i) => {
      return {
        [i.code]: 1,
      };
    });

    const project: any = {
      ...resultCode[0],
      [speciesCode]: 1,
      [validForDepreciation]: {
        $cond: {
          if: {
            $gte: [
              {
                $divide: [
                  {
                    $subtract: [
                      new Date(quotaRule.quotaExpirationDate!).getTime(),
                      {
                        $toLong: {
                          $cond: {
                            if: {
                              $eq: [
                                {
                                  $type: `$T${quotaRule.quotaAcquisitionDate!.id}`,
                                },
                                'date',
                              ],
                            },
                            then: `$T${quotaRule.quotaAcquisitionDate!.id}`,
                            else: {
                              $dateFromString: {
                                dateString: `$T${quotaRule.quotaAcquisitionDate!.id}`,
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                  1000 * 60 * 60 * 24 * 30, // 将时间差转化为月份
                ],
              },
              {
                $first: `$${deprecitionForm}.T${quotaRule.quotaDeprecitionDate!.id}`,
              },
            ],
          },
          then: `$${this.summaryFields[0].code}`,
          else: 0,
        },
      },
    };

    const match: any = {};
    match[speciesCode] = { _in_: selectSpeciesIds };
    const filters = this.summaryFields;
    if (filters.length == 0) {
      return {};
    }
    const group: { [key: string]: any } = { key: [] };
    for (const field of filters) {
      group[field.code] = { _sum_: `$${field.code}` };
      group[`T${quotaRule.quotaNumber!.id}`] = { _sum_: `$${validForDepreciation}` }; // 可更新数
    }
    group.key = [speciesCode];
    const options = [
      { match: matchAsset },
      { ...lookup },
      { ...unwind },
      { project },
      { match },
      { group },
      { limit: 3000 },
    ];

    const result = await kernel.collectionAggregate(
      this.target.id,
      this.target.belongId,
      this.target.relations,
      this.thingColl.collName,
      options,
    );
    return result.data;
  }

  parseClassify() {
    const classifyExp = this.metadata.options?.dataRange?.classifyExp;
    try {
      if (classifyExp) {
        return JSON.parse(classifyExp);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
    return {};
  }

  parseRedRow() {
    const filterRedRowExp = this.metadata.options?.dataRange?.filterRedRowExp;
    try {
      if (filterRedRowExp) {
        return JSON.parse(filterRedRowExp);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
    return '';
  }

  parseFilter(filters: any[]) {
    try {
      let result: any[] = [];
      result = this.combineFilter(result, filters);
      const range = this.metadata.options?.dataRange;
      if (range) {
        var { filterExp, authExp } = range;
        if (filterExp) {
          const filterExpData = JSON.parse(filterExp);
          let tableIdIndex = filterExpData.indexOf('person') - 2;
          let value =
            tableIdIndex >= 0
              ? filterExpData[tableIdIndex]
              : filterExpData.filter(
                  (a: string | string[]) => Array.isArray(a) && a.indexOf('person') >= 0,
                )[0]?.[0];
          if (value && this.fields) {
            const lookups = this.fields.find((a) => a.code === value)?.lookups;
            const dictId = lookups?.find((a) => a.code === orgCtrl.user.code)?.id;
            result = this.combineFilter(
              result,
              JSON.parse(
                dictId ? filterExp.replaceAll('person', 'S' + dictId) : filterExp,
              ),
            );
          } else {
            result = this.combineFilter(result, JSON.parse(filterExp));
          }
        }
        if (authExp) {
          result = this.combineFilter(result, [JSON.parse(this.parseAuthExp(authExp))]);
        }
      }
      return result;
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
    return [];
  }
  parseAuthExp(filters: string) {
    filters = filters
      .replaceAll('person', this.userId)
      .replaceAll('company', this.target.spaceId);
    return this.parseDeptFilter(filters);
  }
  parseDeptFilter(authExp: string) {
    const deptAuthText = 'dept';
    let company = this.target.space as ICompany;
    if (company && authExp.includes(deptAuthText)) {
      const joinedDepts = company.user.departments.filter(
        (a) => a.belongId == company.id,
      );
      if (joinedDepts.length > 0) {
        //单部门格式处理
        if (joinedDepts.length == 1) {
          authExp = authExp.replaceAll(deptAuthText, joinedDepts[0].id);
        } else {
          //多部门格式处理
          const extractedMatch = extractMatch(authExp, deptAuthText);
          const deptExp: any[] = [];
          joinedDepts.forEach((dept: schema.XEntity, idx: number) => {
            idx > 0 && deptExp.push('or');
            deptExp.push(JSON.parse(extractedMatch.replace(deptAuthText, dept.id)));
          });
          authExp = authExp.replaceAll(extractedMatch, JSON.stringify(deptExp));
        }
      }
    }
    return authExp;
  }
  parseGroupFilter() {
    try {
      let filter: any[] = [];
      const range = this.metadata.options?.dataRange;
      if (range) {
        const { groupId, groupExp } = range;
        if (groupId && groupExp) {
          filter = this.combineFilter(filter, JSON.parse(groupExp));
          return [groupId, filter];
        }
      }
      return filter;
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
    return [];
  }
  combineFilter(origin: any[], filters?: any[], isAuth?: boolean) {
    if (Array.isArray(filters)) {
      if (isAuth) {
        const _resStr = this.parseAuthExp(JSON.stringify(filters));
        filters = JSON.parse(_resStr) as any[];
      }
      if (origin.length > 0) {
        origin = origin.some((item) => Array.isArray(item)) ? origin : [origin];
        filters = filters.some((item) => Array.isArray(item)) ? filters : [filters];
        origin.push('and', ...filters);
      } else {
        origin = filters;
      }
    }
    return origin;
  }
  //数据高亮规则统一处理
  async highlightRule(data: schema.XThing[]): Promise<schema.XThing[]> {
    if (!this.metadata.options?.dataRange?.filterRedRowExp || !data.length) return data;
    const redRowRule = this.parseRedRow();
    if (redRowRule) {
      const flags = await new ArrayStore({ data }).load({ filter: redRowRule });
      flags.forEach((item) => {
        const index = data.findIndex((j: any) => j.id === item.id);
        if (index > -1) data[index]['redRowFlag'] = true;
      });
    }
    return data;
  }
  async loadHistoryFlows(id: string): Promise<LoadResult<schema.XHistoryFlow[]>> {
    const flows = this.directory.resource.historyFlowColl;
    return await flows.loadResult({ options: { match: { oldInstanceId: id } } });
  }
  async loadHistoryFiles(id: string): Promise<LoadResult<schema.XHistoryFile[]>> {
    const files = this.directory.resource.historyFileColl;
    return await files.loadResult({ options: { match: { oldInstanceId: id } } });
  }
  async createReportAttribute(data: any): Promise<schema.XProperty | undefined> {
    const files = this.directory.resource.propertyColl;
    const result = await files.insert({
      ...data,
      directoryId: this.metadata.id,
    });
    return result;
  }
  async generateView(destination: IDirectory): Promise<boolean> {
    const viewColl = this.directory.resource.viewColl;
    const params = {
      ...this.metadata,
      directoryId: destination.id,
      id: 'snowId()',
      typeName: '视图',
      subTypeName: '表单',
    } as schema.XView;
    delete params.applicationId;
    const data = await viewColl.insert(params);
    if (data) {
      return await destination.resource.viewColl.notity({
        data: data,
        operate: 'insert',
      });
    }
    return false;
  }
  async unlock(things: schema.XThing[]): Promise<schema.XThing[]> {
    return this.thingColl.updateMany(
      things.map((item) => item.id),
      { _unset_: { locks: '' } },
    );
  }
}
// 函数：提取匹配的数据
function extractMatch(jsonStr: string, matchValue: string): string {
  if (jsonStr.includes(matchValue)) {
    const jsonData = JSON.parse(jsonStr);
    const regex = /^[A-Z][0-9]+$/;
    for (let item of jsonData) {
      if (Array.isArray(item)) {
        if (item.length === 3 && regex.test(item[0]) && item[2] === matchValue) {
          return JSON.stringify(item);
        } else {
          const result = extractMatch(item as any, matchValue);
          if (result) return result;
        }
      }
    }
    return jsonStr;
  } else {
    return '';
  }
}

import { model, schema } from '@/ts/base';
import { ViewType } from '@/ts/base/enum';
import { LoadOptions, LoadResult } from '@/ts/base/model';
import { XThing } from '@/ts/base/schema';
import { ICompany, IFile } from '@/ts/core';
import { IDirectory, TargetType, XCollection } from '@/utils/excel';
import dayjs from 'dayjs';
import { entityOperates, fileOperates, orgAuth } from '../../../public';
import { IStandardFileInfo, StandardFileInfo } from '../../fileinfo';
import { resetFormRule } from '../form';

export interface IBaseView extends IStandardFileInfo<schema.XView> {
  /** 视图子类型 */
  subTypeName: ViewType;
  // 查看方式
  viewType: 'work' | 'default';
  /** 是否有权限 */
  isAuth: boolean;
  /** 物的集合 */
  thingColl: XCollection<schema.XThing>;
  /** 是否为集群空间 */
  isGroupSpace: boolean;
  /** 属性列表 */
  fields: model.FieldModel[];
  /** 加载完整表单信息 */
  load(): Promise<schema.XView>;
  /** 加载字段 */
  loadFields(reload?: boolean): Promise<model.FieldModel[]>;
  /** 加载分类字典项 */
  loadItems(speciesIds: string[]): Promise<schema.XSpeciesItem[]>;
  /** 保存 */
  save(): Promise<boolean>;
  /** 新建表单特性 */
  createAttribute(propertys: schema.XProperty[]): Promise<schema.XAttribute[]>;
  /** 更新表单特性 */
  updateAttribute(
    data: model.AttributeModel,
    property?: schema.XProperty,
  ): Promise<boolean>;
  /** 删除表单特性 */
  deleteAttribute(data: schema.XAttribute): Promise<boolean>;
  /** 查询表数据 */
  loadThing(loadOptions: LoadOptions<XThing>): Promise<LoadResult<XThing[]>>;
  /** 生成视图 */
  generateView(file: IFile): Promise<boolean>;
  /** 过滤条件解析 */
  parseFilter(filters?: any[]): any[];
  /** 分类条件解析 */
  parseClassify(): any;
  /** 拼接查询条件 */
  combineFilter(origin: any[], filters?: any[], isAuth?: boolean): any[];
  /** 根据节点分类id加载子级分类字典项 */
  loadItemsByParentId(
    speciesIds: string[],
    parentIds: any[],
  ): Promise<schema.XSpeciesItem[]>;
}

export class BaseView extends StandardFileInfo<schema.XView> implements IBaseView {
  canDesign: boolean;
  private _fieldsLoaded: boolean = false;
  fields: model.FieldModel[] = [];

  constructor(_metadata: schema.XView, _directory: IDirectory) {
    super(resetFormRule(_metadata as any), _directory, _directory.resource.viewColl);
    this.canDesign = !_metadata.id.includes('_');
    this.setEntity();
  }

  get id(): string {
    return this._metadata.id.replace('_', '');
  }

  get typeName(): string {
    return '视图';
  }

  get isAuth(): boolean {
    if (!this._metadata.applyAuths?.length || this._metadata.applyAuths[0] === '0') return true;
    return this.target.hasAuthoritys(this._metadata.applyAuths);
  }

  get groupTags(): string[] {
    if ('isDeleted' in this.metadata && this.metadata.isDeleted === true) {
      return ['已删除'];
    }
    return [this.typeName, this.metadata.subTypeName + '视图'];
  }

  get subTypeName(): ViewType {
    return this.metadata.subTypeName ?? ViewType.Form;
  }

  get viewType(): 'work' | 'default' {
    return this.metadata?.options?.viewType ?? 'default';
  }

  get cacheFlag(): string {
    return 'views';
  }

  get viewAuth(): boolean {
    return true;
  }

  get isGroupSpace() {
    return this.directory.target.typeName === TargetType.Group;
  }

  get thingColl(): XCollection<schema.XThing> {
    const collName = this.metadata.collName;
    const resource = this.directory.resource;
    if (collName) return resource.genColl<schema.XThing>(collName);
    return resource.thingColl;
  }
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
  async load(): Promise<schema.XView> {
    let data = await this.directory.resource.viewColl.find([this.id]);
    // 兼容历史 表单视图 查看
    if (data.length === 0) {
      data = (await this.directory.resource.formColl.find([this.id])) as any;
    }
    if (data.length > 0) {
      this._metadata = data[0];
    }
    return this._metadata;
  }
  async save(): Promise<boolean> {
    resetFormRule(this.metadata as any);
    return this.update(this.metadata);
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
      const data = await this.loadItems(speciesIds);
      this.fields = this.attributes
        .filter((i) => i.property && i.property.id)
        .map((attr) => this.createFieldModel(attr, data));
      this._fieldsLoaded = true;
    }
    return this.fields;
  }

  private createFieldModel(
    attr: schema.XAttribute,
    data: schema.XSpeciesItem[],
  ): model.FieldModel {
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
        .map((i) => ({
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
        }));
    } else if ((attr as any).lookups) {
      field.lookups = (attr as any).lookups as model.FiledLookup[];
    }

    return field;
  }

  async loadItems(speciesIds: string[]): Promise<schema.XSpeciesItem[]> {
    const ids = speciesIds.filter((i) => i && i.length > 0);
    if (ids.length < 1) return [];
    return await this.directory.resource.speciesItemColl.loadSpace({
      options: { match: { speciesId: { _in_: ids } } },
    });
  }
  updataSort(loadOptions: LoadOptions): LoadOptions {
    // 导出时 使用导出的排序
    if (loadOptions.isExporting) {
      return loadOptions;
    }
    // 未主动设置排序，使用表单设置的默认排序
    if (['升序', '降序'].includes(this._metadata.sort)) {
      if (!loadOptions?.sort || loadOptions.sort?.length < 2) {
        loadOptions.sort = [
          { selector: 'updateTime', desc: this._metadata.sort === '降序' },
        ];
      }
    }
    // 若存在多个排序规则 将id 排序规则去掉--修复排序异常问题
    if (loadOptions.sort?.length === 2) {
      loadOptions.sort = loadOptions.sort.filter((i) => i.selector !== 'id');
    }
    return loadOptions;
  }
  async loadThing(loadOptions: LoadOptions): Promise<LoadResult<any>> {
    loadOptions = loadOptions || {};
    loadOptions.options = loadOptions.options || {};
    loadOptions.options.match = loadOptions.options.match || {};
    loadOptions.options.match.isDeleted = false;
    loadOptions.options.match = { ...loadOptions.options.match, ...this.parseClassify() };

    const res = await this.thingColl.loadResult(this.updataSort(loadOptions));
    res.data = Array.isArray(res.data) ? res.data : [];
    res.totalCount = res.totalCount ?? 0;
    res.groupCount = res.groupCount ?? 0;
    return res;
  }

  override update(data: schema.XView): Promise<boolean> {
    if (data?.attributes) {
      data.attributes = data.attributes.map((i) => {
        if (i.property?.valueType === '选择型') {
          i.widget = '单选框';
        }
        return i;
      });
    }
    return super.update(data);
  }

  async createAttribute(propertys: schema.XProperty[]): Promise<schema.XAttribute[]> {
    const data = propertys.map(
      (prop) =>
        ({
          id: 'snowId()',
          propId: prop.id,
          name: prop.name,
          code: prop.code,
          rule: '{}',
          remark: prop.remark,
          property: prop,
          authId: orgAuth.SuperAuthId,
        } as schema.XAttribute),
    );

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
  async generateView(file: IFile) {
    const metadata = {
      ...file.metadata,
      typeName: '视图',
      subTypeName: file.typeName,
    } as schema.XView;
    const res = await this.directory.standard.createView(metadata);
    return !!res;
  }

  override async copy(destination: IDirectory): Promise<boolean> {
    const newMetaData = {
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
    }
    const data = await destination.resource.viewColl.replace(newMetaData);
    if (data) {
      return await destination.resource.viewColl.notity({
        data: data,
        operate: 'insert',
      });
    }
    return false;
  }

  async duplicate(newMetaData: schema.XView, destination: IDirectory): Promise<boolean> {
    const uuid = dayjs(new Date()).format('yyyyMMddHHmmss');
    newMetaData.name = `${this.metadata.name}-副本${uuid}`;
    newMetaData.code = `${this.metadata.code}${uuid}`;
    newMetaData.id = 'snowId()';

    const data = await destination.resource.viewColl.replace(newMetaData);
    if (!data) {
      return false;
    }
    await destination.resource.viewColl.replace(data);
    return await destination.resource.viewColl.notity({
      data: data,
      operate: 'insert',
    });
  }

  override async move(destination: IDirectory): Promise<boolean> {
    if (this.allowMove(destination)) {
      const newData = { ...this.metadata, directoryId: destination.id };
      if ('works' in destination) {
        newData.applicationId = destination.id;
        newData.directoryId = destination.directory.id;
      } else {
        newData.applicationId = undefined;
      }
      const data = await destination.resource.viewColl.replace(newData as schema.XView);
      if (data) {
        await this.directory.recorder.moving({
          coll: destination.resource.viewColl,
          destination: destination,
          next: data,
        });
        await this.notify('remove', this.metadata);
        return await destination.resource.viewColl.notity({
          data: data,
          operate: 'insert',
        });
      }
    }
    return false;
  }

  override operates(): model.OperateModel[] {
    if (this.directory.target.typeName === TargetType.Group && this.typeName === '视图') {
      const operates = super.operates().filter((i) => i !== entityOperates.Open);
      if (this.subTypeName === '图表') {
        operates.push(entityOperates.Open);
      } else {
        operates.push(entityOperates.GroupOpen);
      }
      return operates;
    }
    if (this.canDesign) {
      return super.operates();
    }
    return [fileOperates.Copy, entityOperates.Remark];
  }

  combineFilter(origin: any[], filters?: any[], isAuth?: boolean): any[] {
    if (Array.isArray(filters)) {
      if (isAuth) {
        filters = JSON.parse(this.parseAuthExp(JSON.stringify(filters))) as any[];
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

  parseClassify(): any {
    const classifyExp = this.metadata.options?.dataRange?.classifyExp;
    if (classifyExp) {
      try {
        return JSON.parse(classifyExp);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
      }
    }
    return {};
  }

  parseFilter(filters: any[]): any[] {
    let result: any[] = [];
    result = this.combineFilter(result, filters);
    const range = this.metadata.options?.dataRange;
    if (range) {
      const { filterExp, authExp } = range;
      if (filterExp) {
        const filterExpData = JSON.parse(filterExp);
        const tableIdIndex = filterExpData.indexOf('person') - 2;
        const value =
          tableIdIndex >= 0
            ? filterExpData[tableIdIndex]
            : filterExpData.find(
                (a: string | string[]) => Array.isArray(a) && a.includes('person'),
              )?.[0];
        if (value && this.fields) {
          const lookups = this.fields.find((a) => a.code === value)?.lookups;
          const dictId = lookups?.find(
            (a) => a.code === this.directory.target.user.code,
          )?.id;
          result = this.combineFilter(
            result,
            JSON.parse(dictId ? filterExp.replaceAll('person', `S${dictId}`) : filterExp),
          );
        } else {
          result = this.combineFilter(result, JSON.parse(filterExp));
        }
      }
      if (authExp) {
        result = this.combineFilter(result, JSON.parse(this.parseAuthExp(authExp)));
      }
    }
    return result;
  }

  parseAuthExp(filters: string): string {
    return this.parseDeptFilter(
      filters
        .replaceAll('person', this.userId)
        .replaceAll('company', this.target.spaceId),
    );
  }

  parseDeptFilter(authExp: string): string {
    const deptTag = 'dept';
    const company = this.target.space as ICompany;
    if (company && authExp.includes(deptTag)) {
      const myDepts = company.user.departments.filter((d) => d.belongId === company.id);
      if (myDepts.length > 0) {
        if (myDepts.length === 1) {
          authExp = authExp.replaceAll(deptTag, myDepts[0].id);
        } else {
          const extractedMatch = extractMatch(authExp, deptTag);
          const deptExp = myDepts
            .map((dept, idx) =>
              idx > 0
                ? ['or', JSON.parse(extractedMatch.replace(deptTag, dept.id))]
                : JSON.parse(extractedMatch.replace(deptTag, dept.id)),
            )
            .flat();
          authExp = authExp.replaceAll(extractedMatch, JSON.stringify(deptExp));
        }
      }
    }
    return authExp;
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
}

function extractMatch(jsonStr: string, matchValue: string): string {
  if (!jsonStr.includes(matchValue)) return '';
  const jsonData = JSON.parse(jsonStr);
  const regex = /^[A-Z][0-9]+$/;
  for (const item of jsonData) {
    if (Array.isArray(item)) {
      if (item.length === 3 && regex.test(item[0]) && item[2] === matchValue) {
        return JSON.stringify(item);
      } else {
        const result = extractMatch(JSON.stringify(item), matchValue);
        if (result) return result;
      }
    }
  }
  return jsonStr;
}

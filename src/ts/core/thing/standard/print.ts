import { LoadResult, TableModel } from '@/ts/base/model';
import { schema, model, common, kernel } from '../../../base';
import { entityOperates, fileOperates, orgAuth } from '../../../core/public';
import { IDirectory } from '../directory';
import { IStandardFileInfo, StandardFileInfo } from '../fileinfo';
import { formatDate } from '@/utils';
import { XCollection } from '../../public/collection';
import { IApplication } from './application';
import { ICompany } from '../..';

/** 打印模版接口 */
export interface IPrint extends IStandardFileInfo<schema.XPrint> {
  /** 名称 */
  name: string;
  /** 特性 */
  attributes: schema.XAttribute[];
  /** 表格的数据 */
  table: TableModel[];
  /** 打印模板字段 */
  fields: model.FieldModel[];
  /** 汇总字段 */
  summaryFields: model.FieldModel[];
  /** 加载分类字典项 */
  loadItems(speciesIds: string[]): Promise<schema.XSpeciesItem[]>;
  /** 加载引用表单 */
  loadReferenceForm(ID: string): Promise<schema.XPrint>;
  /** 加载字段 */
  loadFields(reload?: boolean): Promise<model.FieldModel[]>;
  /** 保存 */
  save(): Promise<boolean>;
  /** 保存表格数据 */
  deitTable(table: TableModel[]): Promise<boolean>;
  /** 查询表数据 */
  loadThing(loadOptions: any): Promise<LoadResult<any>>;
  /** 查询历史流程 */
  loadHistoryFlows(id: string): Promise<LoadResult<schema.XHistoryFlow[]>>;
  /** 加载历史文件 */
  loadHistoryFiles(id: string): Promise<LoadResult<schema.XHistoryFile[]>>;
  /** 新建报表临时坐标属性 */
  // createReportTemporaryAttribute(options: any): Promise<schema.XProperty | undefined>;
  /** 过滤条件解析 */
  parseFilter(): any[];
  /** 分类条件解析 */
  parseClassify(): any;
}

export class Print extends StandardFileInfo<schema.XPrint> implements IPrint {
  constructor(_metadata: schema.XPrint, _directory: IDirectory) {
    super(_metadata, _directory, _directory.resource.printColl);
    this.canDesign = !_metadata.id.includes('_');
    this.setEntity();
    const resource = this.directory.resource;
    if (this.metadata.collName) {
      this.thingColl = resource.genColl<schema.XThing>(this.metadata.collName);
    } else {
      this.thingColl = resource.thingColl;
    }
  }
  fields: model.FieldModel[] = [];
  thingColl: XCollection<schema.XThing>;
  canDesign: boolean;
  private _fieldsLoaded: boolean = false;
  get id(): string {
    return this._metadata.id.replace('_', '');
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
  get table(): TableModel[] {
    return this.metadata.table!;
  }
  async deitTable(table: TableModel[]): Promise<boolean> {
    this.metadata.table = table;
    const success = await this.save();
    if (success) {
      return true;
    }
    return false;
  }
  get summaryFields(): model.FieldModel[] {
    return this.fields.filter((item) => item.options?.isSummary);
  }
  get cacheFlag(): string {
    return 'prints';
  }
  get groupTags(): string[] {
    if (
      ('isDeleted' in this._metadata && this._metadata.isDeleted === true) ||
      ('isDeleted' in this.metadata && this.metadata.isDeleted === true)
    ) {
      return ['已删除'];
    }
    return ['打印模板'];
  }
  override update(data: schema.XPrint): Promise<boolean> {
    return super.update(data);
  }
  async save(): Promise<boolean> {
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
      const data = await this.loadItems(speciesIds);
      this.fields = this.attributes
        .filter((i) => i.property && i.property.id)
        .map((attr) => {
          const field: model.FieldModel = {
            id: attr.id,
            rule: attr.rule,
            name: attr.name,
            widget: attr.widget,
            options: attr.options,
            code: `T${attr.propId}`,
            info: attr.code,
            remark: attr.remark,
            speciesId: attr.property?.speciesId,
            lookups: [],
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
                };
              });
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
  async loadReferenceForm(Id: string): Promise<schema.XPrint> {
    const data = await this.directory.resource.printColl.find([Id]);
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
      const uuid = formatDate(new Date(), 'yyyyMMddHHmmss');
      newMetaData.name = this.metadata.name + `-副本${uuid}`;
      newMetaData.code = this.metadata.code + uuid;
      newMetaData.id = 'snowId()';
    } /* else {
      await this.copyAutoProperties(destination);
    } */
    const data = await destination.resource.printColl.replace(newMetaData);
    if (data) {
      return await destination.resource.printColl.notity({
        data: data,
        operate: 'insert',
      });
    }
    return false;
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
      const data = await destination.resource.printColl.replace(newData);
      if (data) {
        await this.notify('remove', this.metadata);
        return await destination.resource.printColl.notity({
          data: data,
          operate: 'insert',
        });
      }
    }
    return false;
  }
  override operates(): model.OperateModel[] {
    /* if (this.canDesign) {
      return super.operates();
    }
    return [fileOperates.Copy, entityOperates.Remark]; */
    return [
      fileOperates.Copy,
      fileOperates.Rename,
      entityOperates.Open,
      entityOperates.Update,
      entityOperates.Delete,
    ];
  }
  async filterSummary(loadOptions: any): Promise<any[]> {
    const result = await this.loadSummary(loadOptions);
    return this.summaryFields.map((item) => {
      return result[item.code] ?? 0;
    });
  }
  async loadSummary(loadOptions: any): Promise<{ [key: string]: number }> {
    const filters = this.summaryFields;
    if (filters.length == 0) {
      return {};
    }
    const group: { [key: string]: any } = { key: [] };
    for (const field of filters) {
      group[field.code] = { _sum_: '$' + field.code };
    }
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
    const options = [{ match }, { group }, { limit: 1 }];
    const result = await kernel.collectionAggregate(
      this._metadata.shareId,
      this.belongId,
      [this.belongId],
      this.thingColl.collName,
      options,
    );
    return result.data && result.data.length > 0 ? result.data[0] : {};
  }
  async loadThing(loadOptions: any): Promise<LoadResult<any>> {
    loadOptions = loadOptions || {};
    loadOptions.options = loadOptions.options || {};
    loadOptions.options.match = loadOptions.options.match || {};
    loadOptions.options.match.isDeleted = false;
    loadOptions.options.match = {
      ...loadOptions.options.match,
      ...this.parseClassify(),
    };
    const res = await this.thingColl.loadResult(loadOptions);
    if (res.success && !Array.isArray(res.data)) {
      res.data = [];
    }
    res.totalCount = res.totalCount ?? 0;
    res.groupCount = res.groupCount ?? 0;
    res.summary = await this.filterSummary(loadOptions);
    return res;
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
  parseFilter() {
    let result: any[] = [];
    try {
      const range = this.metadata.options?.dataRange;
      if (range) {
        var { filterExp, authExp } = range;
        if (filterExp) {
          const filters = JSON.parse(filterExp);
          if (Array.isArray(filters)) {
            result.push(...filters);
            result = result.some((item) => Array.isArray(item)) ? result : [result];
          }
        }
        if (authExp) {
          authExp = authExp
            .replaceAll('person', this.userId)
            .replaceAll('company', this.target.spaceId);
          var company = this.target.space as ICompany;
          if (company) {
            for (const department of company.departments) {
              var dept = department.targets.find((a) => a.session.isMyChat);
              if (dept) {
                authExp = authExp.replaceAll('dept', dept.id);
              }
            }
          }
          let auth = JSON.parse(authExp);
          if (Array.isArray(auth)) {
            auth = auth.some((item) => Array.isArray(item)) ? auth : [auth];
            if (result.length > 0) {
              result.push('and', ...auth);
            } else {
              result = auth;
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
    return result;
  }
  async loadHistoryFlows(id: string): Promise<LoadResult<schema.XHistoryFlow[]>> {
    const flows = this.directory.resource.historyFlowColl;
    return await flows.loadResult({ options: { match: { oldInstanceId: id } } });
  }
  async loadHistoryFiles(id: string): Promise<LoadResult<schema.XHistoryFile[]>> {
    const files = this.directory.resource.historyFileColl;
    return await files.loadResult({ options: { match: { oldInstanceId: id } } });
  }
  /* async createReportTemporaryAttribute(data: any): Promise<schema.XProperty | undefined> {
    const files = this.directory.resource.propertyColl;
    const result = await files.insert({
      ...data,
      directoryId: this.metadata.id,
    });
    return result;
  } */
}

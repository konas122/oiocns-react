import _ from 'lodash';
import { IBelong, IForm, ITarget, IWork, TargetType, XCollection } from '../..';
import { common, kernel, model, schema } from '../../../base';
import { XObject } from '../../public/object';
import { Form } from '../../thing/standard/form';
import { ClosingOptions, IClosingOptions } from './config/closing';
import { Configuration, IConfiguration } from './config/depreciation';
import { IPeriod, Period } from './period';
import { IQuery, Query } from './statistics/query';
import { SumItem } from './statistics/summary';

export interface ChangeParams {
  offset: number;
  limit: number;
  between: [string, string];
  field?: model.FieldModel;
  symbol?: number;
  collName?: string;
  match?: { [key: string]: any };
  species?: string;
  node?: common.Node<SumItem>;
}

export interface SpeciesRecord {
  [propId: string]: {
    species: schema.XSpecies;
    speciesItems: schema.XSpeciesItem[];
  };
}

export interface SnapshotProps {
  prefix: string;
  path: string;
  query: IQuery;
  period: string;
  species: model.FieldModel;
  dimensions: model.FieldModel[];
  node: common.Node<SumItem>;
}

/** 财务接口 */
export interface IFinancial extends common.Emitter {
  /** 关键字 */
  key: string;
  /** 归属对象 */
  space: IBelong;
  /** 元数据 */
  metadata: schema.XFinancial;
  /** 初始化结账月 */
  initialized: string | undefined;
  /** 当前账期 */
  current: string | undefined;
  /** 折旧配置 */
  configuration: IConfiguration;
  /** 结账科目配置 */
  closingOptions: IClosingOptions;
  /** 缓存 */
  financialCache: XObject<schema.Xbase>;
  /** 账期集合 */
  periodColl: XCollection<schema.XPeriod>;
  /** 账期数据 */
  periods: IPeriod[];
  /** 当前查询方案 */
  query: IQuery | undefined;
  /** 查询方案集合 */
  queryColl: XCollection<schema.XQuery>;
  /** 变动集合 */
  changeColl: XCollection<schema.XChange>;
  /** 查询集合 */
  queries: IQuery[];
  /** 查询物的表单 */
  form: IForm | undefined;
  /** 查询负债表的表单 */
  balance: IForm | undefined;
  /** 填写负债表的办事 */
  work: IWork | undefined;
  /** 上报集团 */
  reports: schema.RelationParam[];
  /** 获取偏移的期数 */
  getOffsetPeriod(period: string, offset: number): string;
  /** 初始化账期 */
  setInitialize(period: string): Promise<void>;
  /** 设置当前账期 */
  setCurrent(period: string): Promise<void>;
  /** 设置查询条件 */
  setQuery(query: schema.XQuery): Promise<void>;
  /** 设置加载财务数据 */
  setBalance(form?: schema.XForm): Promise<void>;
  /** 设置查询条件 */
  setForm(form?: schema.XForm): Promise<void>;
  /** 设置加载财务数据办事 */
  setWork(application?: string, work?: string): Promise<void>;
  /** 设置上报集团 */
  setReports(reports: schema.RelationParam[]): Promise<void>;
  /** 清空结账日期 */
  clear(): Promise<void>;
  /** 加载分类明细项 */
  loadSpeciesItems(speciesId: string): Promise<schema.XSpeciesItem[]>;
  /** 加载所有分类项 */
  loadSpecies(props: schema.XProperty[], args?: any): Promise<SpeciesRecord>;
  /** 加载财务数据 */
  loadContent(): Promise<void>;
  /** 加载账期 */
  loadPeriods(
    reload?: boolean,
    skip?: number,
    take?: number,
    args?: any,
  ): Promise<IPeriod[]>;
  /** 加载查询方案 */
  loadQueries(reload?: boolean, skip?: number, args?: any): Promise<IQuery[]>;
  /** 加载表单 */
  loadForm(reload?: boolean): Promise<IForm | undefined>;
  /** 加载负债表 */
  loadBalance(reload?: boolean): Promise<IForm | undefined>;
  /** 加载办事 */
  loadWork(reload?: boolean): Promise<IWork | undefined>;
  /** 加载明细数据 */
  loadChanges(params: ChangeParams): Promise<model.LoadResult<schema.XChange[]>>;
  /** 删除明细数据 */
  removeChanges(data: schema.XChange): Promise<boolean>;
  /** 创建查询 */
  createQuery(metadata: schema.XQuery): Promise<schema.XQuery | undefined>;
  /** 生成账期 */
  createPeriod(period: string): Promise<schema.XPeriod | undefined>;
  /** 生成快照 */
  createSnapshots(period: string): Promise<void>;
  /** 生成集合 */
  genColl(period: string): XCollection<schema.XThing>;
  /** 读取快照 */
  findSnapshot(snapshotId: string): Promise<schema.XSnapshot | undefined>;
  /** 读取物 */
  findThing(period: string, id: string): Promise<schema.XThing | undefined>;
  /** 加载统计字段 */
  loadFields(reload?: boolean): Promise<model.FieldModel[]>;
  /** 获取查询快照的表单 */
  loadSnapshotForm(params: SnapshotProps): IForm | undefined;
  /** 上报状态数据 */
  reporting(period: schema.XPeriod): Promise<boolean>;
}

export class Financial extends common.Emitter implements IFinancial {
  constructor(belong: IBelong) {
    super();
    this.space = belong;
    this.metadata = {} as schema.XFinancial;
    this.configuration = new Configuration(this);
    this.closingOptions = new ClosingOptions(this);
    this.financialCache = new XObject(
      belong.metadata,
      'target-financial',
      [],
      [this.key],
    );
    this.changeColl = this.space.resource.genColl('_system-things-changed');
    this.periodColl = this.space.resource.genColl('financial-period');
    this.queryColl = this.space.resource.genColl('financial-query');
    this.snapshotColl = this.space.resource.genColl('_system-things-snapshot');
    this.periodColl.subscribe([this.key + '-period'], async (result) => {
      switch (result.operate) {
        case 'insert':
          this.periods.unshift(new Period(result.data, this));
          await this.setCurrent(result.data.period);
          break;
        case 'remove':
          this.periods = this.periods.filter((item) => item.id != result.data.id);
          this.periods = _.orderBy(
            this.periods,
            (item) => new Date(item.period).getTime(),
            'desc',
          );
          await this.periods[0]?.cancel();
          await this.setCurrent(this.periods[0]?.period);
          break;
        case 'update':
          this.periods.forEach((item) => {
            if (result.data.id == item.id) {
              item.updateMetadata(result.data);
            }
          });
          break;
        case 'refresh':
          for (const period of this.periods) {
            if (result.data.id == period.id) {
              await period.loadClosings(true);
            }
          }
          break;
        case 'clear':
          this.periods = [];
          break;
      }
      this.changCallback();
    });
    this.queryColl.subscribe([this.key + '-query'], async (result) => {
      switch (result.operate) {
        case 'insert':
          this.queries.unshift(new Query(result.data, this));
          break;
        case 'update':
          for (const item of this.queries) {
            if (result.data.id == item.id) {
              item.updateMetadata(result.data);
              await item.loadSpecies(true);
            }
          }
          break;
        case 'remove':
          this.queries = this.queries.filter((item) => item.id != result.data.id);
          break;
      }
      this.changCallback();
    });
  }
  work: IWork | undefined;
  balance: IForm | undefined;
  form: IForm | undefined;
  query: IQuery | undefined;
  configuration: IConfiguration;
  closingOptions: IClosingOptions;
  financialCache: XObject<schema.XFinancial>;
  metadata: schema.XFinancial;
  space: IBelong;
  periods: IPeriod[] = [];
  periodLoaded: boolean = false;
  periodColl: XCollection<schema.XPeriod>;
  queries: IQuery[] = [];
  queryLoaded: boolean = false;
  queryColl: XCollection<schema.XQuery>;
  formLoaded: boolean = false;
  balanceLoaded: boolean = false;
  workLoaded: boolean = false;
  changeColl: XCollection<schema.XChange>;
  snapshotColl: XCollection<schema.XSnapshot>;
  fields: model.FieldModel[] = [];
  fieldsLoaded: boolean = false;
  contentLoaded: boolean = false;
  get key() {
    return this.space.key + '-financial';
  }
  get initialized(): string | undefined {
    return this.metadata?.initialized;
  }
  get current(): string | undefined {
    return this.metadata?.current;
  }
  get reports(): schema.RelationParam[] {
    return this.metadata?.reports ?? [];
  }
  async loadContent(): Promise<void> {
    if (!this.contentLoaded) {
      this.contentLoaded = true;
      const financial = await this.financialCache.get<schema.XFinancial>('');
      if (financial) {
        this.metadata = financial;
      }
      await this.configuration.loadContent();
      await this.closingOptions.loadOptions();
      this.financialCache.subscribe('financial', (res: schema.XFinancial) => {
        this.metadata = res;
        this.changCallback();
      });
      this.financialCache.subscribe('initialized', (res: string) => {
        this.metadata.initialized = res;
        this.changCallback();
      });
      this.financialCache.subscribe('current', (res: string) => {
        this.metadata.current = res;
        this.changCallback();
      });
      this.financialCache.subscribe('query', (res: string) => {
        this.metadata.query = res;
        for (const query of this.queries) {
          if (query.id == res) {
            this.query = query;
            break;
          }
        }
        this.changCallback();
      });
      this.financialCache.subscribe('form', (res?: schema.XForm) => {
        this.form = res ? new Form(res, this.space.directory) : undefined;
        this.changCallback();
      });
      this.financialCache.subscribe('balance', (res?: schema.XForm) => {
        this.balance = res ? new Form(res, this.space.directory) : undefined;
        this.changCallback();
      });
      this.financialCache.subscribe(
        'work',
        async (res?: { application: string; work: string }) => {
          this.metadata.application = res?.application;
          this.metadata.work = res?.work;
          this.work = undefined;
          await this.loadWork(true);
          this.changCallback();
        },
      );
      this.financialCache.subscribe(
        'reports',
        (res?: { reports: schema.RelationParam[] }) => {
          this.metadata.reports = res?.reports;
          this.changCallback();
        },
      );
    }
  }
  async loadSpeciesItems(speciesId: string): Promise<schema.XSpeciesItem[]> {
    const items = await this.space.resource.speciesItemColl.loadResult({
      options: { match: { speciesId: speciesId } },
    });
    if (items.success) {
      return items.data;
    }
    return [];
  }
  async setInitialize(period: string): Promise<void> {
    if (await this.financialCache.set('initialized', period)) {
      await this.financialCache.notity('initialized', period, true, false);
    }
  }
  async setCurrent(period: string) {
    if (await this.financialCache.set('current', period)) {
      await this.financialCache.notity('current', period, true, false);
    }
  }
  async setQuery(query: schema.XQuery): Promise<void> {
    if (await this.financialCache.set('query', query.id)) {
      await this.financialCache.notity('query', query.id, true, false);
    }
  }
  async setBalance(form?: schema.XForm): Promise<void> {
    if (await this.financialCache.set('balance', form?.id)) {
      await this.financialCache.notity('balance', form, true, false);
    }
  }
  async setForm(form?: schema.XForm): Promise<void> {
    if (await this.financialCache.set('form', form?.id)) {
      await this.financialCache.notity('form', form, true, false);
    }
  }
  async setWork(application?: string, work?: string): Promise<void> {
    if (
      (await this.financialCache.set('application', application)) &&
      (await this.financialCache.set('work', work))
    ) {
      await this.financialCache.notity('work', { work, application }, true, false);
    }
  }
  async setReports(reports: schema.RelationParam[]): Promise<void> {
    if (await this.financialCache.set('reports', reports)) {
      await this.financialCache.notity('reports', { reports }, true, false);
    }
  }
  async clear(): Promise<void> {
    const periods = await this.loadPeriods(true);
    if (periods.length > 1) {
      throw new Error('存在多个账期，清空账期失败！');
    }
    for (const period of periods) {
      await period.clear();
    }
    await this.setCurrent(null!);
    await this.setInitialize(null!);
    const match = { belongId: this.space.id };
    if (await this.periodColl.removeMatch(match)) {
      await this.periodColl.notity({ operate: 'clear' });
    }
    await this.changeColl.removeMatch(match);
  }
  async createQuery(metadata: schema.XQuery): Promise<schema.XQuery | undefined> {
    const result = await this.queryColl.insert({
      ...metadata,
      typeName: '总账',
    });
    if (result) {
      await this.queryColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async loadQueries(
    reload: boolean = false,
    skip: number = 0,
    args?: any,
  ): Promise<IQuery[]> {
    if (!this.queryLoaded || reload) {
      this.queryLoaded = true;
      if (skip == 0) {
        this.queries = [];
      }
      const take = 20;
      const res = await this.queryColl.loadResult({
        skip: 0,
        take: take,
        options: {
          match: { typeName: '总账' },
        },
        ...(args || {}),
      });
      if (res.success) {
        if (res.data && res.data.length > 0) {
          this.queries = res.data.map((item) => {
            const query = new Query(item, this);
            if (item.id == this.metadata.query) {
              this.query = query;
            }
            return query;
          });
          if (this.queries.length < res.totalCount && res.data.length === take) {
            await this.loadQueries(true, this.queries.length);
          }
        }
      }
    }
    return this.queries;
  }
  async loadPeriods(
    reload: boolean = false,
    skip: number = 0,
    take: number = 12 * 6,
    loadOptions?: any,
  ): Promise<IPeriod[]> {
    if (!this.periodLoaded || reload) {
      this.periodLoaded = true;
      if (skip == 0) {
        this.periods = [];
      }
      let _belongId = this.space.id;
      if (loadOptions?.extraReations) {
        if (
          Array.isArray(loadOptions.extraReations) &&
          loadOptions.extraReations.length > 0
        ) {
          _belongId = loadOptions.extraReations.at(-1) as string;
        }
        if (typeof loadOptions.extraReations === 'string') {
          _belongId = loadOptions.extraReations;
        }
      }

      const res = await this.periodColl.loadResult({
        requireTotalCount: true,
        skip: skip,
        take: take,
        options: {
          match: {
            isDeleted: false,
            belongId: _belongId,
          },
          sort: {
            period: -1,
          },
        },
        ...(loadOptions || {}),
      });
      if (res.success) {
        if (res.data && res.data.length > 0) {
          this.periods.push(...res.data.map((item) => new Period(item, this)));
          if (this.periods.length < res.totalCount && res.data.length === take) {
            await this.loadPeriods(true, this.periods.length);
          }
        }
      }
    }
    return this.periods;
  }
  private async searchForm(id: string): Promise<IForm | undefined> {
    const form = await this.space.resource.formColl.loadResult({
      options: { match: { id } },
    });
    if (form.success && form.data && form.data.length > 0) {
      return new Form(form.data[0], this.space.directory);
    }
  }
  async loadForm(reload?: boolean | undefined): Promise<IForm | undefined> {
    if (!this.formLoaded || reload) {
      if (this.metadata.form) {
        this.formLoaded = true;
        this.form = await this.searchForm(this.metadata.form);
      }
    }
    return this.form;
  }
  async loadBalance(reload?: boolean | undefined): Promise<IForm | undefined> {
    if (!this.balanceLoaded || reload) {
      if (this.metadata.balance) {
        this.balanceLoaded = true;
        this.balance = await this.searchForm(this.metadata.balance);
      }
    }
    return this.balance;
  }
  async loadWork(reload?: boolean | undefined): Promise<IWork | undefined> {
    if (!this.workLoaded || reload) {
      if (this.metadata.application && this.metadata.work) {
        this.workLoaded = true;
        for (const application of await this.space.directory.loadAllApplication()) {
          const work = await application.searchFile(
            this.metadata.application,
            this.metadata.work,
          );
          if (work) {
            this.work = work as IWork;
            break;
          }
        }
      }
    }
    return this.work;
  }
  async loadSpecies(props: schema.XProperty[], args?: any): Promise<SpeciesRecord> {
    const result: SpeciesRecord = {};
    for (const prop of props) {
      switch (prop.valueType) {
        case '分类型':
        case '选择型': {
          const species = await this.space.resource.speciesColl.loadSpace({
            options: { match: { id: prop.speciesId } },
            ...(args || {}),
          });
          const speciesItems = await this.space.resource.speciesItemColl.loadSpace({
            options: { match: { speciesId: prop.speciesId } },
            ...(args || {}),
          });
          if (species.length > 0) {
            result['T' + prop.id] = {
              species: species[0],
              speciesItems: speciesItems.map((item) => {
                const result = { ...item, id: 'S' + item.id };
                if (result.parentId) {
                  result.parentId = 'S' + result.parentId;
                }
                return result;
              }),
            };
          }
          break;
        }
        case '用户型': {
          const target = this.space.targets.find((target) => target.id == prop.speciesId);
          if (target) {
            result['T' + prop.id] = this.toSpecies(target);
          }
          break;
        }
      }
    }
    return result;
  }
  toSpecies(dest: ITarget) {
    const species = {
      id: dest.id,
      name: dest.name,
      code: dest.code,
      remark: dest.remark,
      typeName: '分类',
      belongId: dest.space.id,
      shareId: dest.id,
      speciesItems: [],
      generateTargetId: dest.id,
    } as any as schema.XSpecies;
    const speciesItems: schema.XSpeciesItem[] = [];
    const genSpeciesItem = async (team: ITarget, parentId?: string) => {
      const toSpeciesItem = (target: schema.XTarget, parentId?: string) => {
        return {
          id: target.id,
          code: target.code,
          name: target.name,
          info: target.id,
          parentId: parentId,
          remark: target.name,
          icon: target.icon,
          belongId: dest.space.id,
          shareId: dest.id,
          typeName: '分类项',
        } as unknown as schema.XSpeciesItem;
      };
      const parent = toSpeciesItem(team.metadata, parentId);
      speciesItems.push(parent);
      for (const member of team.members) {
        if (member.typeName !== TargetType.Person) {
          toSpeciesItem(member, parent.id);
        }
      }
      for (const child of team.subTarget) {
        await genSpeciesItem(child, parent.id);
      }
    };
    genSpeciesItem(dest);
    return { species, speciesItems };
  }
  async loadChanges(params: ChangeParams): Promise<model.LoadResult<schema.XChange[]>> {
    const match: any = {
      ...params.match,
      changeTime: {
        _gte_: params.between[0],
        _lte_: params.between[1],
      },
      belongId: this.space.id,
    };
    if (params.field?.id) {
      match.propId = params.field.id;
    }
    if (params.symbol) {
      match.symbol = params.symbol;
    }
    if (params.species && params.node) {
      match[params.species] = {
        _in_: this.recursionNodes(params.node),
      };
    }
    const result = await this.changeColl.loadResult({
      options: { match },
      skip: params.offset,
      take: params.limit,
      requireTotalCount: true,
    });
    if (result.success && result.data.length > 0) {
      await this.bindings(result.data);
    }
    return result;
  }
  async bindings(changes: schema.XChange[]) {
    const snapshotIds = changes.map((i) => i.snapshotId).filter((s) => s != undefined);
    const snapshots = await this.loadSnapshots(snapshotIds);
    changes.forEach((item) => (item.snapshot = snapshots[item.snapshotId]));
    const filtered = changes.filter((i) => i.snapshot == undefined);
    const thingIds = filtered.map((i) => i.thingId).filter((i) => i != undefined);
    const things = await this.loadThings(thingIds);
    changes.forEach((item) => (item.thing = things[item.thingId]));
  }
  async loadSnapshots(ids: string[]) {
    const result = await this.snapshotColl.find(ids);
    const seed: { [key: string]: schema.XSnapshot } = {};
    result.forEach((p) => (seed[p.id] = p));
    return seed;
  }
  async loadThings(ids: string[]) {
    const result = await this.space.resource.thingColl.find(ids);
    const seed: { [key: string]: schema.XThing } = {};
    result.forEach((p) => (seed[p.id] = p));
    return seed;
  }
  private recursionNodes(node: common.Node<SumItem>) {
    const res: string[] = [node.id];
    for (const child of node.children) {
      res.push(...this.recursionNodes(child));
    }
    return res;
  }
  async createPeriod(period: string): Promise<schema.XPeriod | undefined> {
    const result = await this.periodColl.insert({
      period: period,
      depreciated: false,
      closed: false,
    } as schema.XPeriod);
    if (result) {
      await this.closingOptions.generateOptions(result.id);
      await this.reporting(result);
      await this.periodColl.notity({ data: result, operate: 'insert' });
    }
    return result;
  }
  getOffsetPeriod(period: string, offsetMonth: number): string {
    const currentMonth = new Date(period);
    const preMonth = new Date(currentMonth);
    preMonth.setMonth(currentMonth.getMonth() + offsetMonth);
    return common.formatDate(preMonth, 'yyyy-MM');
  }
  async createSnapshots(period: string): Promise<void> {
    await kernel.snapshotThing(this.space.id, [this.space.id], {
      collName: '_system-things',
      dataPeriod: period,
    });
  }
  genColl(period: string): XCollection<schema.XThing> {
    const coll = period == this.current ? '_system-things' : '_system-things_' + period;
    return this.space.resource.genColl<schema.XThing>(coll);
  }

  async findSnapshot(snapshotId: string): Promise<schema.XSnapshot | undefined> {
    const result = await this.snapshotColl.loadResult({
      options: { match: { id: snapshotId } },
    });
    if (result.success && result.data && result.data.length > 0) {
      return result.data[0];
    }
  }
  async findThing(period: string, id: string): Promise<schema.XThing | undefined> {
    const coll = this.genColl(period);
    const result = await coll.loadResult({ options: { match: { id: id } } });
    if (result.success && result.data && result.data.length > 0) {
      return result.data[0];
    }
  }
  async loadFields(reload?: boolean | undefined): Promise<model.FieldModel[]> {
    if (!this.fieldsLoaded || reload) {
      this.fieldsLoaded = true;
      this.fields = [];
      const fields = await this.space.resource.propertyColl.loadSpace({
        options: { match: { isChangeSource: true } },
      });
      const data = await this.loadItems(
        fields.filter((i) => i.speciesId).map((i) => i.speciesId),
      );
      for (const item of fields) {
        const field: model.FieldModel = {
          id: item.id,
          name: item.name,
          code: 'T' + item.id,
          valueType: item.valueType,
          remark: item.remark,
          isChangeSource: item.isChangeSource,
          isChangeTarget: item.isChangeTarget,
          isCombination: item.isCombination,
        };
        if (item.speciesId && item.speciesId.length > 0) {
          field.lookups = data
            .filter((i) => i.speciesId === item.speciesId)
            .map((i) => {
              return {
                id: i.id,
                code: i.code,
                text: i.name,
                value: `S${i.id}`,
                icon: i.icon,
                info: i.info,
                remark: i.remark,
                parentId: i.parentId,
              };
            });
        }
        this.fields.push(field);
      }
    }
    return this.fields;
  }
  async loadItems(speciesIds: string[]): Promise<schema.XSpeciesItem[]> {
    const ids = speciesIds.filter((i) => i && i.length > 0);
    if (ids.length < 1) return [];
    return await this.space.resource.speciesItemColl.loadSpace({
      options: {
        match: {
          speciesId: { _in_: ids },
        },
      },
    });
  }
  loadSnapshotForm(params: SnapshotProps): IForm | undefined {
    if (this.form) {
      const metadata: schema.XForm = {
        ...common.deepClone(this.form.metadata),
      };
      metadata.collName = this.form.metadata.collName ?? '_system-things';
      if (params.period != this.current) {
        metadata.collName = metadata.collName + '_' + params.period;
      }
      metadata.options = metadata.options || { itemWidth: 300 };
      metadata.options.dataRange = metadata.options.dataRange || {};
      const filter = JSON.parse(params.query.matches.time ?? '[]') ?? [];
      if (filter.length == 0) {
        filter.push(['id', '<>', null], 'and', ['id', '<>', '']);
      }
      metadata.options.dataRange.filterExp = JSON.stringify(filter);
      const nodes = this.recursionNodes(params.node);
      const match: any = { [params.species.id]: { _in_: nodes } };
      const path = params.path.split('-');
      for (let i = 0; i < params.dimensions.length; i++) {
        match[params.dimensions[i].id] = path[i + 1];
      }
      metadata.options.dataRange.classifyExp = JSON.stringify(match);
      return new Form(metadata, this.form.directory);
    }
  }
  async reporting(period: schema.XPeriod) {
    for (const report of this.reports) {
      await kernel.collectionReplace(
        report.targetId,
        report.belongId,
        report.relations,
        report.collName,
        period,
      );
    }
    return true;
  }
  async removeChanges(data: schema.XChange): Promise<boolean> {
    return this.changeColl.remove(data);
  }
}

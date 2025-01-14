import { IFinancial, SpeciesRecord } from '..';
import { IBelong, IEntity } from '../../..';
import { common, model, schema } from '../../../../base';
import { Entity } from '../../../public';
import { ISummary, SumItem, Summary, SummaryParams } from './summary';
import { limit } from '../period';

export type DimensionMap<T> = Map<string, DimensionMap<T> | any>;

export interface LedgerParams {
  records: SpeciesRecord;
  start: string;
  end: string;
  extraReations?: string | string[];
}

export interface IQuery extends IEntity<schema.XQuery> {
  /** 元数据 */
  metadata: schema.XQuery;
  /** 归属空间 */
  space: IBelong;
  /** 财务 */
  financial: IFinancial;
  /** 分类维度 */
  species: model.FieldModel;
  /** 统计维度 */
  dimensions: model.FieldModel[];
  /** 统计字段 */
  fields: model.FieldModel[];
  /** 排除影响维度 */
  excludes: model.FieldModel[];
  /** 统计对象 */
  summary: ISummary;
  /** 过滤配置 */
  matches: { [column: string]: any };
  /** 更新 */
  update(metadata: schema.XQuery): Promise<boolean>;
  /** 删除 */
  remove(): Promise<boolean>;
  /** 解析过滤 */
  parseMatch(key: string): { [key: string]: any };
  /** 总账 */
  ledgerSummary(params: LedgerParams): Promise<common.Tree<SumItem>>;
  /** 加载分类 */
  loadSpecies(reload?: boolean, props?: any, args?: any): Promise<SpeciesRecord>;
}

export class Query extends Entity<schema.XQuery> implements IQuery {
  constructor(metadata: schema.XQuery, financial: IFinancial) {
    super(metadata, []);
    this.financial = financial;
    this.summary = new Summary(financial.space);
  }
  summary: ISummary;
  financial: IFinancial;
  speciesLoaded: boolean = false;
  speciesItems: SpeciesRecord = {};
  get species(): model.FieldModel {
    return { ...this.metadata.species, id: 'T' + this.metadata.species.id };
  }
  get dimensions(): model.FieldModel[] {
    return this.metadata.dimensions.map((item) => {
      return { ...item, id: 'T' + item.id };
    });
  }
  get fields(): schema.XProperty[] {
    return this.metadata.fields.map((item) => {
      return { ...item, id: 'T' + item.id };
    });
  }
  get excludes(): model.FieldModel[] {
    return (this.metadata.excludes || []).map((item) => {
      return { ...item, id: 'T' + item.id };
    });
  }
  get allDimension(): model.FieldModel[] {
    return [this.species, ...this.dimensions];
  }
  get space(): IBelong {
    return this.financial.space;
  }
  get matches(): { [column: string]: any } {
    return this.metadata.matches ?? {};
  }
  async update(metadata: schema.XQuery): Promise<boolean> {
    const result = await this.financial.queryColl.replace({
      ...this.metadata,
      ...metadata,
      typeName: '总账',
    });
    if (result) {
      return await this.financial.queryColl.notity({ operate: 'update', data: result });
    }
    return false;
  }
  async remove(): Promise<boolean> {
    const result = await this.financial.queryColl.remove(this.metadata);
    if (result) {
      return await this.financial.queryColl.notity({
        operate: 'remove',
        data: this.metadata,
      });
    }
    return false;
  }
  async loadSpecies(reload?: boolean, props?: any, args?: any): Promise<SpeciesRecord> {
    if (!this.speciesLoaded || reload) {
      this.speciesLoaded = true;
      this.speciesItems = await this.financial.loadSpecies(
        props ?? [this.metadata.species, ...this.metadata.dimensions],
        args,
      );
    }
    return this.speciesItems;
  }
  async ledgerSummary(params: LedgerParams): Promise<common.Tree<SumItem>> {
    const getMonthParams = (key: string, month: string): SummaryParams => {
      let collName = '_system-things';
      if (month != this.financial.current) {
        collName = collName + '_' + month;
      }
      const match = common.filterConvert(this.matches[key]);
      return {
        collName: collName,
        match: {
          belongId: this.space.id,
          isDeleted: false,
          ...match,
        },
        dimensions: this.allDimension.map((item) => item.id),
        sumFields: this.fields.map((item) => item.id),
        limit: limit,
        extraReations: params?.extraReations,
      };
    };
    const getSymbolParams = (key: string, symbol: number): SummaryParams => {
      return {
        collName: '_system-things-changed',
        match: {
          belongId: this.space.id,
          changeTime: {
            _gte_: this.financial.getOffsetPeriod(params.start, 1),
            _lte_: params.end,
          },
          symbol: symbol,
          isDeleted: false,
          ...this.parseMatch(key),
        },
        dimensions: [...this.allDimension.map((item) => item.id), 'propId'],
        sumFields: ['change'],
        limit: limit,
        extraReations: params?.extraReations,
      };
    };
    return this.summary.summaries({
      species: this.metadata.species,
      dimensions: this.dimensions.map((item) => item.id),
      speciesRecord: params.records,
      fields: this.fields.map((item) => item.id),
      columns: [
        {
          key: 'before',
          title: '期初',
          params: getMonthParams('time', params.start),
        },
        {
          key: 'plus',
          title: '增加',
          params: getSymbolParams('plus', 1),
        },
        {
          key: 'minus',
          title: '减少',
          params: getSymbolParams('minus', -1),
        },
        {
          key: 'after',
          title: '期末',
          params: getMonthParams('time', params.end),
        },
      ],
      balance: (group: { [key: string]: number }) => {
        let r = group['before'] + group['plus'] - group['minus'] - group['after'];
        return Number(r.toFixed(2)) == 0;
      },
    });
  }
  parseMatch(key: string): { [key: string]: any } {
    return {
      _or_: [
        { labels: { _exists_: false } },
        { labels: { _size_: 0 } },
        { labels: { _nin_: this.excludes.map((item) => item.id) } },
      ],
      ...common.filterConvert(this.matches[key]),
    };
  }
}

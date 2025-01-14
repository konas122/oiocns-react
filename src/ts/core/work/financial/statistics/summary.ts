import { SpeciesRecord } from '..';
import { IBelong } from '../../..';
import { common, kernel, schema } from '../../../../base';

export type DataMap<T> = Map<string, DataMap<T> | any>;

export interface SummaryParams {
  collName: string;
  match: { [key: string]: any };
  dimensions: string[];
  sumFields: string[];
  limit: number;
  extraReations?: string | string[];
}

export interface SummaryRecursion<T> {
  dimensions: string[];
  speciesRecord: SpeciesRecord;
  dimensionPath: string;
  index?: number;
  context?: T;
  summary: (dimensionPath: string, context?: T) => void;
  buildNext?: (item: schema.XSpeciesItem, context: T) => T;
}

export interface SummaryColumn {
  key: string;
  title: string;
  params: SummaryParams;
}

export interface SummaryColumns {
  dimensions: string[];
  speciesRecord: SpeciesRecord;
  fields: string[];
  species: schema.XProperty;
  columns: SummaryColumn[];
  balance: (item: { [key: string]: number }) => boolean;
}

export interface SumItem extends schema.XSpeciesItem {
  balance: { [key: string]: boolean };
  [field: string]: any;
}

export interface ISummary {
  /** 归属空间 */
  space: IBelong;
  /** 汇总某个指标 */
  summary(params: SummaryParams): Promise<DataMap<any>>;
  /** 汇总所有指标列 */
  summaries(params: SummaryColumns): Promise<common.Tree<SumItem>>;
  /** 递归汇总分类树 */
  summaryRecursion<T>(params: SummaryRecursion<T>): void;
}

export class Summary implements ISummary {
  constructor(space: IBelong) {
    this.space = space;
  }
  space: IBelong;
  async summary(params: SummaryParams): Promise<DataMap<any>> {
    const data: DataMap<any> = new Map();
    if (params.sumFields.length == 0) {
      return data;
    }
    let match = { ...params.match };
    params.dimensions.forEach((item) => {
      match[item] = { _ne_: null };
    });
    let group: any = { key: params.dimensions };
    params.sumFields.forEach((item) => {
      group[item] = { _sum_: '$' + item };
    });
    let _targetId = this.space.id;
    let _belongId = this.space.id;
    let _relations = [this.space.id];

    if (params?.extraReations) {
      if (Array.isArray(params.extraReations) && params.extraReations.length > 0) {
        _relations = _relations.concat(params.extraReations);
        _targetId = params.extraReations.at(-1) as string;
      }

      if (typeof params.extraReations === 'string') {
        _relations.push(params.extraReations);
        _targetId = params.extraReations;
      }
      delete params.extraReations;
      match.belongId = _targetId;
    }
    const result = await kernel.collectionAggregate(
      _targetId,
      _belongId,
      _relations,
      params.collName,
      [{ match }, { group }, { limit: params.limit }],
    );
    if (result.success && Array.isArray(result.data)) {
      for (const item of result.data) {
        let dimension = data;
        for (let index = 0; index < params.dimensions.length; index++) {
          const property = params.dimensions[index];
          const value = item[property];
          if (!dimension.has(value)) {
            if (index == params.dimensions.length - 1) {
              dimension.set(value, item);
            } else {
              dimension.set(value, new Map<string, any>());
            }
          }
          dimension = dimension.get(value);
        }
      }
    }
    return data;
  }
  summaryRecursion<T>(params: SummaryRecursion<T>) {
    params.index = params.index ?? 0;
    if (params.index == params.dimensions.length) {
      params.summary(params.dimensionPath, params.context);
      return;
    }
    const current = params.dimensions[params.index];
    const record = params.speciesRecord[current] ?? { speciesItems: [] };
    for (const item of record.speciesItems) {
      const next = params.context ? params.buildNext?.(item, params.context) : undefined;
      this.summaryRecursion({
        ...params,
        dimensionPath: params.dimensionPath + '-' + item.id,
        context: next,
        index: params.index + 1,
      });
    }
  }
  async summaries(params: SummaryColumns): Promise<common.Tree<SumItem>> {
    const summaryData: DataMap<any> = new Map();
    await Promise.all(
      params.columns.map(async (column) => {
        const res = await this.summary(column.params);
        return summaryData.set(column.key, res);
      }),
    );

    const nodes: SumItem[] = [];
    const record = params.speciesRecord['T' + params.species.id] ?? [];
    const speciesItems = [
      {
        ...record.species,
        info: record.species.remark,
        speciesId: record.species.id,
      } as any as schema.XSpeciesItem,
      ...record.speciesItems,
    ];
    for (let index = 0; index < speciesItems.length; index++) {
      const one: SumItem = { ...speciesItems[index], balance: {} };
      if (!one.parentId && one.id != one.speciesId) {
        one.parentId = one.speciesId;
      }
      const speciesData: DataMap<any> = new Map();
      for (const column of params.columns) {
        let data = summaryData.get(column.key)?.get(speciesItems[index].id) ?? new Map();
        speciesData.set(column.key, data);
      }
      this.summaryRecursion<DataMap<any>>({
        speciesRecord: params.speciesRecord,
        dimensions: params.dimensions,
        dimensionPath: 'root',
        context: speciesData,
        summary: (path, context) => {
          for (const dimensionField of params.fields) {
            const group: { [key: string]: number } = {};
            for (const column of params.columns) {
              const key = column.key + '-' + path + '-' + dimensionField;
              const item = context?.get(column.key);
              if (item instanceof Map) {
                for (const sumField of column.params.sumFields) {
                  one[key] = Number(item?.get(dimensionField)?.[sumField] ?? 0);
                }
              } else {
                one[key] = Number(item?.[dimensionField] ?? 0);
              }
              group[column.key] = one[key];
            }
            one.balance[path + '-' + dimensionField] = params.balance(group);
          }
        },
        buildNext: (item, context) => {
          const next: DataMap<any> = new Map();
          for (const column of params.columns) {
            next.set(column.key, context.get(column.key)?.get(item.id) ?? new Map());
          }
          return next;
        },
      });
      nodes.push(one);
    }
    const tree = new common.AggregateTree(
      nodes,
      (item) => item.id,
      (item) => item.parentId,
    );
    tree.summary((previous, current) => {
      this.summaryRecursion({
        speciesRecord: params.speciesRecord,
        dimensions: params.dimensions,
        dimensionPath: 'root',
        summary: (path) => {
          for (const dimensionField of params.fields) {
            const group: { [key: string]: number } = {};
            for (const column of params.columns) {
              const key = column.key + '-' + path + '-' + dimensionField;
              previous[key] += current[key];
              group[column.key] = previous[key];
            }
            previous.balance[path + '-' + dimensionField] = params.balance(group);
          }
        },
      });
      return previous;
    });
    return tree;
  }
}

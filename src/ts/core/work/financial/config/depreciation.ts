import { IFinancial, SpeciesRecord } from '..';
import { model, schema } from '../../../../base';
import { XObject } from '../../../public/object';

/** 配置字段 */
export type ConfigField = keyof schema.XConfiguration;

export interface IConfiguration {
  /** 元数据 */
  metadata?: schema.XConfiguration;
  /** 财务 */
  financial: IFinancial;
  /** 分类维度 */
  dimensions: model.FieldModel[];
  /** 当前统计维度 */
  curDimension: model.FieldModel | undefined;
  /** 原值字段 */
  originalValue: model.FieldModel | undefined;
  /** 折旧字段 */
  accumulated: model.FieldModel | undefined;
  /** 开始计算日期 */
  startDate: model.FieldModel | undefined;
  /** 净值字段 */
  netWorth: model.FieldModel | undefined;
  /** 会计科目字段 */
  accounting: model.FieldModel | undefined;
  /** 折旧方式字段 */
  methodField: model.FieldModel | undefined;
  /** 月折旧额 */
  monthlyAmount: model.FieldModel | undefined;
  /** 已计提月份 */
  accruedMonths: model.FieldModel | undefined;
  /** 使用年限 */
  usefulLife: model.FieldModel | undefined;
  /** 折旧状态 */
  depreciationStatus: model.FieldModel | undefined;
  /** 折旧方法 */
  yearAverage: string | undefined;
  /** 计提中状态 */
  accruingStatus: string | undefined;
  /** 完成计提状态 */
  accruedStatus: string | undefined;
  /** 过滤条件 */
  filterExp: { [key: string]: string } | undefined;
  /** 排除字段 */
  excludes: model.FieldModel[];
  /** 新增字段 */
  customFields: model.FieldModel[];
  /** 加载内容 */
  loadContent(): Promise<void>;
  /** 检查折旧配置 */
  checkConfig(): boolean;
  /** 设置元数据 */
  setMetadata(config: schema.XConfiguration): Promise<void>;
  /** 设置会计科目字段 */
  setAccounting(prop: schema.XProperty): Promise<void>;
  /** 设置当前统计维度 */
  setCurDimension(prop: schema.XProperty): Promise<void>;
  /** 设置当前过滤条件 */
  setFilterExp(filter: { [key: string]: string }): Promise<void>;
  /** 设置排除字段 */
  setExcludes(props: schema.XProperty[]): Promise<void>;
  /** 加载分类 */
  loadSpecies(reload?: boolean): Promise<SpeciesRecord>;
  /** 加载新增字段 */
  setCustomFields(props: schema.XProperty[]): Promise<void>;
}

export class Configuration implements IConfiguration {
  constructor(financial: IFinancial, metadata?: schema.XConfiguration) {
    this.financial = financial;
    this.metadata = metadata;
    this.cache = new XObject(financial.space.metadata, this.key, [], [this.key]);
  }
  speciesLoaded: boolean = false;
  financial: IFinancial;
  metadata?: schema.XConfiguration;
  cache: XObject<schema.XConfiguration>;
  speciesRecord: SpeciesRecord = {};
  get key() {
    return 'depreciation-config';
  }
  get excludes() {
    return (this.metadata?.excludes ?? []).map((item) => {
      return { ...item, id: 'T' + item.id };
    });
  }
  get customFields() {
    return (this.metadata?.customFields ?? []).map((item) => {
      return { ...item, id: 'T' + item.id };
    });
  }
  get dimensions() {
    return (this.metadata?.dimensions ?? []).map((item) => {
      return { ...item, id: 'T' + item.id };
    });
  }
  get curDimension() {
    return this.field('curDimension');
  }
  get originalValue() {
    return this.field('originalValue');
  }
  get accumulated() {
    return this.field('accumulatedDepreciation');
  }
  get accounting() {
    return this.field('accounting');
  }
  get startDate() {
    return this.field('startDate');
  }
  get netWorth() {
    return this.field('netWorth');
  }
  get methodField() {
    return this.field('depreciationMethod');
  }
  get monthlyAmount() {
    return this.field('monthlyDepreciationAmount');
  }
  get accruedMonths() {
    return this.field('accruedMonths');
  }
  get usefulLife() {
    return this.field('usefulLife');
  }
  get depreciationStatus() {
    return this.field('depreciationStatus');
  }
  get yearAverage() {
    return this.metadata?.yearAverageMethod;
  }
  get accruingStatus() {
    return this.metadata?.accruingStatus;
  }
  get accruedStatus() {
    return this.metadata?.accruedStatus;
  }
  private field(key: schema.XProperties) {
    return this.metadata?.[key]
      ? {
          ...this.metadata[key],
          id: 'T' + this.metadata[key].id,
        }
      : undefined;
  }
  get filterExp() {
    return this.metadata?.filterExp;
  }
  async loadContent(): Promise<void> {
    const config = await this.cache.get<schema.XConfiguration>('');
    if (config) {
      this.metadata = config;
    }
    this.cache.subscribe('configuration', (res: schema.XConfiguration) => {
      this.metadata = res;
      this.financial.changCallback();
    });
    this.cache.subscribe('accounting', (res: schema.XProperty) => {
      if (!this.metadata) {
        this.metadata = {} as schema.XConfiguration;
      }
      this.metadata.accounting = res;
      this.financial.changCallback();
    });
    this.cache.subscribe('curDimension', (res: schema.XProperty) => {
      if (!this.metadata) {
        this.metadata = {} as schema.XConfiguration;
      }
      this.metadata.curDimension = res;
      this.financial.changCallback();
    });
    this.cache.subscribe('filterExp', (res: { [key: string]: string }) => {
      if (!this.metadata) {
        this.metadata = {} as schema.XConfiguration;
      }
      this.metadata.filterExp = res;
      this.financial.changCallback();
    });
    this.cache.subscribe('excludes', (res: schema.XProperty[]) => {
      if (!this.metadata) {
        this.metadata = {} as schema.XConfiguration;
      }
      this.metadata.excludes = res;
      this.financial.changCallback();
    });
    this.cache.subscribe('customFields', (res: schema.XProperty[]) => {
      if (!this.metadata) {
        this.metadata = {} as schema.XConfiguration;
      }
      this.metadata.customFields = res;
      this.financial.changCallback();
    });
  }
  checkConfig(): boolean {
    if (!this.metadata) {
      return false;
    }
    const fields: ConfigField[] = [
      'dimensions',
      'depreciationMethod',
      'yearAverageMethod',
      'depreciationStatus',
      'accruingStatus',
      'accruedStatus',
      'originalValue',
      'accumulatedDepreciation',
      'monthlyDepreciationAmount',
      'netWorth',
      'startDate',
      'accruingStatus',
      'accruedStatus',
    ];
    for (const field of fields) {
      if (!this.metadata[field]) {
        return false;
      }
    }
    return true;
  }
  async setMetadata(config: schema.XConfiguration): Promise<void> {
    const combine = {
      ...config,
      filterExp: config.filterExp ?? this.metadata?.filterExp,
      curDimension: config.curDimension ?? this.metadata?.curDimension,
      accounting: config.accounting ?? this.metadata?.accounting,
    };
    if (await this.cache.set('', combine)) {
      await this.cache.notity('configuration', config, true, false);
    }
  }
  async setAccounting(prop: schema.XProperty): Promise<void> {
    if (await this.cache.set('accounting', prop)) {
      await this.cache.notity('accounting', prop, true, false);
    }
  }
  async setCurDimension(prop: schema.XProperty): Promise<void> {
    if (await this.cache.set('curDimension', prop)) {
      await this.cache.notity('curDimension', prop, true, false);
    }
  }
  async setFilterExp(filter: { [key: string]: string }): Promise<void> {
    if (await this.cache.set('filterExp', filter)) {
      await this.cache.notity('filterExp', filter, true, false);
    }
  }
  async setExcludes(props: schema.XProperty[]): Promise<void> {
    if (await this.cache.set('excludes', props)) {
      await this.cache.notity('excludes', props, true, false);
    }
  }
  async setCustomFields(props: schema.XProperty[]): Promise<void> {
    if (await this.cache.set('customFields', props)) {
      await this.cache.notity('customFields', props, true, false);
    }
  }
  async loadSpecies(reload: boolean = false): Promise<SpeciesRecord> {
    const keys = Object.keys(this.speciesRecord);
    const refresh = this.dimensions.some((item) => !keys.includes(item.id));
    if (!this.speciesLoaded || reload || refresh) {
      this.speciesLoaded = true;
      this.speciesRecord = await this.financial.loadSpecies(
        this.metadata?.dimensions ?? [],
      );
    }
    return this.speciesRecord;
  }
}

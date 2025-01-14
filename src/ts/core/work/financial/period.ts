import { filterConvert } from '@/ts/base/common';
import { XOperationLog } from '@/ts/base/schema';
import { setDefaultField } from '@/ts/scripting/core/services/FormService';
import _ from 'lodash';
import { SpeciesRecord } from '.';
import { IBelong, IEntity, IFinancial, XCollection } from '../..';
import { common, kernel, model, schema } from '../../../base';
import { Entity } from '../../public';
import { ISummary, SumItem, Summary } from './statistics/summary';
import { formatNumber } from '@/utils';

export type Operation = 'Calculate' | 'Confirm' | 'Revoke';
export enum OperationStatus {
  Ready = 1,
  Working,
  Error,
  Stop,
  Completed,
}

interface SummaryParams {
  dimension: schema.XProperty;
  record: SpeciesRecord;
}

export const limit = (2 << 15) - 1;

/**
 * 账期
 */
export interface IPeriod extends IEntity<schema.XPeriod> {
  /** 归属空间 */
  space: IBelong;
  /** 账期 */
  financial: IFinancial;
  /** 元数据 */
  metadata: schema.XPeriod;
  /** 资产负债表 */
  balanceSheet: schema.XThing | undefined;
  /** 年度 */
  annual: string;
  /** 月度 */
  monthly: string;
  /** 期间 */
  period: string;
  /** 是否已折旧 */
  deprecated: boolean;
  /** 是否已结账 */
  closed: boolean;
  /** 汇总接口 */
  summary: ISummary;
  /** 结账科目 */
  closings: schema.XClosing[];
  /** 科目集合 */
  closingsColl: XCollection<schema.XClosing>;
  /** 负债表集合 */
  balanceColl: XCollection<schema.XThing>;
  /** 获取上一个月日期 */
  getPrePeriod(): string;
  /** 获取下一个月日期 */
  getNextPeriod(): string;
  /** 计提折旧 */
  depreciation(type: Operation): Promise<XOperationLog | undefined>;
  /** 获取折旧科目 */
  loadClosings(reload?: boolean): Promise<schema.XClosing[]>;
  /** 月结账 */
  monthlySettlement(): Promise<void>;
  /** 反结账 */
  reverseSettlement(): Promise<void>;
  /** 试算平衡 */
  trialBalance(): Promise<schema.XClosing[]>;
  /** 加載操作日志 */
  loadOperationLog(): Promise<XOperationLog | undefined>;
  /** 刷新元数据 */
  loadMetadata(): Promise<schema.XPeriod | undefined>;
  /** 折旧统计 */
  depreciationSummary(params: SummaryParams): Promise<common.Tree<SumItem>>;
  /** 月结统计 */
  closingSummary(): Promise<schema.XClosing[]>;
  /** 获取负债表数据 */
  loadBalance(): Promise<schema.XThing | undefined>;
  /** 获取表单数据 */
  loadBalanceForm(): Promise<model.FormEditData>;
  /** 解析过滤 */
  parseMatch(key: string): { [key: string]: any };
  /** 清空数据 */
  clear(): Promise<boolean>;
  /** 移除 */
  remove(): Promise<void>;
  /** 取消结账 */
  cancel(): Promise<void>;
  /** 更新 */
  update(metadata: schema.XPeriod): Promise<void>;
}

export class Period extends Entity<schema.XPeriod> implements IPeriod {
  constructor(metadata: schema.XPeriod, financial: IFinancial) {
    super(metadata, []);
    this.space = financial.space;
    this.financial = financial;
    this.operationColl = this.space.resource.genColl('operation-log');
    this.summary = new Summary(financial.space);
    this.closings = [];
    this.closingsColl = financial.space.resource.genColl('financial-closings');
    this.balanceColl = financial.space.resource.genColl('financial-balance');
    let collName = `_system-things_${metadata.period}`;
    this.snapshotColl = financial.space.resource.genColl(collName);
  }
  closings: schema.XClosing[];
  balanceSheet: schema.XThing | undefined;
  operationColl: XCollection<schema.XOperationLog>;
  space: IBelong;
  financial: IFinancial;
  summary: ISummary;
  closingsColl: XCollection<schema.XClosing>;
  closingLoaded: boolean = false;
  balanceColl: XCollection<schema.XThing>;
  snapshotColl: XCollection<schema.XThing>;
  get annual(): string {
    return this.metadata.period.substring(0, 4);
  }
  get monthly(): string {
    return this.metadata.period.substring(5);
  }
  get deprecated() {
    return this.metadata.depreciated;
  }
  get closed() {
    return this.metadata.closed;
  }
  get period() {
    return this.metadata.period;
  }
  async depreciation(operation: Operation): Promise<schema.XOperationLog | undefined> {
    const res = await kernel.depreciationThing(this.space.id, [this.space.id], {
      id: this.metadata.id,
      type: operation,
    });
    if (res.success) {
      return res.data;
    } else {
      throw new Error(res.msg);
    }
  }
  async loadOperationLog(): Promise<XOperationLog | undefined> {
    if (this.metadata.operationId) {
      const result = await this.operationColl.loadResult({
        options: {
          match: { id: this.metadata.operationId },
        },
      });
      if (result.success && result.data && result.data.length > 0) {
        return result.data[0];
      }
    }
  }
  async loadMetadata(): Promise<schema.XPeriod | undefined> {
    const result = await this.financial.periodColl.loadResult({
      options: {
        match: { id: this.metadata.id },
      },
    });
    if (result.success && result.data && result.data.length > 0) {
      this.setMetadata(result.data[0]);
      await this.financial.periodColl.notity(
        { operate: 'update', data: this.metadata },
        true,
      );
      return this.metadata;
    }
  }
  async monthlySettlement(): Promise<void> {
    if (!this.deprecated) {
      throw new Error('未折旧，无法结账！');
    }
    if (this.closed) {
      throw new Error('已结账，无法再次结账！');
    }
    const closings = await this.trialBalance();
    if (closings.filter((item) => !item.balanced).length > 0) {
      throw new Error('存在不平项！');
    }
    const result = await kernel.depreciationThing(this.space.id, [this.space.id], {
      id: this.metadata.id,
      type: 'Close',
    });
    if (result.success) {
      await this.update({ ...this.metadata, closed: true });
      await this.financial.createPeriod(this.getNextPeriod());
    }
  }
  async reverseSettlement(): Promise<void> {
    if (this.closed) {
      throw new Error('本月已结账，无法反结账！');
    }
    if (this.deprecated) {
      throw new Error('本月已折旧，无法反结账！');
    }
    const result = await this.financial.loadChanges({
      offset: 0,
      limit: 1,
      between: [this.period, this.period],
      match: { isDeleted: false },
    });
    if (result.totalCount > 0) {
      throw new Error('本月已产生业务信息，无法反结账！');
    }
    await this.financial.changeColl.removeMatch({
      instanceId: this.metadata.id,
      belongId: this.metadata.belongId,
      changeTime: this.metadata.period,
    });
    await this.remove();
  }
  async cancel(): Promise<void> {
    await this.update({ ...this.metadata, closed: false });
  }
  async remove(): Promise<void> {
    const success = await this.financial.periodColl.remove(this.metadata);
    await this.financial.reporting({ ...this.metadata, isDeleted: true });
    if (success) {
      await this.financial.periodColl.notity({ operate: 'remove', data: this.metadata });
    }
  }
  async loadClosings(reload?: boolean | undefined): Promise<schema.XClosing[]> {
    if (reload || !this.closingLoaded) {
      const result = await this.closingsColl.loadResult({
        options: {
          match: { periodId: this.metadata.id },
        },
      });
      if (result.success) {
        this.closings = result.data;
      }
    }
    return this.closings.sort((f, s) => (f.code ?? '').localeCompare(s.code ?? ''));
  }
  async trialBalance(): Promise<schema.XClosing[]> {
    if (this.closed) {
      throw new Error('已结账，无法试算平衡！');
    }
    const closings = await this.closingSummary();
    if (closings.length == 0) {
      throw new Error('未配置结账科目，无法结账！');
    }
    await this.closingsColl.replaceMany(closings);
    return closings;
  }
  getPrePeriod(): string {
    return this.financial.getOffsetPeriod(this.period, -1);
  }
  getNextPeriod(): string {
    return this.financial.getOffsetPeriod(this.period, 1);
  }
  async update(metadata: schema.XPeriod): Promise<void> {
    const success = await this.financial.periodColl.replace(metadata);
    if (success) {
      await this.financial.periodColl.notity({ operate: 'update', data: metadata });
      await this.financial.reporting(metadata);
    }
  }
  async depreciationSummary(params: SummaryParams): Promise<common.Tree<SumItem>> {
    const propId = this.financial.configuration.accumulated?.id ?? '-1';
    return this.summary.summaries({
      species: params.dimension,
      speciesRecord: params.record,
      dimensions: [],
      fields: ['change'],
      columns: [
        {
          key: 'current',
          title: '本月折旧',
          params: {
            collName: '_system-things-changed',
            match: {
              belongId: this.space.id,
              propId,
              changeTime: this.period,
              name: '计提折旧',
              ...this.parseMatch('plus'),
            },
            dimensions: ['T' + params.dimension.id],
            sumFields: ['change'],
            limit: limit,
          },
        },
        {
          key: 'plus',
          title: '本期其他增加',
          params: {
            collName: '_system-things-changed',
            match: {
              belongId: this.space.id,
              propId,
              changeTime: this.period,
              name: {
                _ne_: '计提折旧',
              },
              ...this.parseMatch('plus'),
              symbol: 1,
            },
            dimensions: ['T' + params.dimension.id],
            sumFields: ['change'],
            limit: limit,
          },
        },
        {
          key: 'minus',
          title: '本期减少',
          params: {
            collName: '_system-things-changed',
            match: {
              belongId: this.space.id,
              propId,
              changeTime: this.period,
              symbol: -1,
              ...this.parseMatch('minus'),
            },
            dimensions: ['T' + params.dimension.id],
            sumFields: ['change'],
            limit: limit,
          },
        },
      ],
      balance: () => {
        return true;
      },
    });
  }
  async closingSummary(): Promise<schema.XClosing[]> {
    const accountingProp = this.financial.configuration.metadata?.accounting;
    const accountingField = this.financial.configuration.accounting;
    if (!accountingProp || !accountingField) {
      throw new Error('未配置会计科目！');
    }
    const closings = await this.loadClosings();
    const uniqueClosings = Array.from(
      new Map(closings.map((item) => [item.code, item])).values(),
    );
    const record = await this.financial.loadSpecies([accountingProp]);
    const start = this.financial.getOffsetPeriod(this.period, -1);
    const result: schema.XClosing[] = [];
    for (const item of uniqueClosings) {
      const sid = 'S' + item.accountingValue;
      const amountId = 'T' + item?.amount?.id;
      const answer = await this.summary.summaries({
        species: accountingProp,
        speciesRecord: record,
        dimensions: [],
        fields: [amountId],
        columns: [
          {
            key: 'start',
            title: '期初',
            params: {
              collName: '_system-things_' + start,
              match: {
                belongId: this.space.id,
                [accountingField.id]: sid,
                isDeleted: false,
                ...filterConvert(this.financial.configuration.filterExp?.time ?? '[]'),
              },
              dimensions: [accountingField.id],
              sumFields: [amountId],
              limit: limit,
            },
          },
          {
            key: 'plus',
            title: '本期增加',
            params: {
              collName: '_system-things-changed',
              match: {
                belongId: this.space.id,
                propId: amountId,
                changeTime: this.period,
                [accountingField.id]: sid,
                symbol: 1,
                isDeleted: false,
                ...this.parseMatch('plus'),
              },
              dimensions: [accountingField.id, 'propId'],
              sumFields: ['change'],
              limit: limit,
            },
          },
          {
            key: 'minus',
            title: '本期减少',
            params: {
              collName: '_system-things-changed',
              match: {
                belongId: this.space.id,
                propId: amountId,
                changeTime: this.period,
                [accountingField.id]: sid,
                symbol: -1,
                isDeleted: false,
                ...this.parseMatch('minus'),
              },
              dimensions: [accountingField.id, 'propId'],
              sumFields: ['change'],
              limit: limit,
            },
          },
          {
            key: 'end',
            title: '期末',
            params: {
              collName: '_system-things',
              match: {
                belongId: this.space.id,
                [accountingField.id]: sid,
                isDeleted: false,
                ...filterConvert(this.financial.configuration.filterExp?.time ?? '[]'),
              },
              dimensions: [accountingField.id],
              sumFields: [amountId],
              limit: limit,
            },
          },
        ],
        balance: (item) => {
          let r = item['start'] + item['plus'] - item['minus'] - item['end'];
          return Number(r.toFixed(2)) == 0;
        },
      });
      const balance = await this.loadBalance();
      for (const child of answer.root.children.flatMap((item) => item.children)) {
        if (child.id == 'S' + item.accountingValue) {
          item.assetStartAmount = child.data['start-root-' + amountId];
          item.assetAddAmount = child.data['plus-root-' + amountId];
          item.assetSubAmount = child.data['minus-root-' + amountId];
          item.assetEndAmount = child.data['end-root-' + amountId];
          item.assetBalanced = child.data.balance['root-' + amountId];
          if (balance) {
            item.financialAmount = balance['T' + item.financial.id];
          }
          const first = formatNumber(item.assetEndAmount ?? 0, 2);
          const second = formatNumber(item.financialAmount ?? 0, 2);
          item.balanced = first == second;
          break;
        }
      }
      result.push(item);
    }
    return result;
  }
  parseMatch(key: string): { [key: string]: any } {
    const excludes = this.financial.configuration.excludes.map((item) => item.id);
    return {
      _or_: [
        { labels: { _exists_: false } },
        { labels: { _size_: 0 } },
        { labels: { _nin_: excludes } },
      ],
      ...common.filterConvert(this.financial.configuration.filterExp?.[key] ?? '[]'),
    };
  }
  async loadBalance(): Promise<schema.XThing | undefined> {
    const form = await this.financial.loadBalance();
    if (form) {
      const result = await form.loadThing({
        options: {
          match: {
            period: this.metadata.period,
            belongId: this.space.id,
            isDeleted: false,
          },
        },
      });
      if (result.success && result.data && result.data.length > 0) {
        let list: schema.XThing[] = result.data;
        list = _.orderBy(list, (d) => new Date(d.createTime).getTime(), 'desc');
        return list[0];
      }
    }
  }
  async loadBalanceForm(): Promise<model.FormEditData> {
    let form = await this.financial.loadBalance();
    let data = await this.loadBalance();
    let result: any = {};
    if (form) {
      if (data) {
        result.id = data.id;
        let fields = await form.loadFields();
        for (let field of fields) {
          result[field.id] = data[field.code];
        }
      } else {
        let things = await kernel.createThing(this.financial.space.id, [], form.name);
        if (things.success && things.data && things.data.length > 0) {
          result = things.data[0];
          await setDefaultField(result, form.fields, this.financial.space);
        }
      }
    }
    return {
      before: [],
      after: Object.keys(result).length > 0 ? [result] : [],
      nodeId: 'nodeId',
      creator: this.financial.space.user.id,
      formName: form ? form.name : '',
      createTime: common.formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss.S'),
      rules: [],
    };
  }
  async clear(): Promise<boolean> {
    if (this.deprecated) {
      throw new Error(this.period + '已折旧，清空失败！');
    }
    if (this.closed) {
      throw new Error(this.period + '已结账，清空失败！');
    }
    const closings = await this.loadClosings(true);
    await this.closingsColl.removeMany(closings);
    this.closingLoaded = false;
    return true;
  }
}

import { schema } from '@/ts/base';
import { IFinancial } from '..';
import { XCollection } from '@/utils/excel';

export interface IClosingOptions {
  /** 元数据 */
  options: schema.XClosingOption[];
  /** 财务 */
  financial: IFinancial;
  /** 结账科目集合 */
  optionsColl: XCollection<schema.XClosingOption>;
  /** 加载科目配置 */
  loadOptions(reload?: boolean): Promise<schema.XClosingOption[]>;
  /** 创建一个科目 */
  create(option: schema.XClosingOption): Promise<schema.XClosingOption | undefined>;
  /** 更新一个科目 */
  update(option: schema.XClosingOption): Promise<schema.XClosingOption | undefined>;
  /** 删除一个科目 */
  remove(option: schema.XClosingOption): Promise<boolean>;
  /** 清空所有配置 */
  clear(): Promise<boolean>;
  /** 生成账期科目 */
  generateOptions(periodId: string): Promise<schema.XClosing[]>;
}

export class ClosingOptions implements IClosingOptions {
  constructor(financial: IFinancial) {
    this.financial = financial;
    this._options = [];
    this.optionsColl = financial.space.resource.genColl('financial-closing-options');
    this.closingsColl = financial.space.resource.genColl('financial-closings');
    this.optionsColl.subscribe([this.key], (result) => {
      switch (result.operate) {
        case 'insert':
          this._options.unshift(result.data);
          break;
        case 'update':
          this._options.forEach((item) => {
            if (result.data.id == item.id) {
              Object.assign(item, result.data);
            }
          });
          break;
        case 'remove':
          this._options = this._options.filter((item) => item.id != result.data.id);
          break;
      }
      this.financial.changCallback();
    });
  }
  get key() {
    return this.financial.key + '-closing-options';
  }
  _options: schema.XClosingOption[];
  financial: IFinancial;
  optionsColl: XCollection<schema.XClosingOption>;
  optionLoaded: boolean = false;
  closingsColl: XCollection<schema.XClosing>;
  get options() {
    return this._options.sort().reverse();
  }
  async loadOptions(
    reload?: boolean | undefined,
    skip = 0,
  ): Promise<schema.XClosingOption[]> {
    if (reload || !this.optionLoaded) {
      this.optionLoaded = true;
      if (skip == 0) {
        this._options = [];
      }
      const take = 100;
      const res = await this.optionsColl.loadResult({
        skip: skip,
        take: take,
      });
      if (res.success) {
        if (res.data && res.data.length > 0) {
          this._options.push(...res.data);
          if (this._options.length < res.totalCount && res.data.length === take) {
            await this.loadOptions(true, this._options.length);
          }
        }
      }
    }
    return this.options;
  }
  async create(
    option: schema.XClosingOption,
  ): Promise<schema.XClosingOption | undefined> {
    const result = await this.optionsColl.insert(option);
    if (result) {
      await this.optionsColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async update(
    option: schema.XClosingOption,
  ): Promise<schema.XClosingOption | undefined> {
    const result = await this.optionsColl.replace(option);
    if (result) {
      await this.optionsColl.notity({ data: result, operate: 'update' });
      return result;
    }
  }
  async remove(option: schema.XClosingOption): Promise<boolean> {
    const result = await this.optionsColl.remove(option);
    if (result) {
      return await this.optionsColl.notity({ data: option, operate: 'remove' });
    }
    return result;
  }
  async generateOptions(periodId: string): Promise<schema.XClosing[]> {
    await this.loadOptions();
    return this.closingsColl.insertMany(
      this.options.map((item) => {
        return {
          code: item.code,
          name: item.name,
          accountingValue: item.accountingValue,
          amount: item.amount,
          financial: item.financial,
          periodId: periodId,
          balanced: false,
          assetStartAmount: 0,
          assetAddAmount: 0,
          assetSubAmount: 0,
          assetEndAmount: 0,
          financialAmount: 0,
        } as schema.XClosing;
      }),
    );
  }
  async clear(): Promise<boolean> {
    const options = await this.loadOptions(true);
    await this.optionsColl.removeMany(options);
    this.optionLoaded = false;
    return true;
  }
}

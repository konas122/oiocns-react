import { IService } from '../types/service';
import { kernel } from '../../../base';
import { deepClone, getAsyncTime } from '@/ts/base/common';
import { Sequence } from '@/ts/core/thing/standard/sequence';
import { XThing } from '@/ts/base/schema';
import { model } from '@/ts/base';
import FormServiceBase from '../services/FormServiceBase';
import message from '@/utils/message';
import { isUndefined } from 'lodash';
import _ from 'lodash';

export default class SplitHandler implements IService {
  readonly service: FormServiceBase;
  constructor(service: FormServiceBase) {
    this.service = service;
  }
  // 拆分子表id
  splitDetailFormId: string = '';
  // 拆分主表id
  splitPrimaryFormId: string = '';
  // 子表被拆分属性
  detailSplitFields: model.FieldModel[] = [];
  // 子表新增资产的序列
  detailConditions: model.FieldModel[] = [];
  // 当前修改的属性字段id
  curFieldId: string = '';
  // 当前主表的拆分规则
  splitRule: model.Rule<model.RuleType> | undefined;
  // 当前操作是否为拆分类型
  isSplitType: boolean = false;
  // 当前被拆分的资产
  curSplitAsset: XThing | undefined;
  // 被修改过的数据
  changeData: XThing[] = [];
  // 最终整理的数据
  finalData: XThing[] = [];
  // 初始化
  init() {
    return false;
  }
  // 销毁
  dispose() {}

  /**
   * 执行办事中的拆分规则
   * @param primaryFormId 主表id
   * @param curFieldId 当前修改的属性字段id
   * @returns
   */
  runWorkSplitRules(primaryFormId: string, curFieldId: string) {
    const splitRule = this.service.model.node.formRules.find(
      (i) => i.type === 'combination' && i.applyType === '拆分',
    );
    if (!splitRule) {
      message.warn('请配置拆分规则');
      return;
    }

    // 当前修改的属性不是被标记的特殊字段
    if (
      ![
        splitRule.combination?.splitType?.id,
        splitRule.combination?.splitNumber?.id,
        splitRule.combination?.assetSource.id,
      ].includes(curFieldId)
    ) {
      return false;
    }

    if (!splitRule.combination?.assetSource?.id) {
      message.error('请完善拆分规则');
      return;
    }

    const data = deepClone(this.service.formData.primary[primaryFormId]);
    if (!data[splitRule.combination!.splitTarget!.id]) {
      message.error('未查询到拆分依据');
      return;
    }

    this.curFieldId = curFieldId;
    this.splitRule = splitRule;
    this.splitDetailFormId = splitRule.combination?.detailFormId || '';
    this.splitPrimaryFormId = primaryFormId;
    const splitNum = data[splitRule.combination!.splitNumber!.id];
    const splitType = data[splitRule.combination!.splitType!.id];
    this.loadDetailFields();

    if (!this.detailConditions[0]?.options) {
      message.warn('请为子表添加序列号规则');
      return;
    }

    this.removeNonAlphabetKeys(
      this.service.formData.primary[this.splitPrimaryFormId][
        this.splitRule!.combination!.assetSource.id
      ],
    );
    const fieldData = this.service.model.fields[primaryFormId].find(
      (item) => item.id === splitRule.combination?.splitType?.id,
    );
    const attr = fieldData?.lookups?.find((i) => i.value === splitType);
    if (attr && splitType === attr.value) {
      switch (attr.info) {
        /** 一卡一物 */
        case '1':
          this.calculateAll(data, data[this.splitRule.combination!.splitTarget!.id]);
          break;
        case '2':
        case '3':
          if (splitNum) {
            this.calculateAll(data, splitNum);
          } else {
            message.warn(attr.info === '2' ? '请输入自由拆分的数值' : '请输入均分的数值');
          }
          break;
        default:
          break;
      }
    }
  }

  /** 计算 */
  async calculateAll(data: XThing, splitNum: number) {
    const splitTarget = this.splitRule!.combination!.splitTarget!.id;
    if (splitNum > data[splitTarget]) {
      message.error('拆分数值不能大于原资产数值');
      return;
    }
    if (data[splitTarget] === 1) {
      message.error('数量为1的资产不可拆分');
      return;
    }
    if (!this.curSplitAsset) return message.error('未找到需要拆分的资产');
    const newThing: XThing[] = [];
    const res = await kernel.createThing(this.service.belong.id, [], '', splitNum);
    if (!res.success) {
      message.error('唯一标识生成失败，请稍后重试！');
      return false;
    }

    const id = this.changeData.find((i) => i.id === this.curSplitAsset!.id);

    for (let i = 0; i < splitNum; i++) {
      let newAsset = deepClone(this.curSplitAsset);
      for (const key of this.detailSplitFields) {
        if (data[key.id] && ['数值型', '货币型'].includes(key.valueType)) {
          const splitRatio = Math.floor(data[splitTarget] / splitNum);
          // 计算每份的大致值
          const avgValue = Number(data[key.id] / data[splitTarget]);
          newAsset[key.id] = Number((avgValue * splitRatio).toFixed(2));
          if (i === splitNum - 1) {
            const remainder = Number((avgValue * splitRatio).toFixed(2)) * 100;
            newAsset[key.id] = Number(
              (data[key.id] - (remainder * (splitNum - 1)) / 100).toFixed(2),
            );
          }
        }
      }

      if (!id ? i !== splitNum - 1 : true) {
        newAsset['id'] = res.data[i].id;
        newAsset['updateTime'] = res.data[i].updateTime;
        newAsset[this.detailConditions[0].id] = await this.asyncSplitGeneateConditions();
        this?.detailConditions[1]?.id
          ? (newAsset[this?.detailConditions[1]?.id] =
              await this.asyncSplitKeyGeneateConditions())
          : '';
      }

      /** 保留原数据的部分内容不被更改 */
      if (i === splitNum - 1 && !id) {
        newAsset['id'] = this.curSplitAsset.id;
      }
      newThing.push({ ...newAsset });
    }
    this.commandDetailForm([...this.changeData, ...newThing]);
  }

  /** 通知子表变更 */
  commandDetailForm(data: XThing[]) {
    this.service.command.emitter('change', 'assignment', {
      formId: this.splitDetailFormId,
      value: this.curFieldId,
      data: data,
    });
  }

  /** 加载子表字段 */
  loadDetailFields() {
    const allDetailFields = this.service.model.fields[this.splitDetailFormId];
    const detailConditions = allDetailFields.filter(
      (item) => item.options?.asyncGeneateConditions !== undefined,
    );
    const detailSplitFields = allDetailFields.filter(
      (item) => item.isCombination === true,
    );
    this.detailSplitFields = detailSplitFields;
    this.detailConditions = detailConditions;
  }

  /** 拆分序列号生成 */
  async asyncSplitGeneateConditions() {
    let ret = '';
    for (const rule of this.detailConditions[0].options!.asyncGeneateConditions!.sort(
      (pre: { order: any }, next: { order: any }) =>
        Number(pre.order) - Number(next.order),
    )) {
      switch (rule.encodeType.label) {
        case '常量':
          ret += rule.encodeValue;
          break;
        case '时间':
          ret += getAsyncTime(rule.dimensionalAccuracy.label);
          break;
        case '流水':
          var se = await new Sequence(
            rule.sequence,
            this.service.belong.directory,
          ).genValue();
          if (se == '') {
            console.error('生成序号失败!');
          }
          ret += se;
          break;
        default:
          break;
      }
    }
    return ret;
  }

  /** 拆分资产编号生成 */
  async asyncSplitKeyGeneateConditions() {
    let ret = '';
    for (const rule of this.detailConditions[1].options!.asyncGeneateConditions!.sort(
      (pre: { order: any }, next: { order: any }) =>
        Number(pre.order) - Number(next.order),
    )) {
      switch (rule.encodeType.label) {
        case '常量':
          ret += rule.encodeValue;
          break;
        case '时间':
          ret += getAsyncTime(rule.dimensionalAccuracy.label);
          break;
        case '流水':
          var se = await new Sequence(
            rule.sequence,
            this.service.belong.directory,
          ).genValue();
          if (se == '') {
            console.error('生成资产编号失败!');
          }
          ret += se;
          break;
        default:
          break;
      }
    }
    return ret;
  }

  async splitRecount(splitNum: number) {
    if (this.curSplitAsset) {
      if (splitNum > this.curSplitAsset[this.splitRule!.combination!.splitTarget!.id]) {
        return message.error('拆分数值不能大于原资产数值');
      }
      const detailAllDatas = this.service.model.data[this.splitDetailFormId];
      const [matchedItems, _unmatchedItems] = _.partition(
        detailAllDatas[0].after,
        (obj) => _.includes(this.service.model.changeItems, obj.id),
      );
      this.changeData = matchedItems;
      this.detailSplitFields.forEach((f) => {
        matchedItems.forEach((c) => {
          const curValue = Number(this.curSplitAsset![f.id]) || 0;
          const subValue = Number(c[f.id]) || 0;
          this.curSplitAsset![f.id] = curValue - subValue;
        });
      });
      this.calculateAll(this.curSplitAsset, splitNum);
    }
  }

  /** 删除对象中不是以字母开头的属性  */
  removeNonAlphabetKeys(objStr: string) {
    const data = JSON.parse(objStr)[0];
    let newData: any = {};
    let filteredData: any = {};
    let otherData: any = {};
    for (let key in data) {
      if (/^[T]/.test(key)) {
        filteredData[key] = data[key];
      }
      if (/^[a-z]/.test(key)) {
        otherData[key] = data[key];
      }
    }
    const allDetailFields = this.service.model.fields[this.splitDetailFormId];
    allDetailFields.forEach((c) => {
      if (!isUndefined(filteredData[c.code])) {
        newData[c.id] = filteredData[c.code];
      }
    });
    if (Object.keys(newData).length > 0) {
      this.curSplitAsset = { ...newData, ...otherData };
    }
  }
}

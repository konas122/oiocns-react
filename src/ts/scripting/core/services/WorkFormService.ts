import { model, schema } from '@/ts/base';
import {
  FieldModel,
  NodeCodeRule,
  NodeValidateRule,
  ValidateErrorInfo,
} from '@/ts/base/model';
import CodeRuleNode from '../graph/node/CodeRuleNode';
import ValidateRuleNode from '../graph/node/ValidateRuleNode';
import { FormChangeEvent } from '../types/rule';
import EventEmitter, { EventListener } from '../util/EventEmitter';
import FormServiceBase from './FormServiceBase';
import { IBelong } from '@/ts/core';
import { DetailOperationType, FormType } from '../types/service';
import { mixins } from '@/ts/base/common/lang/mixin';
import { mapErrorToValidateInfo } from '../../js/util';
import { IReportReception } from '@/ts/core/work/assign/reception/report';
import message from '@/utils/message';
import { genCode } from './FormService';
import _ from 'lodash';

export interface FormEventMap {
  /** 内部（计算和汇总）触发的表单值变更 */
  // valueChange: EventListener<FormChangeEvent>;
  /** 渲染规则值变更 */
  // renderChange: EventListener<RenderRule>;
  /** 计算完成的事件 */
  afterCalculate: EventListener<FormChangeEvent[]>;
  /** 批量更新事件 */
  batchUpdate: EventListener<FormChangeEvent[]>;
  /** 校验完成的事件 */
  afterValidate: EventListener<ValidateErrorInfo[]>;
}

export default class WorkFormService extends mixins(
  FormServiceBase,
  EventEmitter<FormEventMap>,
) {
  static createStandalone(
    belong: IBelong,
    form: schema.XForm,
    fields?: FieldModel[],
    allowEdit = false,
    data: model.FormEditData[] = [],
  ): WorkFormService {
    const model: model.InstanceDataModel = {
      node: {
        primaryForms: [form],
        detailForms: [],
        formRules: [],
        executors: [],
        id: 'nodeId',
        documentConfig: form.documentConfig,
      } as any,
      fields: {
        [form.id]: fields || [],
      },
      data:
        data.length > 0
          ? {
              [form.id]: data,
            }
          : {},
      primary: {},
      rules: [],
    };
    const ret = new WorkFormService(belong, model, allowEdit);
    ret.init();
    return ret;
  }

  protected autoCalculate = true;

  dispose() {
    super.dispose();
    this.clearListeners();
  }

  /**
   * 全部计算
   * @returns 变更对象
   */
  async calculateAll() {
    let changes = await this.executable.calculateAll();
    for (const change of changes) {
      this.model.primary[change.destId] = change.value;
    }
    this.dispatchEvent('afterCalculate', changes);
    return changes;
  }

  /**
   * 手动执行代码规则
   * @param rule 代码规则
   * @returns 脚本的返回值
   */
  async executeCodeRule(rule: NodeCodeRule, errors: ValidateErrorInfo[] = []) {
    const node = new CodeRuleNode(rule);
    let [errs, changes] = await this.executable.calculateNode(node);

    if (Array.isArray(errs) && errors) {
      errors.push(...errs.filter((item) => item.errorLevel && item.message));
    }
    this.dispatchEvent('batchUpdate', changes);
    for (const item of changes) {
      this.command.emitter('change', 'result', item);
    }
    return changes;
  }
  /**
   * 执行提交前代码规则
   * @param errors 錯誤信息
   */
  async executeSubmitRule(errors: ValidateErrorInfo[]) {
    const rule: any = this.model.node.formRules.filter(
      (i) => i.type === 'code' && i.triggerTiming == 'submit',
    );

    if (rule) {
      for (const ruleItem of rule) {
        await this.executeCodeRule(ruleItem, errors);
      }
    }
  }
  /**
   * 全部校验
   * @returns 校验结果
   */
  async validateAll(errors: ValidateErrorInfo[] = []) {
    errors.push(...(await this.validate.validateAll()));
    this.handlingResult(errors);
    return errors;
  }

  handlingResult(result: ValidateErrorInfo[]) {
    const fieldMap = (result as model.RequiredValidateError[])
      .filter((err) => err.formId && err.field)
      .map((item) => item.field.id);
    for (let key in this.formInfo) {
      const formInfo = this.formInfo[key];
      if (formInfo.typeName == '工作表') {
        continue;
      }
      let formId = formInfo.form.id;
      formInfo.form.attributes.forEach((attribute) => {
        this.command.emitter('valid', 'isRequired', {
          formId: formId,
          destId: attribute.id,
          value: !fieldMap.includes(attribute.id),
        });
      });
    }
    // this.command.emitter('validate', 'errors', result);
    this.dispatchEvent('afterValidate', result);
  }

  /**
   * 主子表赋值规则
   * @returns
   */
  async assignment() {
    // 过滤所有符合条件的赋值规则
    const assignmentRules = this.model.node.formRules.filter(
      (i) => i.type === 'assignment' && i.ruleType === 'mainToDetail',
    );

    if (assignmentRules.length > 0) {
      // 遍历所有匹配的规则
      for (const assignmentRule of assignmentRules) {
        const detailFormId = assignmentRule.assignments![0].detail.formId;
        const detailDatas = this.formData.detail[detailFormId];

        for (const key in detailDatas) {
          if (Object.prototype.hasOwnProperty.call(detailDatas, key)) {
            const curDetail = detailDatas[key];

            // 遍历每个规则中的 assignments
            for (let i = 0; i < assignmentRule.assignments!.length; i++) {
              const assignment = assignmentRule.assignments![i];
              const primaryFormData =
                this.formData.primary[assignment.primary.formId][assignment.primary.id];
              curDetail[assignment.detail.trigger] = primaryFormData;
            }
          }
        }
        /** 通知变更子表更新 */
        this.command.emitter('change', 'assignment', {
          formId: detailFormId,
          data: Object.values(this.formData.detail[detailFormId]),
        });
      }
      return true;
    }
    return false;
  }

  /**
   * 字段给字段赋值规则
   * @returns {Promise<boolean>}
   */
  async fieldAssignment(): Promise<boolean> {
    // 筛选符合条件的赋值规则
    const assignmentRules = this.model.node.formRules.filter(
      (i) => i.type === 'assignment' && i.ruleType === 'fieldToField',
    );

    if (assignmentRules.length === 0) return false;

    for (const assignmentRule of assignmentRules) {
      // 跳过没有 fieldAssignments 的规则
      if (!assignmentRule.fieldAssignments) continue;

      for (const assignmentItem of assignmentRule.fieldAssignments) {
        // 解构字段数据
        const { type: assignmentType, primary, detail } = assignmentItem;
        const { formId: primaryFormId, trigger: primaryTrigger } = primary;
        const { formId: detailFormId, trigger: detailTrigger } = detail;

        // 获取数据源
        const datas =
          assignmentType === 'mainToMain'
            ? this.formData.primary[primaryFormId]
            : this.formData.detail[detailFormId];

        if (!datas) continue;

        // 遍历数据进行赋值
        for (const key in datas) {
          if (!Object.prototype.hasOwnProperty.call(datas, key)) continue;

          const curData = datas[key];
          if (typeof curData === 'object') {
            curData[detailTrigger] = curData[primaryTrigger];
          } else {
            datas[detailTrigger] = datas[primaryTrigger];
          }
        }

        // 通知变更
        if (assignmentType === 'mainToMain') {
          this.command.emitter('change', 'result', {
            formId: primaryFormId,
            destId: detailTrigger,
            value: datas[detailTrigger],
          });
        } else {
          // 通知子表更新
          this.command.emitter('change', 'assignment', {
            formId: detailFormId,
            data: Object.values(datas),
          });
        }
      }
    }
    return true;
  }

  // 资产拆分校验
  async assetSplit() {
    const splitRule = this.model.node.formRules.find(
      (i) => i.type === 'combination' && i.applyType === '拆分',
    );
    if (splitRule) {
      const { detailConditions, detailFields } = this.loadDetailCombinationFields(
        splitRule.combination?.detailFormId || '',
      );
      const primaryCardNumD = this.model.primary[detailConditions[0].id];
      const detailsData =
        this.model.data[splitRule.combination?.detailFormId || ''][0].after;

      // 校验子表卡片编号的完整性
      const isIncludeCardNum = detailsData
        .map((i) => i[detailConditions[0].id])
        .find((num) => num === primaryCardNumD);

      if (isIncludeCardNum) {
        return await this.verifySplit(detailFields, detailsData);
      } else {
        message.error('子表卡片缺失');
        return false;
      }
    }
    return false;
  }

  async verifySplit(detailFields: model.FieldModel[], detailsData: schema.XThing[]) {
    let result: boolean = true;
    for (let i = 0; i < detailFields.length; i++) {
      const field = detailFields[i];
      const curFieldDatas = detailsData.map((detail) => Number(detail[field.id]));

      if (
        _.sum(curFieldDatas).toFixed(2) != Number(this.model.primary[field.id]).toFixed(2)
      ) {
        message.show(`${field.name}总计错误,拆分后账单不平`, 'error', 5000);
        result = false;
      }
    }
    return result;
  }

  // 拆分重新计算
  async splitRecount(splitNum: number) {
    this.split.splitRecount(splitNum);
  }

  /** 资产合并计算  */
  async assetMerge() {
    // 合并规则
    const mergeRule = this.model.node.formRules.find(
      (i) => i.type === 'combination' && i.applyType === '合并',
    );
    if (mergeRule) {
      // 合并的目标资产
      const mergePrimaryAsset =
        this.formData.primary[mergeRule.combination!.assetSource.formId][
          mergeRule.combination!.assetSource.id
        ];
      if (mergePrimaryAsset) {
        // 合并的目标资产的id
        const mergePrimaryAssetId = JSON.parse(mergePrimaryAsset)[0].id;
        // 核销表标记
        const verificationFormId = mergeRule.combination!.verificationFormId;
        // 变更表标记
        const detailFormId = this.model.node.detailForms.find(
          (i) => i.id !== verificationFormId,
        )?.id;
        if (!verificationFormId) {
          message.error('请添加核销子表');
          return false;
        }
        if (detailFormId) {
          const detailFormDatas = this.formData.detail[detailFormId];
          const fields = this.loadDetailCombinationFields(detailFormId).detailFields;
          // 合并的目标资产
          const targetAsset = detailFormDatas[mergePrimaryAssetId];
          const newThing: schema.XThing[] = [];
          // 合并计算相加
          for (const key in detailFormDatas) {
            if (Object.prototype.hasOwnProperty.call(detailFormDatas, key)) {
              const element = detailFormDatas[key];
              if (element.id !== targetAsset.id) {
                for (let i = 0; i < fields.length; i++) {
                  const curentFields = fields[i];
                  if (['数值型', '货币型'].includes(curentFields.valueType)) {
                    targetAsset[curentFields.id] = targetAsset[curentFields.id] +=
                      element[curentFields.id];
                  }
                }
                newThing.push(element);
              }
            }
          }

          /** 通知变更子表更新 */
          this.command.emitter('change', 'combination', {
            formId: detailFormId,
            data: [targetAsset],
          });
          /** 通知核销子表更新 */
          this.command.emitter('change', 'combination', {
            formId: verificationFormId,
            data: newThing,
          });
          return true;
        } else {
          message.error('请完善合并规则');
          return false;
        }
      } else {
        message.error('合并目标资产为空');
        return false;
      }
    } else {
      message.warn('请完善合并规则');
      return false;
    }
  }

  /** 加载子表受组合办事影响的字段 */
  loadDetailCombinationFields(detailFormId: string) {
    // 当前子表的字段值
    const allDetailCombinationFields = this.model.fields[detailFormId];
    const detailConditions = allDetailCombinationFields.filter(
      (item) => item.options?.asyncGeneateConditions !== undefined,
    );
    // 当前子表的受组合办事影响的字段
    const detailFields = allDetailCombinationFields.filter(
      (item) => item.isCombination === true,
    );
    return {
      detailConditions: detailConditions,
      detailFields: detailFields,
    };
  }

  /**
   * 手动执行校验规则
   * @param rule 校验规则
   * @returns 错误信息
   */
  async executeValidateRule(rule: NodeValidateRule) {
    const node = new ValidateRuleNode(rule);
    return this.validate.validateNode(node);
  }

  /**
   * 直属下级汇总
   * @param svc 报表实例
   * @returns 变更对象
   */
  async summaryDirectChildren(report: IReportReception) {
    const sum = await report.summaryDirectChildren();
    const changes: FormChangeEvent[] = [];
    for (const [formId, data] of Object.entries(sum)) {
      const formInfo = this.formInfo[formId];
      if (!formInfo) {
        console.warn(`找不到表单 ${formId}，汇总数据将被忽略`);
        continue;
      }
      if (formInfo.typeName == '工作表') {
        continue;
      }

      const form = formInfo.form;
      const attrs = form.attributes.map((a) => a.id);
      for (const [attrId, value] of Object.entries(data)) {
        if (value == null) {
          continue;
        }
        if (!attrs.includes(attrId)) {
          continue;
        }
        const find = Object.values(form.sheets).find(
          (item) => item.attributeId == attrId,
        );
        for (const [cell, cellValue] of Object.entries(value)) {
          changes.push({
            formId,
            sheet: find.code,
            destId: cell,
            value: cellValue,
          });
        }
      }
    }
    this.dispatchEvent('batchUpdate', changes);
    return changes;
  }

  /**
   * 全部汇总
   * @param svc 报表实例
   * @returns 变更对象
   */
  async summaryAll(report: IReportReception, recursive = false, mode: 1 | 2 = 1) {
    const f = mode == 2 ? report.summaryAllV2 : report.summaryAll;
    const sum = await f.call(report, recursive);
    const changes: FormChangeEvent[] = [];
    for (const [formId, data] of Object.entries(sum)) {
      const formInfo = this.formInfo[formId];
      if (!formInfo) {
        console.warn(`找不到表单 ${formId}，汇总数据将被忽略`);
        continue;
      }
      if (formInfo.typeName == '工作表') {
        continue;
      }

      const form = formInfo.form;
      const attrs = form.attributes.map((a) => a.id);
      for (const [attrId, value] of Object.entries(data)) {
        if (value == null) {
          continue;
        }

        if (!attrs.includes(attrId)) {
          continue;
        }

        changes.push({
          formId,
          destId: attrId,
          value,
        });
      }
    }

    this.dispatchEvent('batchUpdate', changes);
    return changes;
  }

  async runRuleEffects(formType: FormType, formId: string, field: string) {
    if (this.allowEdit && !this.hasReport) {
      try {
        for (const item of await this.calculateAll()) {
          this.command.emitter('change', 'result', item);
        }
      } catch (error) {
        console.error(error);
        this.handlingResult([
          mapErrorToValidateInfo(
            error,
            formType + ' ' + (this.formInfo[formId]?.form.name ?? formId) + ' ' + field,
          ),
        ]);
      }
    }

    if (formType === '主表') {
      const formInfo = this.formInfo[formId];
      if (formInfo.typeName == '工作表') {
        return;
      }

      const form = formInfo.form;
      if (form.options?.businessType === '拆分') {
        this.split.runWorkSplitRules(formId, field);
      }
      const changes = this.render.runWorkRules(formId, field, (params) => {
        return params.formId
          ? this.model.data[params.formId].at(-1)?.after[0][field]
          : undefined;
      });
      for (const rule of changes) {
        this.model.rules = this.model.rules.filter((item) => {
          return item.formId != rule.formId && item.destId != rule.destId;
        });
        this.model.rules.push(rule);
        this.command.emitter('change', rule.typeName, rule);
      }
    }
  }

  async onPrimaryFieldChanged(formId: string, field: string) {
    const data = this.model.data[formId].at(-1)?.after[0];
    if (data) {
      this.updatePrimaryData(formId, data);
    }

    this.runRuleEffects('主表', formId, field);
  }

  async onDetailDataChanged(
    formId: string,
    type: DetailOperationType | 'all',
    rows: schema.XThing[],
  ) {
    switch (type) {
      case 'add':
      case 'update':
        for (const row of rows) {
          this.formData.detail[formId][row.id] = row;
        }
        break;
      case 'remove':
        for (const row of rows) {
          delete this.formData.detail[formId][row.id];
        }
        break;
      case 'all':
        this.updateDetailData(formId, rows);
        break;
      default:
        break;
    }

    this.runRuleEffects('子表', formId, type);
  }

  /** 处理子表数据选择后 执行内容 */
  beforeSelectedData = async (
    values: schema.XThing[],
    fields: FieldModel[],
  ): Promise<void> => {
    const pickFields = fields.filter((field) => {
      const { options } = field;
      return options?.autoSelectedFill && options.asyncGeneateConditions;
    });
    if (values.length == 0 || pickFields.length == 0) return;
    for (const item of values) {
      for (const field of pickFields) {
        if (item[field.id]) continue;
        item[field.id] = await genCode(field, this.belong);
      }
    }
  };
}

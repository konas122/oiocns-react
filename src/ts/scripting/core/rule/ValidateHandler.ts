import { ValidateRefGraph } from '../graph';
import { GraphNode } from '../graph/node';
import FormServiceBase from '../services/FormServiceBase';
import { ValidateResult } from '../types/rule';
import { IService } from '../types/service';
import {
  RequiredValidateError,
  RuleValidateError,
  ValidateErrorInfo,
} from '@/ts/base/model';
import { AssertResult } from '../util/AssertResult';
import { XValidation } from '@/ts/base/schema';
import _ from 'lodash';
import { isReport } from '../util/report';

export function isRequiredValidateError(
  error: ValidateErrorInfo,
): error is RequiredValidateError {
  return (error as any).formId && (error as any).field;
}

export function isRuleValidateError(
  error: ValidateErrorInfo,
): error is RuleValidateError {
  return (error as any).formId && (error as any).rule;
}

export default class ValidateHandler implements IService {
  readonly service: FormServiceBase;

  readonly graph: ValidateRefGraph;

  validationInfo: XValidation[] = [];

  constructor(service: FormServiceBase, allowEdit = true) {
    this.service = service;
    this.graph = new ValidateRefGraph(service, allowEdit);
  }

  dispose() {
    this.graph.nodeList = {};
  }

  init() {
    try {
      this.graph.init();
      return true;
    } catch (error) {
      (this as any).graph = new ValidateRefGraph(this.service);
      return error as Error;
    }
  }

  /**
   * 全部校验
   * @returns 校验结果
   */
  async validateAll() {
    let errors: ValidateErrorInfo[] = this.validateRequired();
    for (const node of this.graph) {
      try {
        const result = this.validateNode(node);
        if (result.length > 0) {
          errors.push(...result);
        }
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : String(error);
        errors.push({
          errorLevel: 'error',
          errorCode: 'ERR_FAILED',
          message: '校验执行失败：' + message,
          position: node.label,
        });
      }
    }
    await this.generateValidationInfo(errors);
    return errors;
  }

  validateNode(node: GraphNode) {
    if (node.type != 'validate' && node.type != 'cell-validate') {
      return [];
    }

    let errors: ValidateErrorInfo[] = [];

    const ctx = {
      ...this.service.createContext(node, this.graph),
      ...this.service.createFormContext(),
    };
    const value = this.service.evalExpression<ValidateResult>(node.rule.formula, ctx);

    if (typeof value === 'boolean') {
      if (value === false) {
        errors.push({
          errorLevel: node.rule.errorLevel,
          errorCode: `ERR_VALIDATE_${node.formId || ''}_${node.name}`,
          message: node.rule.message,
          position: node.label,
          rule: node.rule,
          formId: node.formId,
        } as RuleValidateError);
      }
    } else if (typeof value === 'string') {
      if (value) {
        errors.push({
          errorLevel: node.rule.errorLevel,
          errorCode: `ERR_VALIDATE_${node.formId || ''}_${node.name}`,
          message: value,
          position: node.label,
          rule: node.rule,
          formId: node.formId,
        } as RuleValidateError);
      }
    } else if (Array.isArray(value)) {
      errors = value;
    } else if (value instanceof AssertResult) {
      if (!value.success) {
        errors.push({
          errorLevel: node.rule.errorLevel,
          errorCode: `ERR_VALIDATE_${node.formId || ''}_${node.name}`,
          message: node.rule.message + value.message,
          position: node.label,
          rule: node.rule,
          formId: node.formId,
          expected: value.expected,
          actual: value.actual,
        } as RuleValidateError);
      }
    } else if (value?.message) {
      errors.push(value);
    } else {
      console.warn('非法的校验结果：', value);
    }
    return errors;
  }

  private getHideForms = () => {
    return this.service.model.rules
      .filter((a) => a.typeName == 'visible' && !a.value && a.formId == a.destId)
      .map((a) => a.destId);
  };
  private validateRequired() {
    const valueIsNull = (value: any) => {
      return (
        value === null ||
        value === undefined ||
        (typeof value === 'string' && (value == '[]' || value.length < 1))
      );
    };
    const errors: RequiredValidateError[] = [];
    const hides = this.getHideForms();
    const forms = [
      ...this.service.model.node.primaryForms,
      ...this.service.model.node.detailForms,
    ];
    for (const formId of Object.keys(this.service.model.fields).filter(
      (a) => !hides.includes(a),
    )) {
      const formInfo = forms.find((item) => item.id == formId);
      if (!formInfo) {
        continue;
      }
      const formData = this.service.model.data[formId]?.at(-1);
      const data: any = formData?.after.at(-1) ?? {};
      for (const item of this.service.model.fields[formId]) {
        var isRequired = item.options?.isRequired;
        if (formData?.rules && Array.isArray(formData?.rules)) {
          const rules = formData?.rules.filter((a) => a.destId == item.id);
          if (rules) {
            for (const rule of rules.filter((item) => item.typeName == 'isRequired')) {
              isRequired = rule.value;
            }
            for (const rule of rules.filter((item) => item.typeName == 'visible')) {
              isRequired = isRequired && rule.value;
            }
          }
        }
        if (isRequired && valueIsNull(data[item.id])) {
          errors.push({
            errorLevel: 'error',
            errorCode: `ERR_REQUIRED_${formId}_${item.id}`,
            formId,
            position: `${formInfo?.name || ''} — ${item.name}`,
            message: `字段 ${item.name} 必填`,
            field: item,
          });
        }
      }


      if (isReport(formInfo)) {
        for (const sheet of Object.values(formInfo.sheets)) {
          const sheetData = data[sheet.attributeId!] || {};
          for (const [cell, config] of Object.entries(sheet.cells)) {
            if (
              config.rule.value?.type != '输入型' &&
              config.rule.value?.type != '属性型'
            ) {
              continue;
            }
            if (config.rule?.isRequired && valueIsNull(sheetData[cell])) {
              errors.push({
                errorLevel: 'error',
                errorCode: `ERR_REQUIRED_${formId}_${sheet.code}_${cell}`,
                formId,
                position: `${formInfo.name || ''} — ${sheet.name} ${cell}`,
                message: `单元格 ${cell} 必填`,
              } as any);
            }
          }
        }
      }
    }
    return errors;
  }

  private async generateValidationInfo(errors: ValidateErrorInfo[]) {
    const oldInfo = [...this.validationInfo];
    const addInfo: XValidation[] = [];
    const updateInfo: XValidation[] = [];
    const warnings = errors.filter((e) => e.errorLevel != 'error');

    for (const warn of warnings) {
      let info = oldInfo.find((v) => v.errorCode == warn.errorCode);
      if (info) {
        oldInfo.splice(oldInfo.indexOf(info), 1);
        info.message = warn.message;
        info.position = warn.position;
        info.errorLevel = warn.errorLevel;
        updateInfo.push(info);
      } else {
        info = {
          ...warn,
          typeName: '校验信息',
          instanceId: '',
          reason: '',
          files: [],
        } as any as XValidation;
        if (isRequiredValidateError(warn) || isRuleValidateError(warn)) {
          let formId = warn.formId || '';
          if (formId) {
            info.formId = formId;
            info.name = this.graph.service.formInfo[formId]?.form.name || formId;
          }
        }
        addInfo.push(info);
      }
    }

    this.validationInfo = [...updateInfo, ...addInfo];
    this.graph.service.model.validation = this.validationInfo;

    const allData = [
      _.cloneDeep(updateInfo).map(v => { v.type = "修改"; return v; }),
      _.cloneDeep(addInfo).map(v => { v.type = "新增"; return v; }),
      _.cloneDeep(oldInfo).map(v => { v.type = "删除"; return v; }),
    ];
    console.table(allData, ['type', 'code', 'message', 'position', 'reason']);
  }
}

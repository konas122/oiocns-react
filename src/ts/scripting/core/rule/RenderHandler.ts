import { NodeShowRule, FormShowRule, Rule, RenderRule } from '@/ts/base/model';
import FormServiceBase from '../services/FormServiceBase';
import { IService } from '../types/service';
import { GetterProps, validRule } from '@/ts/base/common/rule/condition';
import _ from 'lodash';

function filterRule<T extends Rule>(rule: Rule): rule is T {
  return rule.type == 'show' || rule.type == 'condition';
}

export type FormDataGetter<T = any> = (params: GetterProps) => T;

export default class RenderHandler implements IService {
  readonly service: FormServiceBase;

  readonly rules: {
    all: NodeShowRule[];
    form: Dictionary<FormShowRule[]>;
  } = {
    all: [],
    form: {},
  };

  constructor(service: FormServiceBase) {
    this.service = service;
  }

  init() {
    this.rules.all = this.service.model.node.formRules?.filter<NodeShowRule>(filterRule);

    for (const form of this.service.model.node.primaryForms) {
      this.rules.form[form.id] = form.rule?.filter<FormShowRule>(filterRule);
    }

    for (const form of this.service.model.node.detailForms) {
      this.rules.form[form.id] = form.rule?.filter<FormShowRule>(filterRule);
    }
    return true;
  }

  dispose() {}

  runWorkRules(formId: string, field: string, getter: FormDataGetter) {
    let rules = this.rules.all.filter((a) => {
      return (
        a.trigger.includes(field == '' ? formId : field) ||
        a.trigger.includes(formId + '-' + field)
      );
    });

    const result: RenderRule[] = [];
    for (const rule of rules) {
      switch (rule.type) {
        case 'show': {
          const ret = this.runShowRule(rule, getter, (pass) => {
            return pass ? rule.value : !rule.value;
          });
          result.push({
            ...ret,
            formId,
          });
          break;
        }
      }
    }
    return result;
  }

  runFormRules(formId: string, getter: FormDataGetter) {
    const rules = this.rules.form[formId];
    const result: RenderRule[] = [];
    for (const rule of rules || []) {
      const ret = this.runShowRule(rule, getter, (pass) => {
        switch (rule.type) {
          case 'show':
            return pass ? rule.value : !rule.value;
          case 'condition':
            return pass;
        }
      });
      result.push({
        ...ret,
        formId,
      });
    }
    return result;
  }

  private runShowRule(
    rule: NodeShowRule | FormShowRule,
    getter: FormDataGetter,
    value: (pass: boolean) => any,
  ): Omit<RenderRule, 'formId'> {
    let condition = JSON.parse(rule.condition);
    let pass = validRule(condition, getter);
    let v = value(pass);
    let destId = rule.target;
    if (destId && typeof destId === 'object') {
      destId = destId.id;
    }
    return {
      destId,
      typeName: rule.showType,
      value: v,
    };
  }
}

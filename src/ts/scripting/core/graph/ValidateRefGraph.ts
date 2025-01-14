import { NodeValidateRule, Rule } from '@/ts/base/model';
import FormServiceBase from '../services/FormServiceBase';
import { RuleMap } from '../types/rule';
import RefGraphBase from './RefGraphBase';
import _ from 'lodash';
import ValidateRuleNode from './node/ValidateRuleNode';
import { GLOBAL_FORM_ID } from './consts';
import { XSheet } from '@/ts/base/schema';
import CellValidateRuleNode from './node/CellValidateRuleNode';

function filterRule(rule: Rule): rule is NodeValidateRule {
  return rule.type == 'validate';
}

export default class ValidateRefGraph extends RefGraphBase<'validate'> {
  readonly rules: RuleMap<NodeValidateRule> = {
    all: [],
    primary: {},
    detail: {},
  };

  constructor(service: FormServiceBase, allowEdit = true) {
    super(service, 'validate');
    if (!allowEdit) {
      return;
    }

    this.rules.all = this.service.model.node.formRules?.filter(filterRule);

    for (const form of this.service.model.node.primaryForms) {
      this.rules.primary[form.id] = form.rule?.filter(filterRule);
    }

    for (const form of this.service.model.node.detailForms) {
      this.rules.detail[form.id] = form.rule?.filter(filterRule);
    }
  }

  init() {
    this.buildGraph();
  }

  private buildGraph() {
    this.nodeList = Object.keys(this.service.formInfo).reduce<Dictionary<any>>((a, v) => {
      a[v] = {};
      return a;
    }, {});
    this.nodeList[GLOBAL_FORM_ID] = {};

    const allRules = this.rules.all.filter(filterRule);
    this.createNodeByRules(allRules, GLOBAL_FORM_ID);

    for (const [formId, rules] of Object.entries(this.rules.primary)) {
      this.createNodeByRules(rules, formId);
    }

    for (const [formId, rules] of Object.entries(this.rules.detail)) {
      this.createNodeByRules(rules, formId);
    }

    const sheetInfos = Object.values(this.service.formInfo).filter((f) => f.typeName == '工作表');
    for (const sheetInfo of sheetInfos) {
      this.createReportCellNodes(sheetInfo.form, sheetInfo.reportId);
    }
  }

  private createNodeByRules(rules: NodeValidateRule[], formId: string) {
    for (const rule of rules) {
      let node = new ValidateRuleNode(rule);

      this.nodeList[formId][node.name] = node;
      this.buildNodeChildren(node);
    }
  }

  private createReportCellNodes(sheet: XSheet, formId: string) {
    for (const [cell, config] of Object.entries(sheet.cells)) {
      if (!config.rule?.ruleString) {
        continue;
      }

      let rule: NodeValidateRule;
      try {
        rule = JSON.parse(config.rule.ruleString || '{}');
      } catch (error) {
        console.warn('无效的校验规则配置', error);
        continue;
      }
      

      const node = new CellValidateRuleNode(rule, config, this, sheet.code, formId);
      if (this.nodeList[sheet.code][node.name]) {
        console.log(`单元格校验 ${node.name}(${node.label}) 已创建`);
      } else {
        this.nodeList[sheet.code][node.name] = node;
        this.buildNodeChildren(node);
      } 
    }
  }
}

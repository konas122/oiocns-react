import { NodeCalcRule, NodeCodeRule, Rule } from '@/ts/base/model';
import _ from 'lodash';
import FormServiceBase from '../services/FormServiceBase';
import { ExecutableRule, RuleMap } from '../types/rule';
import RefGraphBase from './RefGraphBase';
import { GLOBAL_FORM_ID } from './consts';
import { GraphNode } from './node';
import CalcRuleNode from './node/CalcRuleNode';
import CodeRuleNode from './node/CodeRuleNode';
import { isReport } from '../util/report';
import { XSheet } from '@/ts/base/schema';
import { XSheetInfo } from '../types/service';
import ReportCellRefNode from './node/ReportCellRefNode';
import { ReportCellRef } from './ref/refs';

function filterRule(rule: Rule): rule is ExecutableRule {
  return rule.type == 'calc' || (rule.type == 'code' && !(rule as NodeCodeRule).isManual);
}

export default class CalcRefGraph extends RefGraphBase<'calc'> {
  readonly rules: RuleMap<ExecutableRule> = {
    all: [],
    primary: {},
    detail: {},
  };

  constructor(service: FormServiceBase, allowEdit = true) {
    super(service, 'calc');
    if (!allowEdit) {
      return;
    }

    this.rules.all = this.service.model.node.formRules?.filter((r) =>
      filterRule(r),
    ) as ExecutableRule[];

    for (const form of this.service.model.node.primaryForms) {
      this.rules.primary[form.id] = form.rule?.filter((r) =>
        filterRule(r),
      ) as ExecutableRule[];
    }

    for (const form of this.service.model.node.detailForms) {
      this.rules.detail[form.id] = form.rule?.filter((r) =>
        filterRule(r),
      ) as ExecutableRule[];
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

    for (const [formId, rules] of Object.entries(this.rules.primary)) {
      this.createNodeByRules(rules, formId);
    }
    
    // for (const [formId, rules] of Object.entries(this.rules.detail)) {
    //   this.createNodeByRules(rules, formId);
    // }

    const allRules: {
      calc?: NodeCalcRule[];
      code?: NodeCodeRule[];
    } = _.groupBy(this.rules.all, (r) => r.type);

    const calcRuleMap = _.groupBy(allRules.calc || [], (r) => r.target.formId);
    for (const [formId, rules] of Object.entries(calcRuleMap)) {
      this.createNodeByRules(rules, formId);
    }

    this.createNodeByRules(allRules.code || [], GLOBAL_FORM_ID);

    const sheetInfos = Object.values(this.service.formInfo).filter((f) => f.typeName == '工作表');
    for (const sheetInfo of sheetInfos) {
      this.createReportCellNodes(sheetInfo.form, sheetInfo.reportId);
    }
    
  }

  private createNodeByRules(rules: ExecutableRule[], formId: string) {
    for (const rule of rules) {
      let node: GraphNode;
      if (rule.type == 'calc') {
        node = new CalcRuleNode(rule, formId);
      } else if (rule.type == 'code') {
        node = new CodeRuleNode(rule);
      } else {
        console.warn(`暂不支持规则 ${(rule as any).type}`, rule);
        continue;
      }
      if (this.nodeList[formId][node.name]) {
        console.warn(`规则 ${node.name}(${node.label}) 已创建`);
      } else {
        this.nodeList[formId][node.name] = node;
        this.buildNodeChildren(node);
      }
    }
  }

  private createReportCellNodes(sheet: XSheet, formId: string) {
    for (const [cell, config] of Object.entries(sheet.cells)) {
      if (config.rule.value?.type == '函数型' && !config.rule.isVariableData) {
        if (!config.rule.value.valueString) {
          continue;
        }
        const ref: ReportCellRef = {
          type: 'report-cell',
          name: cell,
          sheet: sheet.code,
          cell: cell,
          formId,
        };

        const node = new ReportCellRefNode(ref, this, this.service);
        if (this.nodeList[sheet.code][node.name]) {
          console.log(`单元格 ${node.name}(${node.label}) 已创建`);
        } else {
          this.nodeList[sheet.code][node.name] = node;
          this.buildNodeChildren(node);
        } 
      }
    }
  }
}

import { NodeCalcRule } from '@/ts/base/model';
import { AttributeRef, NodeRef, ReportCellRef } from '../ref/refs';
import { GraphNodeBase } from './GraphNodeBase';

export default class CalcRuleNode extends GraphNodeBase<'calc'> {
  // 计算规则本身没有编码
  get name() {
    return this.rule.id;
  }
  get label() {
    return '[规则]' + this.rule.name;
  }

  refs: NodeRef[] = [];
  isCell = false;
  target!: AttributeRef | ReportCellRef;

  value: any;

  readonly rule: NodeCalcRule;
  constructor(rule: NodeCalcRule, formOrSheetId?: string, isCell = false) {
    super('calc');
    this.rule = rule;

    if (formOrSheetId) {
      this.formId = formOrSheetId;
    }
    this.isCell = isCell;

    this.parseRef();
  }

  protected parseRef() {
    const refs: NodeRef[] = [];
    for (const map of this.rule.mappingData) {
      if (!map.formId) {
        throw new ReferenceError(
          `计算规则 ${this.label} 所引用的变量 ${map.code}(${map.name}) 没有指定表单！`,
        );
      }
      refs.push({
        type: 'attribute',
        name: map.code,
        formId: map.formId,
        attrId: map.id,
      });
    }
    this.refs = refs;

    if (this.isCell) {
      this.target = {
        type: 'report-cell',
        name: this.rule.target.code,
        cell: this.rule.target.id,
        sheet: this.formId,
        formId: this.rule.target.formId,
      };   
    } else {
      this.target = {
        type: 'attribute',
        name: this.rule.target.code,
        formId: this.rule.target.formId,
        attrId: this.rule.target.id,
      };      
    }
  }
}

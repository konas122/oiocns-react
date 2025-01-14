import { NodeCalcRule } from '@/ts/base/model';
import { XAttribute, XSheet } from '@/ts/base/schema';
import { IFormDataHost } from '../../types/service';
import { AttributeRef, NodeRef } from '../ref/refs';
import { GraphNodeBase } from './GraphNodeBase';
import { ExecutableRule, RuleMap } from '../../types/rule';
import { RefGraph } from '..';
import { is } from '@/ts/base/common/lang/type';

export default class AttributeRefNode extends GraphNodeBase<'attr'> {
  get name() {
    return this.ref.name;
  }
  get label() {
    return '[特性]' + this.attribute.name;
  }

  readonly ref: AttributeRef;
  readonly model: IFormDataHost;
  refs: NodeRef[] = [];

  fixValue(value: any): any {
    if (value == null || value == '') {
      if (['数值型', '货币型'].includes(this.attribute.property!.valueType)) {
        return 0;
      } else if (this.attribute.property!.valueType == '报表型') {
        if (this.attribute.widget == '数字框') {
          return 0;
        }
      }
    }
    return value;
  }

  get value() {
    const isPrimaryForm = this.model.formInfo[this.ref.formId].isPrimaryForm;

    if (isPrimaryForm) {
      let v = this.model.formData.primary[this.ref.formId]?.[this.ref.attrId];
      return this.fixValue(v);
    } else {
      // 子表将每条数据的指定特性的值取出来作为一个数组
      const list = this.model.formData.detail[this.ref.formId] || {};
      return Object.values(list).map((row) => {
        let v = row[this.ref.attrId];
        return this.fixValue(v);
      });
    }
  }
  set value(v: any) {
    const isPrimaryForm = this.model.formInfo[this.ref.formId].isPrimaryForm;
    if (isPrimaryForm) {
      let form = this.model.formData.primary[this.ref.formId];
      if (!form) {
        form = {} as any;
        console.warn(`主表 ${this.ref.formId} 对应的数据未初始化！`);
      }
      form[this.ref.attrId] = v;
    } else {
      // 子表对每条数据的指定特性的值赋值同一个值
      const list = this.model.formData.detail[this.ref.formId] || {};
      for (const row of Object.values(list)) {
        row[this.ref.attrId] = v;
      }
    }
  }

  readonly attribute: XAttribute;
  constructor(ref: AttributeRef, graph: RefGraph, model: IFormDataHost) {
    super('attr');
    this.ref = ref;
    this.model = model;

    const formInfo = this.model.formInfo[this.ref.formId];
    if (!formInfo || is<XSheet>(formInfo.form, formInfo.typeName === '工作表')) {
      throw new ReferenceError(`特性 ${ref.name} 对应的表单不存在！`);
    }
    this.attribute = formInfo.form.attributes.find((a) => a.id == ref.attrId)!;
    if (!this.attribute) {
      throw new ReferenceError(`找不到特性 ${ref.name}！`);
    }

    this.formId = this.attribute.formId;

    this.parseRef(graph);
  }

  private parseFormRule(rules: RuleMap<ExecutableRule>) {
    const selfRules = rules.primary[this.ref.formId];
    if (!selfRules || selfRules.length == 0) {
      return;
    }

    const calcRules = selfRules.filter((r) => r.type == 'calc') as NodeCalcRule[];
    const refRules = calcRules.filter((r) => r.target.id == this.ref.attrId);

    for (const rule of refRules) {
      this.refs.push({
        type: 'calc-rule',
        name: rule.id,
        formId: this.ref.formId,
        rule,
      });
    }
  }

  private parseWorkRule(rules: RuleMap<ExecutableRule>) {
    const calcRules = rules.all.filter((r) => r.type == 'calc') as NodeCalcRule[];
    const refRules = calcRules.filter((r) => r.target.id == this.ref.attrId);

    for (const rule of refRules) {
      this.refs.push({
        type: 'calc-rule',
        name: rule.id,
        formId: this.ref.formId,
        rule,
      });
    }
  }

  protected parseRef(graph: RefGraph) {
    // 校验时跳过特性本身的计算
    if (graph.type == 'validate') {
      return;
    }
    const rules = graph.rules;

    this.parseFormRule(rules);
    this.parseWorkRule(rules);
  }
}

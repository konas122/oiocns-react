import { NodeCodeRule } from '@/ts/base/model';
import { ExecutableRule, RuleMap } from '../../types/rule';
import { IFormDataHost } from '../../types/service';
import { NodeRef } from '../ref/refs';
import { GraphNodeBase } from './GraphNodeBase';
import { XForm, XReport } from '@/ts/base/schema';
import { RefGraph } from '..';
import { GLOBAL_FORM_ID } from '../consts';

export default class FormRefNode extends GraphNodeBase<'form'> {
  get name() {
    return this.form.id;
  }
  get label() {
    return '[表单]' + this.form.name;
  }

  refs: NodeRef[] = [];

  value: any;

  readonly form: XForm | XReport;
  constructor(formId: string, graph: RefGraph, model: IFormDataHost) {
    super('form');

    const formInfo = model.formInfo[formId];
    if (!formInfo) {
      throw new ReferenceError(`表单${formId}不存在！`);
    }
    if (formInfo.typeName == '工作表') {
      throw new ReferenceError(`引用表 ${formInfo.code} 没有意义`);
    }
    this.form = formInfo.form;

    this.parseRef(graph);
  }

  protected parseRef(graph: RefGraph) {
    this.refs = this.form.attributes.map((attr) => {
      return {
        type: 'attribute',
        name: attr.code,
        formId: this.form.id,
        attrId: attr.id,
      };
    });

    if (graph.type == 'calc') {
      this.parseWorkRule(graph.rules);
    }
    
  }

  private parseWorkRule(rules: RuleMap<ExecutableRule>) {
    const codeRules = rules.all.filter((r) => r.type == 'code') as NodeCodeRule[];
    const refRules = codeRules.filter((r) => r.target && r.target.id == this.form.id);

    for (const rule of refRules) {
      this.refs.push({
        type: 'code-rule',
        name: rule.id,
        formId: GLOBAL_FORM_ID,
        rule,
      });      
    }

  }
}

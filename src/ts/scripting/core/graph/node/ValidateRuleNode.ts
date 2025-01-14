import { NodeValidateRule } from '@/ts/base/model';
import { NodeRef } from '../ref/refs';
import { GraphNodeBase } from './GraphNodeBase';

export default class ValidateRuleNode extends GraphNodeBase<'validate'> {
  // 计算规则本身没有编码
  get name() {
    return this.rule.id;
  }
  get label() {
    return '[校验]' + this.rule.name;
  }

  refs: NodeRef[] = [];

  value: any;

  readonly rule: NodeValidateRule;
  constructor(rule: NodeValidateRule) {
    super('validate');
    this.rule = rule;

    this.parseRef();
  }

  protected parseRef() {
    const refs: NodeRef[] = [];
    for (const map of this.rule.mappingData) {
      refs.push({
        type: 'attribute',
        name: map.code,
        formId: map.formId,
        attrId: map.id,
      });
    }
    this.refs = refs;
  }
}

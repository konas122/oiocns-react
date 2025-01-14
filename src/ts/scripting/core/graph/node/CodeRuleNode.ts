import { NodeCodeRule } from '@/ts/base/model';
import { NodeRef } from '../ref/refs';
import { GraphNodeBase } from './GraphNodeBase';

export default class CodeRuleNode extends GraphNodeBase<'code'> {
  // 计算规则本身没有编码
  get name() {
    return this.rule.id;
  }
  get label() {
    return '[规则]' + this.rule.name;
  }

  refs: NodeRef[] = [];

  value: any;

  readonly rule: NodeCodeRule;
  constructor(rule: NodeCodeRule) {
    super('code');
    this.rule = rule;

    this.parseRef();
  }

  protected parseRef() {
    const refs: NodeRef[] = [];
    for (const map of this.rule.mappingData || []) {
      if (map.typeName == '属性') {
        refs.push({
          type: 'attribute',
          name: map.code,
          formId: map.formId,
          attrId: map.id,
        });        
      } else {
        refs.push({
          type: 'form',
          name: map.formId,
          formId: map.formId,
        });
      }
    }

    this.refs = refs;
  }
}

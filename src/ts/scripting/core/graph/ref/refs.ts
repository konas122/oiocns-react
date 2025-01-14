import { NodeCalcRule, NodeCodeRule } from '@/ts/base/model';

export type FormRefType = 'attribute' | 'user-param' | 'form';
export type ReportRefType = 'property' | 'report-cell';
export type RefType = FormRefType | ReportRefType | 'calc-rule' | 'code-rule';

export interface NodeRefBase<T extends RefType> {
  type: T;
  formId: string;
  name: string;
  label?: string;
}

export interface AttributeRef extends NodeRefBase<'attribute'> {
  attrId: string;
}

export interface CalcRuleRef extends NodeRefBase<'calc-rule'> {
  rule: NodeCalcRule;
}
export interface CodeRuleRef extends NodeRefBase<'code-rule'> {
  rule: NodeCodeRule;
}

export interface PropertyRef extends NodeRefBase<'property'> {
  propId: string;
}

export interface ReportCellRef extends NodeRefBase<'report-cell'> {
  cell: string;
  sheet: string;
}

export interface FormRef extends NodeRefBase<'form'> {
  formId: string;
}

export type NodeRef =
  | PropertyRef
  | AttributeRef
  | ReportCellRef
  | CalcRuleRef
  | CodeRuleRef
  | FormRef;

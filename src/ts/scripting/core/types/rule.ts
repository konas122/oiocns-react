import { NodeCalcRule, NodeCodeRule, Rule, ValidateErrorInfo } from '@/ts/base/model';
import { DetailOperationType } from '@/ts/scripting/core/types/service';
import { XThing } from '@/ts/base/schema';
import { AssertResult } from '../util/AssertResult';

export type ExecutableRule = NodeCalcRule | NodeCodeRule;

export interface RuleMap<T extends Rule> {
  all: T[];
  primary: Dictionary<T[]>;
  detail: Dictionary<T[]>;
}

export interface FormContextData {
  primary: Dictionary<XThing>;
  detail: Dictionary<Dictionary<XThing>>;
}

export interface FormChangeEvent {
  id?: string;
  formId: string;
  sheet?: string;
  destId: string;
  value: any;
}

export interface DetailChangeEvent extends FormChangeEvent {
  type: DetailOperationType;
}

export type ValidateResult = boolean | string | AssertResult | ValidateErrorInfo | ValidateErrorInfo[];

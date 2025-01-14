import { XForm, XReception, XReport, XSheet } from '@/ts/base/schema';
import { FormContextData } from './rule';
import { FiledLookup } from '@/ts/base/model';
import { IBelong } from '@/ts/core';

export interface FormInfoBase<T extends string, F> {
  id: string;
  code: string;
  typeName: T;
  isPrimaryForm: boolean;
  form: F;
}

export interface XFormInfo extends FormInfoBase<'表单' | '主表' | '报表', XForm> {
}

export interface XReportInfo extends FormInfoBase<'表格', XReport> {

}

export interface XSheetInfo extends FormInfoBase<'工作表', XSheet> {
  /** 如果是sheet，会加一个report的ID */
  reportId: string;
}

export type FormInfo = XFormInfo | XReportInfo | XSheetInfo;

export interface IFormDataHost {
  readonly formCodeMap: Dictionary<string>;
  readonly formData: FormContextData;
  readonly formInfo: Dictionary<FormInfo>;
  readonly speciesMap: Dictionary<FiledLookup[]>;
  readonly reception?: XReception;
  belong:IBelong;
}

export type FormType = '主表' | '子表';
export type DetailOperationType =
  | 'add'
  | 'update'
  | 'remove'
  | 'detail'
  | 'printEntity'
  | 'copy';

export interface IService {
  init(): boolean | Error;
  dispose(): void;
}

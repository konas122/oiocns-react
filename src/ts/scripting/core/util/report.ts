import { XAttribute, XForm, XReport, XSheet } from "@/ts/base/schema";
import _ from "lodash";

export function isReport(form: XForm | XReport): form is XReport {
  return form.typeName === '表格';
}


export function sheetToForm(sheet: XSheet, reportId: string) {
  const form = _.cloneDeep(sheet) as any as XForm;
  delete (form as any).sheets;

  form.id = sheet.attributeId!;
  form.attributes ||= [];
  form.rule ||= [];
  
  for (const [cell, config] of Object.entries(sheet.cells)) {
    let attr = {
      id: cell,
      code: cell,
      name: '单元格' + cell,
      propId: cell,
      formId: reportId,
      options: config
    } as any as XAttribute;
    form.attributes.push(attr);
  }
  
  return form;
}
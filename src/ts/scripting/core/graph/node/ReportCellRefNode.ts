import { XAttribute, XCells, XForm, XReport, XSheet } from "@/ts/base/schema";
import { RefGraph } from "..";
import { NodeRef, ReportCellRef } from "../ref/refs";
import { GraphNodeBase } from "./GraphNodeBase";
import RefParser from "../ref/RefParser";
import { IFormDataHost } from "../../types/service";

export default class ReportCellRefNode extends GraphNodeBase<'report-cell'> {
  get name() {
    return this.ref.cell;
  }
  get label() {
    return `[单元格] ${this.ref.sheet}.${this.ref.cell}`;
  }

  refs: NodeRef[] = [];

  get value() {
    let v: any = null;
    const form = this.model.formData.primary[this.ref.formId] || {};
    if (this.cell.rule.value?.type == '属性型') {
      const attr = this.cell.rule.value.valueString as XAttribute;
      v = form[attr.id]
    } else {
      const sheet = form[this.sheetKey] || {};
      v = sheet[this.ref.cell];
    }
    return this.fixValue(v);
  }


  set value(v: any) {
    let form = this.model.formData.primary[this.ref.formId];
    if (!form) {
      form = {} as any;
      console.warn(`报表 ${this.ref.formId} 对应的数据未初始化！`);
    }

    let sheet = form[this.sheetKey];
    if (!sheet) {
      form[this.sheetKey] = sheet = {};
      console.warn(`表 ${this.ref.sheet} 对应的数据未初始化！`);
    }

    sheet[this.ref.cell] = this.fixValue(v);
  }


  fixValue(value: any): any {
    if (value == null || value == '') {
      if (this.cell.valueType == '数字框') {
        return 0;
      }
    }
    return value;
  }

  readonly ref: ReportCellRef;
  readonly model: IFormDataHost;

  readonly sheetKey: string;
  readonly cell: XCells;
  readonly sheet: XSheet;
  readonly formId: string;
  needCalculate = false;
  expression = '';

  constructor(ref: ReportCellRef, graph: RefGraph, model: IFormDataHost) {
    super('report-cell');
    this.ref = ref;
    this.model = model;

    const sheet = graph.service.formInfo[ref.sheet];
    if (!sheet || sheet.typeName !== '工作表') {
      throw new ReferenceError(`表 ${ref.sheet} 不存在！`);
    }
    this.sheetKey = sheet.form.attributeId!;
    this.sheet = sheet.form;
    this.formId = sheet.reportId!;

    this.cell = sheet.form.cells[this.ref.cell];
    if (!this.cell) {
      throw new ReferenceError(`表 ${ref.sheet} 的单元格 ${ref.cell} 不存在！`);
    }
    
    this.parseRef(graph);
  }

  protected parseRef(graph: RefGraph) {
    if (this.cell.rule.value?.type === '函数型' && !this.cell.rule.isVariableData) {
      this.expression = this.cell.rule.value.valueString;
      this.needCalculate = true;
    } else {
      return;
    }

    if (!this.expression) {
      throw new ReferenceError(`表 ${this.ref.sheet} 的单元格 ${this.ref.cell} 的表达式为空`);
    }

    const refs = RefParser.cellRefs(this.expression);

    for (const ref of refs.cellRefs) {
      this.refs.push({
        type: 'report-cell',
        name: ref,
        formId: this.formId,
        sheet: this.ref.sheet,
        cell: ref,
      });
    }

    for (const [sheet, cells] of Object.entries(refs.otherSheetRefs)) {
      const sheetInfo = graph.service.formInfo[sheet];
      if (!sheetInfo || sheetInfo.typeName !== '工作表') {
        console.warn(`单元格引用的表 ${sheet} 不存在！如果该变量不是工作表，请勿将对应属性按照单元格引用格式命名！`);
        continue;
      }

      for (const cell of cells) {
        this.refs.push({
          type: 'report-cell',
          name: cell,
          formId: this.formId,
          sheet,
          cell,
        });
      }
    }
  }
}
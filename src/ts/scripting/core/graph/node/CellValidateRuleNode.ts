import { NodeValidateRule } from '@/ts/base/model';
import { NodeRef } from '../ref/refs';
import { GraphNodeBase } from './GraphNodeBase';
import { XCells } from '@/ts/base/schema';
import { RefGraph } from '..';
import RefParser from '../ref/RefParser';

export default class CellValidateRuleNode extends GraphNodeBase<'cell-validate'> {
  // 计算规则本身没有编码
  get name() {
    return this.rule.id;
  }
  get label() {
    return '[单元格校验]' + this.rule.name;
  }

  refs: NodeRef[] = [];
  cell: XCells;
  sheet: string;

  value: any;

  readonly rule: NodeValidateRule;
  constructor(rule: NodeValidateRule, cell: XCells, graph: RefGraph, sheet: string, formId: string) {
    super('cell-validate');
    this.rule = rule;

    this.cell = cell;
    this.sheet = sheet;
    this.formId = formId;

    this.parseRef(graph);
  }

  protected parseRef(graph: RefGraph) {
    // const refs: NodeRef[] = [];
    // for (const map of this.rule.mappingData || []) {
    //   refs.push({
    //     type: 'attribute',
    //     name: map.code,
    //     formId: map.formId,
    //     attrId: map.id,
    //   });
    // }
    // this.refs = refs;

    this.parseCellRef(graph);
  }

  protected parseCellRef(graph: RefGraph) {

    const refs = RefParser.cellRefs(this.rule.formula);

    for (const ref of refs.cellRefs) {
      this.refs.push({
        type: 'report-cell',
        name: ref,
        formId: this.formId,
        sheet: this.sheet,
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

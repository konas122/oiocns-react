import { parseCellRefs } from '@/ts/scripting/js/CellRefParserPlugin';

export interface CellRefInfo {
  cellRefs: string[];
  otherSheetRefs: Dictionary<string[]>;
}



export default class RefParser {

  /**
   * 解析公式中的单元格引用
   * @param expression 公式
   * @returns 单元格引用信息
   */
  public static cellRefs(expression: string): CellRefInfo {
    return parseCellRefs(expression);
  }

}
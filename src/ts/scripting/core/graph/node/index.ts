import AttributeRefNode from './AttributeRefNode';
import CalcRuleNode from './CalcRuleNode';
import CellValidateRuleNode from './CellValidateRuleNode';
import CodeRuleNode from './CodeRuleNode';
import FormRefNode from './FormRefNode';
import ReportCellRefNode from './ReportCellRefNode';
import ValidateRuleNode from './ValidateRuleNode';

interface TypeMap {
  calc: CalcRuleNode;
  attr: AttributeRefNode;
  code: CodeRuleNode;
  validate: ValidateRuleNode;
  'cell-validate': CellValidateRuleNode;
  form: FormRefNode;
  'report-cell': ReportCellRefNode;
}

export type NodeType = keyof TypeMap;
export type GraphNode = TypeMap[NodeType];

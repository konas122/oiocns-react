import { ReportTreeNodeTypes, ReportTreeTypes } from '@/ts/base/enum';

export const normalNodeTypes = [
  ReportTreeNodeTypes.Normal,
  ReportTreeNodeTypes.VirtualUnit,
  ReportTreeNodeTypes.ExternalUnit,
];

export const summaryNodeTypes = [
  ReportTreeNodeTypes.Merge,
  ReportTreeNodeTypes.Summary,
  ReportTreeNodeTypes.FullSummary,
  ReportTreeNodeTypes.SingleSummary,
];

export const balanceNodeTypes = [
  ReportTreeNodeTypes.Balance,
  ReportTreeNodeTypes.SummaryAdjust,
];

export const allNodeTypes = [
  ...normalNodeTypes,
  ...summaryNodeTypes,
  ...balanceNodeTypes,
];

export function getTreeNodeType(typeName: string): 0 | 1 | 2 {
  if (summaryNodeTypes.includes(typeName as any)) {
    return 1;
  } else if (balanceNodeTypes.includes(typeName as any)) {
    return 2;
  } else {
    return 0;
  }
}

export const treeTypeNames: Record<ReportTreeTypes, string> = {
  [ReportTreeTypes.Normal]: '普通树',
  [ReportTreeTypes.Summary]: '汇总树',
  [ReportTreeTypes.Financial]: '财务合并树',
};

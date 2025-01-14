export enum ReportTreeNodeTypes {
  // 单户（本级）类节点 0
  /** 实体本级节点 */
  'Normal' = '单户表',
  /** 虚拟单户节点 */
  'VirtualUnit' = '虚拟单位表',
  /** 外部单位节点，境外企业，在系统中不存在或者已注销 */
  'ExternalUnit' = '外部单位表',

  // 汇总（合并）类节点 1
  /** 合并节点（财务树） */
  'Merge' = '集团合并表',
  /** 汇总节点（汇总树） */
  'Summary' = '汇总表',
  /** 完全（虚拟）汇总节点 */
  'FullSummary' = '完全汇总表',
  /** 针对涉密或其他因素，对一家单位单独开设的可填写汇总表 */
  'SingleSummary' = '单独汇总表',

  // 调整（差额）类节点 2
  /** 集团差额节点 */
  'Balance' = '集团差额表',
  /** 汇总调整节点 */
  'SummaryAdjust' = '汇总调整表',
}

// 节点类型
export enum NodeType {
  // 单户
  'Normal',
  // 汇总
  'Summary',
  // 差额
  'Balance',
}

export enum ReportTreeTypes {
  /** 普通树形 */
  'Normal' = 1,
  /** 汇总树形 */
  'Summary' = 2,
  /** 财务合并树形，带差额表 */
  'Financial' = 3,
}

export enum PeriodType {
  'Year' = '年',
  'Quarter' = '季度',
  'Month' = '月',
  'Week' = '周',
  'Day' = '日',
  'Once' = '一次',
  'Any' = '不定时',
}

/** 视图类型 */
export enum ViewType {
  Form = '表单',
  Chart = '图表',
  Report = '报表',
  Total = '总账',
  Summary = '汇总',
}

// 报表类型
export enum ReportType {
  // 单户表
  'Normal',
  // 汇总表
  'Summary',
}

/** 任务接收类型 */
export enum ReceptionType {
  Distribution = '分发任务',
  FillOut = '接收任务',
}

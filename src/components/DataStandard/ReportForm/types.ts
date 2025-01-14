import { XAttribute } from '@/ts/base/schema';

export interface CellInfo {
  col: number;
  row: number;
  prop: Pick<XAttribute, 'id' | 'propId' | 'name'>;
  isFloatRow?: boolean;
}
export interface sheetConfig {
  name: string;
  code: string;
  data: ReporDatatInfo;
}
interface ReporDatatInfo {
  data: any[];
  setting: ReportSettingInfo;
}
export interface ReportSettingInfo {
  row_h: number[];
  col_w: number[];
  cells?: cell[];
  styleList: any[];
  classList?: any[];
  customBorders?: any[];
  grdatr?: any;
  mergeCells?: any[];
  datas?: any[];
  floatRowsSetting: [];
}

interface cell {
  col: number;
  row: number;
  prop: XAttribute;
}
export interface stagDataInfo {
  row: number;
  col: number;
  fieldId: string;
  value: any;
}

declare module 'handsontable/settings' {
  interface CellMeta {
    /**
     * 单元格渲染类型
     */
    renderType?: 'text' | 'input' | 'computed';
  }
}

export type XFloatRowsInfo = {
  // 坐标
  coords: string;
  // 代码
  code?: string;
  // 是否浮动行
  isFloatRows: boolean;
  // 浮动行起始行
  floatStartLine: number;
  // 浮动行数
  floatRowNumber: number;
  // 列字段
  rowsInfo: XRowsInfo[];
  // 起始列
  startColumn: number;
  // 需要合并的单元格
  mergeCells: any;
  // 子表的单元格宽度集合
  colWidths: any;
  // 子表的单元格属性
  cells: CellInfo[];
  // 子表的数据
  subData: any[][];
  // 对象型id
  id?: string;
};

export type XRowsInfo = {
  // 字段名
  name: string;
  // 单元格列数
  index: number;
  // 单元格类型
  type: string;
  // 单元格引用数据
  applicationData?: any;
  // 精度
  accuracy?: number;
  // 是否只读
  isOnlyRead: boolean;
  // 行次
  isLineNumber?: boolean;
  // 起始行次
  startLineNumber?: number;
  // 特性id
  propId: string;
};

export type floatInfo = {
  // 浮动表代码
  code: string;
  // 浮动行选中列
  col: number;
  // 浮动行选中行
  row: number;
};

export type floatRowsData = {
  [key: string]: {
    // 初始化数组
    data: any[];
    // 初始分页参数
    currentPage: number;
    // 当前页码
    pageNum: number;
    // 每页限制
    limit: number;
  };
};

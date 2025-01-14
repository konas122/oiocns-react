import { SEntity } from '@/ts/element/standard';
import { PageElement } from '../../PageElement';
import { XThing } from '@/ts/base/schema';
import { CSSProperties } from 'typings/globelType';

export type PaperOrientation = 'portrait' | 'landscape';
export type PaperSize = 'A4' | 'A3' | 'B4' | 'B5';

export interface DocumentSetting {
  /**页眉内容 */
  header?: string;
  /**页脚内容 */
  footer?: string;
  /**是否显示页码 */
  pageNumber?: boolean;

  fontSize?: string;
  fontFamily?: string;

}

/** 页面设置 */
export interface PaperSetting {
  /** 纸张方向 */
  orientation?: PaperOrientation;
  /**纸张大小 */
  paperSize?: PaperSize;
  /**边距 */
  margin?: [string, string, string, string];

  pagination?: boolean;
}

export type PaperElement = PageElement<string, PaperSetting>;

export interface PaperModel {
  id: string;
  html: string;
  setting: PaperSetting;
}
export interface DocumentExportModel {
  pages: PaperModel[];
  setting: DocumentSetting;
  style: string;
}

export function getPaperSize(paper: PaperSetting): CSSProperties {
  let width = 210;
  let height = 297;

  let size = paper.paperSize || 'A4';
  let orientation = paper.orientation || 'portrait';
  let margin =
    paper.margin ||
    (orientation == 'portrait'
      ? ['25.4mm', '19.1mm', '25.4mm', '19.1mm']
      : ['19.1mm', '25.4mm', '19.1mm', '25.4mm']);

  switch (`${size}-${orientation}`) {
    case 'A4-portrait':
      width = 210;
      height = 297;
      break;
    case 'A4-landscape':
      width = 297;
      height = 210;
      break;
    case 'A3-landscape':
      width = 420;
      height = 297;
      break;
    case 'A3-portrait':
      width = 297;
      height = 420;
      break;
    default:
      break;
  }

  if (paper.pagination) {
    return {
      width: width + 'mm',
      height: 'auto',
      minHeight: height + 'mm',
      margin: margin.join(' '),
    };  
  } else {
    return {
      width: width + 'mm',
      height: height + 'mm',
      margin: margin.join(' '),
    };    
  }
}

export interface TableMeta {
  cols: number;
  rows: number;
}

export interface TableCellMeta {
  col: number;
  row: number;
  colSpan?: number;
  rowSpan?: number;
}

export interface TableCellElement<P extends {} = Dictionary<any>>
  extends PageElement<string, P & TableCellMeta> {}


export interface SpeciesSummaryConfig {
  classifyProp?: SEntity | null;
  treeRoot?: boolean;
}

export interface ListTableProps {
  form?: SEntity;
  showIndex?: boolean;
  showSummary?: boolean;
  speciesSummary?: SpeciesSummaryConfig | null;
}
export interface ListTableColumnProps {
  prop?: SEntity;
  width?: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  accuracy?: number;
  dateFormat?: string;
}

export interface ListTableElement extends PageElement<string, ListTableProps> {}
export interface ListTableColumnElement
  extends PageElement<string, ListTableColumnProps> {}
  
export interface FormRef extends SEntity {
  summary?: boolean;
  speciesSummary?: SpeciesSummaryConfig | null;
}

export interface SpeciesSummaryData extends XThing {
  classifyId: string;
}
export interface WorkTaskInfo {
  /** 审批单位 `XWorkInstance.belongId`*/
  belongId: string;
  /** 发起单位 `XWorkInstance.applyId`*/
  applyId: string;

  /** 任务名称 `XWorkTask.title` */
  title: string;
  /** 任务ID `XWorkTask.id` */
  id: string;
  /** 节点ID `XWorkTask.nodeId` */
  nodeId: string;

  /** 是否已审批 `XWorkTask.records.length > 0` */
  isApproved: boolean;
  /** 最新评论 `XWorkTask.records[-1].comment` */
  comment?: string;
  /** 最新审批人 `XWorkTask.records[-1].createUser` */
  createUser?: string;
  /** 最新审批时间 `XWorkTask.records[-1].createTime` */
  createTime?: string;
  /** 最新审批状态 `XWorkTask.records[-1].status`*/
  status?: number;
  
  [key: `${string}Name`]: string | undefined;
}

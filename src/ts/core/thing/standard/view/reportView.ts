import { IBaseView, BaseView } from './baseView';

export interface IReportView extends IBaseView {}
/** 报表视图 */
export class ReportView extends BaseView implements IReportView {}

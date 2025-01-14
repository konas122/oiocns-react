import { IBaseView, BaseView } from './baseView';

export interface ISummaryView extends IBaseView {}
/** 汇总视图 */
export class SummaryView extends BaseView implements ISummaryView {}

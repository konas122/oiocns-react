import { IBaseView, BaseView } from './baseView';

export interface ITotalView extends IBaseView {}
/** 总帐视图 */
export class TotalView extends BaseView implements ITotalView {}

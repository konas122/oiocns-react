import { IBaseView, BaseView } from './baseView';

export interface IChartView extends IBaseView {}
/** 图表视图 */
export class ChartView extends BaseView implements IChartView {
  get chartType(): string {
    return 'bar';
  }

  async setChartType(type: string) {
    await this.update({
      ...this.metadata,
      options: { ...this.metadata.options, chartType: type },
    });
  }

  renderChart(): void {
    console.log(`正在渲染一个 ${this.chartType} 图表。`);
  }
}

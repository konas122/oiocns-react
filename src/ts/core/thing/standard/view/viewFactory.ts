import { IDirectory, IView } from '@/ts/core';
import { schema } from '@/ts/base';
import { ViewType } from '@/ts/base/enum';
import { ChartView } from './chartView';
import { ReportView } from './reportView';
import { FormView } from './formView';
import { SummaryView } from './summaryView';
import { TotalView } from './totalView';

export class ViewFactory {
  static createView(metadata: schema.XView, directory: IDirectory): IView {
    switch (metadata.subTypeName) {
      case ViewType.Form:
        return new FormView(metadata, directory);
      case ViewType.Chart:
        return new ChartView(metadata, directory);
      case ViewType.Report:
        return new ReportView(metadata, directory);
      case ViewType.Summary:
        return new SummaryView(metadata, directory);
      case ViewType.Total:
        return new TotalView(metadata, directory);
      // Add more cases for additional subtypes
      default:
        throw new Error(`Unsupported view type: ${metadata.subTypeName}`);
    }
  }
}

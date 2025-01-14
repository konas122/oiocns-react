import React from 'react';
import FormView from './form';
import ReportView from './report';
import { ViewType } from '@/ts/base/enum';
import { message } from 'antd';
import { IView } from '@/ts/core';
import LedgerForm from './ledger/LedgerForm';
import { IReportView } from '@/ts/core/thing/standard/view/reportView';
import { DashboardTemplateView } from '../dashboardTemplate';

interface ViewContentType {
  current: IView;
  cmdType: string;
  finished: () => void;
}
const ViewContent: React.FC<ViewContentType> = ({ current, cmdType, finished }) => {
  if (!current.subTypeName) {
    current.subTypeName = ViewType.Form;
  }
  switch (current.subTypeName) {
    case ViewType.Form:
      return (
        <FormView
          form={current.metadata}
          directory={current.directory}
          isMemberView={cmdType === 'openMember'}
          finished={finished}
        />
      );
    case ViewType.Chart:
      return <DashboardTemplateView current={current as any} finished={finished} />;
    case ViewType.Total:
      return (
        <LedgerForm
          current={current as IView}
          form={current.metadata as any}
          directory={current.directory}
          finished={finished}
        />
      );
    case ViewType.Report:
      return (
        <ReportView
          current={current as IReportView}
          form={current.metadata}
          directory={current.directory}
          finished={finished}
        />
      );
    case ViewType.Chart:
    case ViewType.Summary:
    default:
      message.warn(`暂不支持视图类型： ${current.typeName}`);
      return <></>;
  }
};

export default ViewContent;

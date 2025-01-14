import { schema } from '@/ts/base';
import { IEntity } from '@/ts/core';
import SpeciesModal from './speciesModal';
import VersionBrower from './version';
import React from 'react';
import DataAnalysisModal from './dataAnalysisModal';
import DocumentModal from './documentModal';
import FillWorkModal from './fillWorkModal';
import FormModal from './formModal';
import MallTemplateModal from './mallTemplateModal';
import ReportModal from './reportModal';
import TableModal from './tableModal';
import ReportTreeModal from './reportTreeModal';
import SpaceTemplateModal from './spaceTemplateModal';
import TemplateModal from './templateModal';
import { TransferModal } from './transferModal';
import DashboardTemplateModal from './dashboardTemplateModal';

interface IProps {
  cmd: string;
  entity: IEntity<schema.XEntity>;
  finished: () => void;
}

const OperateModal: React.FC<IProps> = ({ cmd, entity, finished }) => {
  switch (entity.typeName) {
    case '视图':
    case '表单':
      if (cmd == 'dataAnalysis') {
        return <DataAnalysisModal finished={finished} current={entity as any} />;
      }
      if (cmd == 'design' && (entity as any).subTypeName == '报表') {
        return <ReportModal finished={finished} current={entity as any} />;
      }
      if (entity.groupTags.includes('图表视图')) {
        return <DashboardTemplateModal finished={finished} current={entity as any} />;
      }
      return <FormModal finished={finished} current={entity as any} />;
    case '表格':
      return <TableModal finished={finished} current={entity as any} />;
    case '报表':
      return <ReportModal finished={finished} current={entity as any} />;
    case '迁移配置':
      return <TransferModal finished={finished} current={entity as any} />;
    case '页面模板':
      return <TemplateModal finished={finished} current={entity as any} />;
    case '商城模板':
      return <MallTemplateModal finished={finished} current={entity as any} />;
    case '空间模板':
      return <SpaceTemplateModal finished={finished} current={entity as any} />;
    case '文档模板':
      return <DocumentModal finished={finished} current={entity as any} />;
    case '办事':
    case '集群模板':
      if (cmd == 'fillWork') {
        return <FillWorkModal finished={finished} current={entity as any} />;
      }
      return <VersionBrower finished={finished} current={entity as any} />;
    case '字典':
    case '分类':
      return <SpeciesModal finished={finished} current={entity as any} />;
    case '报表树':
      return <ReportTreeModal finished={finished} current={entity as any} />;
    default:
      return <></>;
  }
};

export default OperateModal;

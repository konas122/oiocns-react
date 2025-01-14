import React from 'react';
import { schema } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { IEntity } from '@/ts/core';
import WorkForm from './workForm';
import DirectoryForm from './directoryForm';
import ApplicationForm from './applicationForm';
import SpeciesForm from './speciesForm';
import PropertyForm from './propertyForm';
import TargetForm from './targetForm';
import LabelsForm from './labelsForm';
import ViewForm from './viewForm';
import RenameForm from './renameForm';
import TransferForm from './transferForm';
import PageTemplateForm from './templateForm';
import SequencesModal from './sequenceForm';
import ReportTreeForm from './ReportTreeForm';
import DistributionTaskForm from './distributionTaskForm';
import PrintConfigModalCreate from './printConfigModalCreate';
import DocFileForm from './docFileForm';
import DocumentTemplateForm from './DocumentTemplateForm';
import ReportForm from './reportForm';
interface IProps {
  cmd: string;
  entity: IEntity<schema.XEntity>;
  finished: () => void;
}

const EntityForm: React.FC<IProps> = ({ cmd, entity, finished }) => {
  const reloadFinish = () => {
    finished();
    if (!cmd.startsWith('remark')) {
      orgCtrl.changCallback();
    }
  };
  switch (cmd) {
    case 'rename':
      return <RenameForm file={entity as any} finished={reloadFinish} />;
    case 'newDir':
    case 'updateDir':
    case 'remarkDir': {
      return (
        <DirectoryForm formType={cmd} current={entity as any} finished={reloadFinish} />
      );
    }
    case 'newApp':
    case 'newModule':
    case 'updateApp':
    case 'updateModule':
    case 'remarkApp':
      return (
        <ApplicationForm formType={cmd} current={entity as any} finished={reloadFinish} />
      );
    case 'newWork':
    case 'updateWork':
    case 'remarkWork':
      return <WorkForm formType={cmd} current={entity as any} finished={reloadFinish} />;
    case 'newSpecies':
    case 'updateSpecies':
    case 'remarkSpecies':
    case 'newDict':
    case 'updateDict':
    case 'remarkDict':
      return (
        <SpeciesForm
          formType={cmd.replace('Dict', '').replace('Species', '')}
          typeName={cmd.includes('Dict') ? '字典' : '分类'}
          current={entity as any}
          finished={reloadFinish}
        />
      );
    case 'newForm':
    case 'updateForm':
    case 'remarkForm':
      return (
        <LabelsForm
          formType={cmd.replace('Form', '')}
          typeName={'表单'}
          current={entity as any}
          finished={reloadFinish}
        />
      );
    case 'newReport':
    case 'updateReport':
    case 'remarkReport':
      return (
        <ReportForm
          formType={cmd.replace('Report', '')}
          typeName={'表格'}
          current={entity as any}
          finished={reloadFinish}
        />
      );
    case 'newView':
    case 'updateView':
    case 'remarkView':
      return (
        <ViewForm
          formType={cmd.replace('View', '')}
          typeName={'视图'}
          current={entity as any}
          finished={reloadFinish}
        />
      );
    case 'newProperty':
    case 'updateProperty':
    case 'remarkProperty':
      return (
        <PropertyForm formType={cmd} current={entity as any} finished={reloadFinish} />
      );
    case 'newTransferConfig':
    case 'updateTransferConfig':
      return (
        <TransferForm formType={cmd} current={entity as any} finished={reloadFinish} />
      );
    case 'newPageTemplate':
    case 'updatePageTemplate':
      return (
        <PageTemplateForm
          formType={cmd}
          current={entity as any}
          finished={reloadFinish}
        />
      );
    case 'newSequences':
    case 'updateSequence':
    case 'remarkSequence':
      return (
        <SequencesModal
          formType={cmd}
          typeName="序列"
          current={entity as any}
          finished={reloadFinish}
        />
      );
    case 'newReportTree':
    case 'updateReportTree':
    case 'generateReportTree':
      return (
        <ReportTreeForm formType={cmd} current={entity as any} finished={reloadFinish} />
      );
    case 'newDistributionTask':
    case 'updateDistributionTask':
      return (
        <DistributionTaskForm
          formType={cmd}
          current={entity as any}
          finished={reloadFinish}
        />
      );
    case 'newPrint':
    case 'updatePrint':
      return (
        <PrintConfigModalCreate
          formType={cmd}
          typeName={'打印模板'}
          current={entity as any}
          finished={reloadFinish}
        />
      );
    case 'newDocumentTemplate':
    case 'updateDocumentTemplate':
      return (
        <DocumentTemplateForm
          formType={cmd}
          current={entity as any}
          finished={reloadFinish}
        />
      );
    case 'newDoc':
      return (
        <DocFileForm formType={cmd} current={entity as any} finished={reloadFinish} />
      );
    default: {
      return (
        <TargetForm formType={cmd} current={entity as any} finished={reloadFinish} />
      );
    }
  }
};

export default EntityForm;

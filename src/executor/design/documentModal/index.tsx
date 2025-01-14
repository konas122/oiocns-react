import React from 'react';
import FullScreenModal from '@/components/Common/fullScreen';
import DesignerManager from '../pageBuilder/design/DesignerManager';
import { DocumentDesignerHost } from './DocumentDesignerHost';
import { IDocumentTemplate } from '@/ts/core/thing/standard/document';

interface IProps {
  current: IDocumentTemplate;
  finished: () => void;
}

const TemplateModal: React.FC<IProps> = ({ current, finished }) => {
  return (
    <FullScreenModal
      open
      centered
      fullScreen
      width={'80vw'}
      bodyHeight={'80vh'}
      destroyOnClose
      title={'页面配置'}
      onCancel={() => finished()}>
      <DocumentDesignerHost ctx={{ view: new DesignerManager(current) }} />
    </FullScreenModal>
  );
};

export default TemplateModal;

import FullScreenModal from '@/components/Common/fullScreen';
import { ViewerHost } from './view/ViewerHost';
import ViewerManager from './view/ViewerManager';
import { IDocumentTemplate } from '@/ts/core/thing/standard/document';
import React from 'react';
import { useRefInit } from '@/hooks/useRefInit';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import { XForm } from '@/ts/base/schema';

interface IProps {
  current: IDocumentTemplate;
  finished: () => void;
}

const TemplateView: React.FC<IProps> = ({ current, finished }) => {
  // 直接预览没有表单，无法加载数据
  const service = useRefInit(() => {
    const svc = WorkFormService.createStandalone(
      current.directory.target.space,
      {
        id: '-1',
        code: 'empty',
        name: '空表单',
        typeName: '表单',
      } as XForm,
      [],
      false,
    );
    return svc;
  });

  return (
    <FullScreenModal
      open
      centered
      fullScreen
      width={'80vw'}
      bodyHeight={'80vh'}
      destroyOnClose
      title={'页面预览'}
      onCancel={() => finished()}>
      <ViewerHost ctx={{ view: new ViewerManager(current, service.current) }} />
    </FullScreenModal>
  );
};

export default TemplateView;

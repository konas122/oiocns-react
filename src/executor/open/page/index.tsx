import FullScreenModal from '@/components/Common/fullScreen';
import { ViewerHost } from '@/executor/open/page/view/ViewerHost';
import ViewerManager from '@/executor/open/page/view/ViewerManager';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import React from 'react';
import usePostMessage from '@/hooks/usePostMessage';

interface IProps {
  current: IPageTemplate;
  finished: () => void;
}

const TemplateView: React.FC<IProps> = ({ current, finished }) => {
  usePostMessage(
    {
      ...current.directory.target.space.metadata,
      iframeId: current.id,
    },
    '*',
  );
  return (
    <FullScreenModal
      open
      centered
      fullScreen
      width={'80vw'}
      bodyHeight={'80vh'}
      destroyOnClose
      title={current.name || '页面预览'}
      onCancel={() => finished()}>
      <ViewerHost ctx={{ view: new ViewerManager(current) }} />
    </FullScreenModal>
  );
};

export default TemplateView;
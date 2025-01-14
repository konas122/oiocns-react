import FullScreenModal from '@/components/Common/fullScreen';
import { IMallTemplate } from '@/ts/core/thing/standard/page/mallTemplate';
import React from 'react';
import { MallTemplate } from './pages';

interface IProps {
  current: IMallTemplate;
  finished: () => void;
}

const MallTemplateView: React.FC<IProps> = ({ current, finished }) => {
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
      <MallTemplate current={current} />
    </FullScreenModal>
  );
};

export default MallTemplateView;

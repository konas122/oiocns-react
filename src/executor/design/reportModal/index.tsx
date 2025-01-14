import React from 'react';
import { IForm, IView } from '@/ts/core';
import FullScreenModal from '@/components/Common/fullScreen';
import ReportDesign from '@/components/DataStandard/ReportForm';
import ReportViewDesign from './reportViewDesign';
import useAsyncLoad from '@/hooks/useAsyncLoad';
interface IProps {
  current: IForm | IView;
  finished: () => void;
}
const ReportModal: React.FC<IProps> = ({ current, finished }: IProps) => {
  const [loaded] = useAsyncLoad(async () => {
    await current.load();
  }, []);

  if (!loaded) return <></>;
  return (
    <FullScreenModal
      open
      centered
      fullScreen
      hideMaxed
      width={'80vw'}
      destroyOnClose
      onSave={async () => {
        await current.save();
        finished();
      }}
      title={current.typeName + '管理'}
      footer={[]}
      onCancel={finished}>
      {current.typeName === '视图' ? (
        <ReportViewDesign current={current as IView}></ReportViewDesign>
      ) : (
        <ReportDesign current={current as IForm}></ReportDesign>
      )}
    </FullScreenModal>
  );
};

export default ReportModal;

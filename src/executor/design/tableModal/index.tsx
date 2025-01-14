import React from 'react';
import { IReport } from '@/ts/core';
import FullScreenModal from '@/components/Common/fullScreen';
import ReportDesign from '@/components/DataStandard/NewReportForm';
import useAsyncLoad from '@/hooks/useAsyncLoad';
interface IProps {
  current: IReport;
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
      <ReportDesign current={current as IReport}></ReportDesign>
    </FullScreenModal>
  );
};

export default ReportModal;

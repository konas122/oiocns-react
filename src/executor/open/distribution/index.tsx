import FullScreenModal from '@/components/Common/fullScreen';
import ClosingPreview from '@/components/DataPreview/task/closing';
import DistributionPreview from '@/components/DataPreview/task/distribution';
import { TaskContentType } from '@/ts/base/model';
import { IDistribution } from '@/ts/core/work/assign/distribution';
import { IReportDistribution } from '@/ts/core/work/assign/distribution/report';
import React from 'react';

interface IProps {
  current: IDistribution;
  finished: () => void;
}

const DistributionView: React.FC<IProps> = ({ current, finished }) => {
  const loadContent = () => {
    switch (current.data.type) {
      case TaskContentType.Report:
        return <DistributionPreview distribution={current as IReportDistribution} />;
      case TaskContentType.Closing:
        return <ClosingPreview distribution={current as IReportDistribution} />;
    }
  };
  return (
    <FullScreenModal
      open
      centered
      fullScreen
      width={'80vw'}
      bodyHeight={'80vh'}
      destroyOnClose
      title={`任务分发 [${current.metadata.period} ${current.metadata.name}] 接收详情`}
      onCancel={() => finished()}>
      {loadContent()}
    </FullScreenModal>
  );
};

export default DistributionView;

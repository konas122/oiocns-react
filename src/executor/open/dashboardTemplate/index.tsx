import FullScreenModal from '@/components/Common/fullScreen';
import ChartsItems from '../../design/dashboardTemplateModal/components/dashboard';
import React from 'react';
import styles from './index.module.less';

interface IProps {
  current: any;
  finished?: () => void;
}

export const DashboardTemplateView: React.FC<IProps> = ({ current, finished }) => {
  const { config, chartList } = current.metadata;
  return (
    <FullScreenModal
      open
      centered
      fullScreen={false}
      width={'80vw'}
      bodyHeight={'80vh'}
      destroyOnClose
      title={current.name + '(数据分析)'}
      onCancel={() => finished && finished()}>
      <div className={styles['dashboardTemplateModal']}>
        <ChartsItems
          reload={true}
          current={current}
          pageConfig={config}
          chartList={chartList}
        />
      </div>
    </FullScreenModal>
  );
};

export const DashboardTemplateHomeView: React.FC<IProps> = ({ current }) => {
  const { config, chartList } = current.metadata;
  return (
    <div style={{ overflow: 'scroll', height: '100vh' }}>
      <ChartsItems
        reload={true}
        current={current}
        pageConfig={config}
        chartList={chartList}
        flag="home"
      />
    </div>
  );
};

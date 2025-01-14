import React, { useEffect } from 'react';
import DefaultWayStart from '../default';
import { Empty } from 'antd';
import orgCtrl from '@/ts/controller';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { IWorkDarft } from '@/ts/core/work/draft';
import LoadingView from '@/components/Common/Loading';

interface IProps {
  current: IWorkDarft;
  finished?: () => void;
}

/** 草稿打开 */
const DraftWork: React.FC<IProps> = ({ current, finished }) => {
  const [loaded, apply] = useAsyncLoad(() => current.createApply(undefined, undefined));
  useEffect(() => {
    orgCtrl.user.workStagging.find([current.draftData.id]).then((res) => {
      if (res.length > 0) {
        current.draftData = res[0];
      }
    });
  }, [current]);

  if (!loaded) {
    return (
      <div className="loading-page">
        <LoadingView text="配置信息加载中..." />
      </div>
    );
  }

  const loadModal = () => {
    if (apply) {
      apply.instanceData = {
        ...apply.instanceData,
        ...eval(`(${current.draftData?.data})`),
      };
      return (
        current.draftData && (
          <DefaultWayStart
            apply={apply!}
            work={current}
            content={current.draftData.remark}
            staggingId={current.draftData.id}
            onStagging={() => {
              finished && finished();
            }}
            finished={(success?: boolean) => {
              finished && finished();
              success && current.hardDelete();
            }}
          />
        )
      );
    }
    return (
      <div style={{ width: '100%', height: '100%', textAlign: 'center' }}>
        <h3 style={{ padding: 20 }}>办事数据加载失败!</h3>
        <Empty />
      </div>
    );
  };
  return <React.Fragment>{loadModal()}</React.Fragment>;
};

export default DraftWork;

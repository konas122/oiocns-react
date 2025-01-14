import { IWork, IWorkTask } from '@/ts/core';
import { Empty } from 'antd';
import React, { useState } from 'react';
import { model } from '@/ts/base';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import DefaultWayStart from './default';
import MultitabTable from './multitabTable';
import WorkSelect from '@/executor/tools/task/start/selection';
import BelongFinancial from '@/components/DataPreview/financial';
import Ledger from '@/components/DataPreview/financial/ledger/ledger';
import Combination from '@/components/DataPreview/financial/combination';
import { AddNodeType } from '@/utils/work';
import WorkVersion from '@/executor/design/version';
import flowOne from '/img/orginone/work/flow_one.png';
import flowTwo from '/img/orginone/work/flow_two.png';
import flowThree from '/img/orginone/work/flow_three.png';
import flowFour from '/img/orginone/work/flow_four.png';
import GuideLink from '@/components/GuideLink';
import LoadingView from '@/components/Common/Loading';

// 卡片渲染
interface IProps {
  current: IWork | IWorkTask;
  finished?: (success: boolean) => void;
  data?: model.InstanceDataModel;
}

/** 办事-业务流程--发起 */
const TaskStart: React.FC<IProps> = ({ current, data, finished }) => {
  if (!finished) {
    finished = (_success: boolean) => {};
  }
  const [content, setContent] = useState(<></>);
  const [loaded, apply] = useAsyncLoad(() => current.createApply(undefined, data));
  const hasDataAuth = current.directory.target.hasDataAuth() ?? false;
  if (!loaded) {
    return (
      <div className="loading-page">
        <LoadingView text="配置信息加载中..." />
      </div>
    );
  }
  if (apply) {
    if (
      ['财务', '总账'].includes(apply.applyType) ||
      apply.instanceData.node.children?.type !== AddNodeType.END
    ) {
      if ('taskdata' in current) {
        return <DefaultWayStart apply={apply} work={current} finished={finished} />;
      }
      switch (apply.applyType) {
        case '列表':
          return <MultitabTable current={current as IWork} finished={finished!} />;
        case '选择':
          return <WorkSelect work={current as IWork} apply={apply} finished={finished} />;
        case '财务':
          return <BelongFinancial work={current as IWork} finished={finished} />;
        case '总账':
          return <Ledger financial={current.directory.target.space.financial} />;
        case '组合办事':
          return (
            <Combination current={current as IWork} finished={finished!} apply={apply} />
          );
        default:
          return <DefaultWayStart apply={apply} work={current} finished={finished} />;
      }
    } else {
      return (
        <div style={{ width: '100%', height: '100%' }}>
          {content}
          <GuideLink
            title="流程未配置！"
            des={'请按照资产管理内控制度要求配置单位内部流程。'}
            onDesignService={() => {
              setContent(
                <WorkVersion
                  finished={() => finished && finished(false)}
                  current={current as any}
                />,
              );
            }}
            leftBtn="设计办事"
            imgList={[flowOne, flowTwo, flowThree, flowFour]}
            btnDisabled={!hasDataAuth}
          />
        </div>
      );
    }
  }
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Empty description="找不到关联办事" />
    </div>
  );
};

export default TaskStart;

import { IWork, IWorkTask } from '@/ts/core';
import React from 'react';
import FullScreenModal from '@/components/Common/fullScreen';
import TaskStart from '@/executor/tools/task/start';
import { model } from '@/ts/base';
import message from '@/utils/message';
import useAsyncLoad from '@/hooks/useAsyncLoad';

// 卡片渲染
interface IProps {
  current: IWork | IWorkTask;
  finished?: (success: boolean) => void;
  data?: model.InstanceDataModel;
}

/** 办事-业务流程--发起 */
const WorkStartDo: React.FC<IProps> = ({ current, finished, data }) => {
  const [loaded, success] = useAsyncLoad(async () => {
    if (
      'isAuth' in current &&
      (!current.isAuth || !current.metadata.allowInitiate)
    ) {
      if (finished) {
        finished.apply(this, [false]);
      }
      message.error('不能直接发起，需要通过内部办事串联此办事');
    }

    if (!('taskdata' in current)) {
      const receptionCount = await current.directory.resource.receptionColl.count({
        options: {
          match: {
            'content.workId': current.sourceId || current.id,
          },
        },
      });
      if (receptionCount > 0) {
        message.error('该办事已关联到接收任务，不能直接发起，请从已接收的任务中发起');
        return false;
      }
    }

    return true;
  });

  if (!loaded) {
    return <></>;
  }

  if (!success) {
    finished?.(false);
    return <></>;
  }

  return (
    <FullScreenModal
      open
      centered
      fullScreen
      width={'80vw'}
      bodyHeight={'80vh'}
      destroyOnClose
      title={current.name}
      footer={[]}
      onCancel={() => {
        finished && finished(false);
      }}>
      <TaskStart current={current} finished={finished} data={data} />
    </FullScreenModal>
  );
};

export default WorkStartDo;

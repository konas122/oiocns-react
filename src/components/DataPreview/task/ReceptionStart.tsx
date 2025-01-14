import DefaultWayStart from '@/executor/tools/task/start/default';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { FormEditData, InstanceDataModel, ReportTaskTreeNodeView } from '@/ts/base/model';
import { IReception } from '@/ts/core/work/assign/reception';
import { AddNodeType } from '@/utils/work';
import { Empty, Result, Spin, Tag } from 'antd';
import React, { ReactNode, useState } from 'react';
import { ReceptionContext } from '.';
import orgCtrl from '@/ts/controller';
import cls from './index.module.less';
import { generateUuid } from '@/utils/excel';

export interface IProps {
  reception: IReception;
  children?: ReactNode[];
  finished?: () => void;
  curTreeNode?: ReportTaskTreeNodeView;
}

export function ReceptionStart({ reception, children, finished, curTreeNode }: IProps) {
  const metadata = reception.metadata;
  const [key, setKey] = useState(generateUuid());
  const [loaded, combine] = useAsyncLoad(async () => {
    const work = await reception.loadWork();
    if (!work) {
      return;
    }
    const node = await work.loadNode();
    if (!node) {
      return;
    }

    let data: Dictionary<FormEditData[]> = {};
    // 如果是变更
    if (metadata.thingId && metadata.previousInstanceId) {
      const detail = await reception.loadInstanceDetail(metadata.previousInstanceId);

      if (detail) {
        const instanceData: InstanceDataModel = JSON.parse(detail.data || '{}');
        data = instanceData.data;
      }
    }

    let instance: InstanceDataModel = {
      data,
      fields: {},
      primary: {},
      node: node,
      rules: [],
      reception: reception.metadata,
    };
    const draftId = reception.metadata.draftId;
    if (draftId) {
      const drafts = await orgCtrl.user.workStagging.find([draftId]);
      if (drafts.length > 0) {
        instance = JSON.parse(drafts[0].data);
      }
    }

    const apply = await work.createApply(undefined, instance, '0', false);
    if (!apply) {
      return;
    }
    return { work, apply };
  });

  async function onFinished(success: boolean, instanceId?: string) {
    if (success) {
      instanceId && (await reception.submit(instanceId));
      finished && finished();
    }
  }

  if (!loaded) {
    return <Spin>正在加载数据中</Spin>;
  }
  if (!combine) {
    return <Empty>加载办事信息失败</Empty>;
  }

  if (combine.apply.instanceData.node.children?.type == AddNodeType.END) {
    return (
      <Result
        status="warning"
        title="流程未配置"
        extra={<div>请按照报表上报要求配置上报办事流程。</div>}
      />
    );
  }

  return (
    <ReceptionContext.Provider value={reception}>
      <DefaultWayStart
        key={key}
        curTreeNode={curTreeNode}
        apply={combine.apply}
        work={combine.work}
        content={metadata.period + '-' + metadata.content.treeNode.name}
        onStagging={async (instanceId) => {
          await reception.draft(instanceId);
          setKey(generateUuid());
        }}
        finished={(success, instanceId) => {
          if (success && instanceId) {
            onFinished(success, instanceId);
          }
        }}>
        <div className={cls['info']}>
          {/*<div className={cls['title']}>{metadata.name}</div>*/}
          <div>{metadata.period}</div>
          <Tag color="processing">{metadata.periodType}</Tag>
          {/*<div>任务类型：</div>*/}
          <Tag color="orange">{metadata.content.type}</Tag>
          {children ? children : <></>}
        </div>
      </DefaultWayStart>
    </ReceptionContext.Provider>
  );
}

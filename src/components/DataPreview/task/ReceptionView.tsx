import useAsyncLoad from '@/hooks/useAsyncLoad';
import { ReceptionContext } from '.';
import { Empty, Radio, Spin, Table, Tag } from 'antd';
import React, { ReactNode, useState } from 'react';
import cls from './index.module.less';
import './receptionview.less';
import { IReception } from '@/ts/core/work/assign/reception';
import orgCtrl from '@/ts/controller';
import { InstanceDataModel } from '@/ts/base/model';
import WorkForm from '@/executor/tools/workForm';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { statusMap } from '@/ts/core/work/assign/reception/status';
import { TaskStatus } from '@/ts/core';

export interface IProps {
  reception: IReception;
  children?: ReactNode[];
}

const columns = [
  {
    key: 'belongId',
    title: '单位名称',
    dataIndex: 'belongId',
    render: (text: string) => <EntityIcon entityId={text} showName />,
  },
  {
    key: 'createUser',
    title: '审核人',
    dataIndex: 'createUser',
    render: (text: string) => <EntityIcon entityId={text} showName />,
  },
  {
    key: 'title',
    title: '节点',
    dataIndex: 'title',
  },
  {
    key: 'createTime',
    title: '审核时间',
    dataIndex: 'createTime',
  },
  {
    key: 'status',
    title: '状态',
    dataIndex: 'status',
    render: (_: string, record: any) => {
      if (record.status == TaskStatus.RefuseStart) {
        return <Tag color="error">已退回</Tag>;
      } else if (record.status >= 100) {
        return <Tag color="success">已通过</Tag>;
      }
      return <Tag>待审核</Tag>;
    },
  },
  {
    key: 'comment',
    title: '备注信息',
    width: 300,
    dataIndex: 'comment',
  },
];

export function ReceptionView({ reception, children }: IProps) {
  const metadata = reception.metadata;
  const belongId = reception.metadata.content.treeNode.belongId;

  const [activeTabKey, setActiveTabKey] = useState('report');

  const [loaded, combine] = useAsyncLoad(async () => {
    let detail = await reception.loadInstanceDetail(reception.metadata.instanceId!);
    if (!detail) {
      detail = await orgCtrl.work.loadInstanceDetail(
        reception.metadata.instanceId!,
        belongId,
        belongId,
      );
    }
    if (!detail) {
      return;
    }

    const data: InstanceDataModel = JSON.parse(detail.data || '{}');

    const belong = orgCtrl.user.companys.find((a) => a.id == belongId) || orgCtrl.user;
    return { instance: detail, data, belong };
  });

  if (!loaded) {
    return <Spin>正在加载数据中</Spin>;
  }
  if (!combine) {
    return (
      <Empty>
        <div>加载办事信息失败</div>
        {children}
      </Empty>
    );
  }

  /** 渲染表单 */
  const renderWorkTasks = () => {
    const instanceList = [];
    const tasks = combine.instance.tasks || [];
    const notApprovalTasks: any[] = [];
    tasks.forEach((tItem) => {
      if (!tItem.records) {
        return notApprovalTasks.push({
          title: tItem.title,
          belongId: '',
          createTime: '',
          createUser: '',
          comment: '',
          status: tItem.status,
        });
      }
      const instanceItems: any[] = tItem.records?.map((record) => {
        return {
          title: tItem.title,
          belongId: combine.instance.belongId,
          createTime: record.createTime,
          createUser: record.createUser,
          comment: record.comment,
          status: record.status,
        };
      });
      instanceList.push(...instanceItems);
    });

    instanceList.push(
      ...notApprovalTasks.sort((a, b) => (a.createTime < b.createTime ? -1 : 1)),
    );
    return <Table columns={columns} size="small" dataSource={instanceList} />;
  };

  return (
    <ReceptionContext.Provider value={reception}>
      <div className="reception-view">
        <div className="reception-view--toolbar">
          <div className={cls['info']}>
            <div className={cls['title']}>{metadata.name}</div>
            <div>{metadata.period}</div>
            <Tag color="processing">{metadata.periodType}</Tag>
            <div>任务类型：</div>
            <Tag color="orange">{metadata.content.type}</Tag>
            {reception.status != 'empty' ? (
              <Tag color={statusMap[reception.status].color}>
                {statusMap[reception.status].label}
              </Tag>
            ) : (
              <></>
            )}
            {children}
          </div>
          <div style={{ flex: 'auto' }}></div>
          <Radio.Group
            size="large"
            buttonStyle="solid"
            defaultValue={activeTabKey}
            onChange={(e) => setActiveTabKey(e.target.value)}>
            <Radio.Button value="report">报表详情</Radio.Button>
            <Radio.Button value="task">流程明细</Radio.Button>
          </Radio.Group>
        </div>
        <div
          className="workform-wrapper"
          style={{ display: activeTabKey != 'report' ? 'none' : null! }}>
          <WorkForm
            allowEdit={false}
            belong={combine.belong}
            nodeId={combine.data.node.id}
            data={combine.data}
          />
        </div>
        <div
          className="tasklist-wrapper"
          style={{ display: activeTabKey != 'task' ? 'none' : null! }}>
          {renderWorkTasks()}
        </div>
      </div>
    </ReceptionContext.Provider>
  );
}

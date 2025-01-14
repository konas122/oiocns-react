import React from 'react';
import { IWorkTask, TaskStatus } from '@/ts/core';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { Divider, Space, Timeline, Card, Tabs } from 'antd';
import { formatZhDate } from '@/utils/tools';
import TaskApproval from '@/executor/tools/task/approval';
import { command } from '@/ts/base';
import cls from './index.module.less';

export interface TaskDetailType {
  current: IWorkTask;
}

const TaskContent: React.FC<TaskDetailType> = ({ current }) => {
  if (current.targets.length < 2) return <></>;

  /** 加载时间条 */
  const loadTimeline = () => {
    return (
      <Timeline>
        <Timeline.Item color={'green'}>
          <Card>
            <div style={{ display: 'flex' }}>
              <div style={{ paddingRight: '24px' }}>起始</div>
              <div style={{ paddingRight: '24px' }}>
                {formatZhDate(current.taskdata.updateTime)}
              </div>
              <div style={{ paddingRight: '24px' }}>
                发起人：
                <EntityIcon entity={current.targets[0]} showName size={30} />
              </div>
            </div>
            <div style={{ lineHeight: '60px', padding: 16 }}>
              <Space wrap split={<Divider type="vertical" />} size={2}>
                <EntityIcon entity={current.targets[0]} showName size={30} />
                <span>申请加入</span>
                <EntityIcon entity={current.targets[1]} showName size={30} />
              </Space>
              <div>申请时间：{formatZhDate(current.taskdata.createTime)}</div>
              {current.taskdata.records && current.taskdata.records.length > 0 && (
                <>
                  <Space wrap split={<Divider type="vertical" />} size={2}>
                    <EntityIcon
                      entityId={current.taskdata.records[0].createUser}
                      showName
                      size={30}
                    />
                    <span>审核意见：</span>
                    {current.taskdata.status == TaskStatus.ApprovalStart && (
                      <span style={{ color: 'blue' }}>已同意</span>
                    )}
                    {current.taskdata.status == TaskStatus.RefuseStart && (
                      <span style={{ color: 'red' }}>已拒绝</span>
                    )}
                  </Space>
                  <div>
                    审核时间:{formatZhDate(current.taskdata.records[0].updateTime)}
                  </div>
                </>
              )}
            </div>
          </Card>
        </Timeline.Item>
        <TaskApproval
          task={current as any}
          finished={() => {
            command.emitter('preview', 'work');
          }}
        />
      </Timeline>
    );
  };

  const loadItems = () => {
    /** tab标签页 */
    const items = [
      {
        key: '1',
        label: `办事详情`,
        children: (
          <>
            <div className={cls['content']}>{loadTimeline()}</div>
          </>
        ),
      },
    ];
    return items;
  };
  return (
    <Card>
      <Tabs items={loadItems()} />
    </Card>
  );
};

export default TaskContent;

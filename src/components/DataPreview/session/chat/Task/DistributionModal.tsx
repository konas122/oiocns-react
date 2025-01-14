import { ReportTaskTreeNodeView, TaskContentType } from '@/ts/base/model';
import { XDistribution } from '@/ts/base/schema';
import { Checkbox, Descriptions, Modal, Spin, Tag, message } from 'antd';
import React, { useContext, useState } from 'react';
import cls from './index.module.less';
import { SessionContext } from '..';
import { DistributionTask } from '@/ts/core/thing/standard/distributiontask';
import { ReportDistribution } from '@/ts/core/work/assign/distribution/report';
import { $confirm } from '@/utils/react/antd';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';

interface DistributionContentProps {
  metadata: XDistribution;
}
const DistributionModalContent = ({ metadata }: DistributionContentProps) => {
  switch (metadata.content.type) {
    case TaskContentType.Report:
      return (
        <div className={cls['tm-modal-content']}>
          <Descriptions title={''} column={1} bordered>
            <Descriptions.Item label="办事">
              {metadata.content.workName}
            </Descriptions.Item>
            <Descriptions.Item label="报表树">
              {metadata.content.treeName}
            </Descriptions.Item>
            <Descriptions.Item label="数据时期">{metadata.period}</Descriptions.Item>
            <Descriptions.Item label="填报开始时间">
              {metadata.content.startDate}
            </Descriptions.Item>
            <Descriptions.Item label="填报结束时间">
              {metadata.content.endDate}
            </Descriptions.Item>
            <Descriptions.Item label="自动下发权限编码">
              {metadata.content.autoDistributionAuthCode}
            </Descriptions.Item>
          </Descriptions>
        </div>
      );
    default:
      return <div className={cls['tm-content-empty']}>暂无匹配数据</div>;
  }
};

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  metadata: XDistribution;
}

export function DistributionModal(props: Props) {
  const metadata = props.metadata;

  const session = useContext(SessionContext);

  const [confirmLoading, setConfirmLoading] = useState(false);
  const [startReceive, setStartReceive] = useState(false);
  const [msg, setMsg] = useState('');

  const handleOk = async () => {
    setConfirmLoading(true);
    setStartReceive(true);
    setMsg('');
    try {
      let target = session.target;
      let parent = await target.resource.distributionTaskColl.find([metadata.taskId]);
      if (parent.length > 0) {
        let task = new DistributionTask(parent[0], target.directory);
        let distribution = new ReportDistribution(task, metadata);
        setMsg('查找可接收的节点');
        await distribution.holder.loadTree();
        if (!distribution.holder.tree) {
          setMsg('加载树形失败');
          return;
        }
        const nodes = (await distribution.holder.tree.nodeColl.loadSpace({
          options: {
            match: {
              treeId: distribution.treeId,
              belongId: task.spaceId,
            },
          },
        })) as ReportTaskTreeNodeView[];

        if (nodes.length == 0) {
          setMsg('没有可接收的节点');
          return;
        } else {
          const oldReceptions = await distribution.findReportReceptions(
            nodes.map((n) => n.id),
          );
          for (const node of nodes) {
            node.reception = oldReceptions[node.id];
          }
          let nodeIds = Object.entries(oldReceptions)
            .filter(([_, value]) => value != null)
            .map(([key, _]) => key);
          try {
            await $confirm({
              content: (
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    已被其它人接收的任务，接收后将转移给自己
                  </div>
                  <Checkbox.Group
                    defaultValue={nodeIds}
                    onChange={(e) => (nodeIds = e as string[])}
                    className="flex flex-col">
                    {nodes.map((n) => (
                      <Checkbox value={n.id} key={n.id} style={{ marginLeft: '0' }}>
                        <span>
                          <span style={{ marginRight: '16px' }}>{n.name}</span>
                          <Tag color="success" style={{ marginRight: '16px' }}>
                            {n.nodeTypeName}
                          </Tag>
                          {n.reception?.receiveUserId && (
                            <>
                              <EntityIcon entityId={n.reception.receiveUserId} showName />
                              已接收
                            </>
                          )}
                        </span>
                      </Checkbox>
                    ))}
                  </Checkbox.Group>
                </div>
              ),
              title: '选择要接收的节点',
              width: 640,
              centered: true,
            });
          } catch (error) {
            return;
          }

          if (nodeIds.length == 0) {
            message.warning('未选择接收节点');
            return;
          }

          setMsg(`创建任务接收`);
          const selectedNodes = nodes.filter((n) => nodeIds.includes(n.id));
          const receptions = await distribution.receive(session, selectedNodes);
          if (receptions.length == 0) {
            setMsg(`接收失败`);
          } else {
            setMsg(`已成功接收 ${receptions.length} 个任务`);
          }
        }
        message.success('接收完成');
      } else {
        message.warning('找不到指定任务');
        return;
      }
    } catch (error) {
      message.warning(error instanceof Error ? error.message : String(error));
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <Modal
      title={'任务'}
      open={props.open}
      closable={false}
      destroyOnClose
      confirmLoading={confirmLoading}
      okText={startReceive ? '确定' : '接收'}
      width={700}
      onOk={() => {
        startReceive ? props.setOpen(false) : handleOk();
      }}
      maskClosable={false}
      onCancel={() => {
        props.setOpen(false);
      }}>
      {startReceive ? (
        <div className="flex flex-col flex-auto justify-center items-center">
          <div
            style={{
              whiteSpace: 'pre-wrap',
              marginBottom: '16px',
            }}>
            {msg}
          </div>
          <Spin spinning={confirmLoading} />
        </div>
      ) : (
        <div className={`${cls['tm-wrapper']} ${cls['in-model']}`}>
          <div className={cls['tm-header']}>
            <div className={cls['tm-header-item']}>
              <div className={cls['tm-header-name']}>
                {metadata.name} ({metadata.code})
              </div>
            </div>
            <div className={cls['tm-header-item']}>
              <Tag color="green">{metadata.periodType}</Tag>
              <Tag color="processing">{metadata.content.type}</Tag>
            </div>
          </div>
          <div className={cls['tm-content']}>
            <DistributionModalContent metadata={metadata} />
          </div>
        </div>
      )}
    </Modal>
  );
}

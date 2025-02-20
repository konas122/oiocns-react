import React, { useEffect, useState } from 'react';
import { schema } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { Card, Collapse, Timeline } from 'antd';
import WorkForm from '@/executor/tools/workForm';
import { InstanceDataModel } from '@/ts/base/model';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { loadWorkStatus } from '@/utils/work';

const { Panel } = Collapse;

interface IProps {
  instances: schema.XWorkInstance[];
}
/**
 * 存储-物-归档日志
 */
const ThingArchive: React.FC<IProps> = ({ instances }) => {
  return (
    <Card bordered={false}>
      <Timeline reverse>
        {instances.map((a, index) => (
          <ArchiveItem key={`${a.id}_${index}`} instance={a}></ArchiveItem>
        ))}
      </Timeline>
    </Card>
  );
};

const ArchiveItem: React.FC<{ instance: schema.XWorkInstance }> = ({ instance }) => {
  const [task, setTask] = useState<schema.XWorkTask[]>();
  const [data, setData] = useState<InstanceDataModel>();
  const belong =
    orgCtrl.user.companys.find((a) => a.id == instance.belongId) || orgCtrl.user;

  const getDetail = (id: string, shareId: string, belongId: string) => {
    return orgCtrl.work.loadInstanceDetail(id, shareId, belongId);
  };

  useEffect(() => {
    setTimeout(async () => {
      const detail = instance
        ? await orgCtrl.work.loadInstanceDetail(
            instance._id ?? instance.id,
            instance.shareId,
            instance.belongId,
          )
        : null;
      if (detail) {
        setTask(detail.tasks?.filter((i) => i.instanceId === instance._id));
        const detailItems = detail.tasks?.filter((i) => i.instanceId === instance._id);
        const item =
          detailItems!.length > 0
            ? await getDetail(
                detailItems![0].instanceId,
                detailItems![0].shareId,
                detailItems![0].belongId,
              ).then((res) => {
                return res?.data;
              })
            : detail.data;
        setData(JSON.parse(item || '{}'));
      }
    }, 10);
  }, []);

  const loadDeatil = (instance: schema.XWorkInstance) => {
    if (task == undefined) return <></>;
    return (
      <Timeline reverse>
        <Timeline.Item key={'begin'} color={'green'}>
          <Card>
            <div style={{ display: 'flex' }}>
              <div style={{ paddingRight: '24px' }}>起始</div>
              <div style={{ paddingRight: '24px' }}>{instance.createTime}</div>
              <div style={{ paddingRight: '24px' }}>
                发起人：
                <EntityIcon entityId={instance.createUser} showName />
              </div>
            </div>
            {data && data.node && (
              <WorkForm
                allowEdit={false}
                belong={belong}
                nodeId={data.node?.id}
                data={data}
              />
            )}
          </Card>
        </Timeline.Item>
        {task.map((item) => {
          return (
            <div key={item.id}>
              {item.records?.map((record) => {
                return (
                  <Timeline.Item key={record.id} color={'green'}>
                    <Card>
                      <div style={{ display: 'flex' }}>
                        <div style={{ paddingRight: '24px' }}>{item.node?.nodeType}</div>
                        <div style={{ paddingRight: '24px' }}>{item.updateTime}</div>
                        <div style={{ paddingRight: '24px' }}>
                          <div style={{ paddingRight: '24px' }}>{item.title}</div>
                          审核人：
                          <EntityIcon entityId={record.createUser} showName />
                        </div>
                        <div
                          style={{
                            paddingRight: '24px',
                            color: `${record.status < 200 ? '' : 'red'}`,
                          }}>
                          审核结果：{loadWorkStatus(record.status).text}
                        </div>
                        <div>
                          {record.comment && <div>审核意见：{record.comment}</div>}
                        </div>
                      </div>
                      <Collapse ghost>
                        {data && (
                          <WorkForm
                            allowEdit={false}
                            belong={belong}
                            nodeId={item.nodeId}
                            data={data}
                          />
                        )}
                      </Collapse>
                    </Card>
                  </Timeline.Item>
                );
              })}
            </div>
          );
        })}
      </Timeline>
    );
  };
  return (
    <Timeline.Item key={instance.id}>
      <Collapse>
        <Panel
          key={instance.id}
          header={
            <div style={{ display: 'flex' }}>
              <span style={{ paddingRight: '24px' }}>{instance.title}</span>
              <span style={{ paddingRight: '24px' }}>
                {instance.updateTime.substring(0, instance.updateTime.length - 4)}
              </span>
              <span style={{ paddingRight: '24px' }}>
                归属用户：
                <EntityIcon entityId={instance.belongId} showName />
              </span>
              <span style={{ paddingRight: '24px' }}>
                申请用户：
                <EntityIcon entityId={instance.applyId} showName />
              </span>
              {instance.content && (
                <span style={{ paddingRight: '24px' }}>
                  {'内容：' + instance.content}
                </span>
              )}
              {instance.remark && (
                <span style={{ paddingRight: '24px' }}>{'备注：' + instance.remark}</span>
              )}
            </div>
          }>
          {loadDeatil(instance)}
        </Panel>
      </Collapse>
    </Timeline.Item>
  );
};
export default ThingArchive;
export { ArchiveItem };

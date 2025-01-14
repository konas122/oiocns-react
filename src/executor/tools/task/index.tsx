import {
  Card,
  Collapse,
  Empty,
  Spin,
  Timeline,
  Space,
  message,
  Popconfirm,
  Modal,
  Tag,
  Affix,
  Segmented,
  Select,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import cls from './index.module.less';
import { IWorkTask, TaskStatus } from '@/ts/core';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import WorkForm from '@/executor/tools/workForm';
import { WorkNodeDisplayModel, loadWorkStatus, loadMembers } from '@/utils/work';
import TaskDrawer from './drawer';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { getNodeByNodeId } from '@/utils/work';
import TaskApproval from './approval';
import { model, schema, command } from '@/ts/base';
import { generateUuid } from '@/utils/excel';
import { Controller } from '@/ts/controller';
import { Executors } from './executor';
import { useRefInit } from '@/hooks/useRefInit';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import PreviewLayout from '@/components/DataPreview/layout';
import Print from './print';
import ApprovalReview from './approvalReview';
const { Panel } = Collapse;
import orgCtrl from '@/ts/controller';
import { logger } from '@/ts/base/common';
import OrgIcons from '@/components/Common/GlobalComps/orgIcons';
import type { SelectProps } from 'antd';
import LoadingView from '@/components/Common/Loading';
export interface TaskDetailType {
  current: IWorkTask;
  finished: () => void;
}

interface IActions {
  key: string;
  label: string;
}
export interface IMembersObj {
  [key: string]: {
    members: schema.XTarget[];
    originId: string;
  };
}
type ArgsType = {
  empty: boolean;
  type: string;
};
type SegmentedTypes = 'timeline' | 'default';
interface AllTask extends schema.XWorkTask {
  tasks?: AllTask[];
  private?: string;
}

let isSendInfo = false;
const TaskContent: React.FC<TaskDetailType> = ({ current, finished }) => {
  const [selectNode, setSelectNode] = useState<WorkNodeDisplayModel>();
  const [loaded] = useAsyncLoad(async () => {
    await current.loadInstance();
    if (current.taskdata.taskType == '事项') {
      await current.loadWorkNode();
    }
  });
  const formData = new Map<string, model.FormEditData>();
  const commandCtrl = useRef(new Controller('TaskContent'));
  const [actions, setActions] = useState<IActions[]>([]);
  const [selectItem, setSelectItem] = useState<any>();
  const [_, work] = useAsyncLoad(() =>
    current.loadWork(current.taskdata.defineId, current.taskdata.shareId),
  );

  useEffect(() => {
    const id = command.subscribe((type, flag_, args: ArgsType, tag: string) => {
      if (type != 'preview' || flag_ != 'work') return;
      isSendInfo = tag === '已发起';
    });
    return () => {
      command.unsubscribe(id);
    };
  }, []);

  const service = useRefInit(() => {
    if (!current.instanceData) {
      return null;
    }
    const svc = new WorkFormService(current.belong, current.instanceData, false);
    svc.init();
    return svc;
  });

  const _loadMembers = async (task: schema.XWorkTask): Promise<schema.XTarget[] | []> => {
    if (task.destType === '人员') {
      return [{ id: task.identityId }] as schema.XTarget[];
    } else {
      const _members = await loadMembers([task.identityId]);
      if (_members) {
        return _members;
      }
    }
    return [];
  };

  const ApprovalHistory: React.FC<{
    instance?: schema.XWorkInstance;
    current: IWorkTask;
  }> = ({ current, instance }) => {
    const [loaded, tasks] = useAsyncLoad(() => current.loadTasksData(), [current]);
    const [segmented, setSegmented] = useState('default');
    const [relation, setRelation] = useState<string>();

    const onChat = async (memberId: string, _belongId: string) => {
      const space = [orgCtrl.user, ...orgCtrl.user.companys].find(
        (i) => i.id == _belongId,
      );
      if (space) {
        await space.loadMembers();
        let chat = space.memberChats.find((i) => i.id === memberId);
        if (!chat) {
          chat = orgCtrl.user.memberChats.find((i) => i.id === memberId);
        }
        if (chat) {
          command.emitter('executor', 'openChat', chat);
          return;
        }
      }
      const member = await orgCtrl.user.findEntityAsync(memberId);
      if (member) {
        const modal = Modal.confirm({
          title: '申请加为好友',
          content: `您和${member.name}不是同事或好友关系，暂时无法沟通，是否添加为好友并进行沟通呢？`,
          okText: '确认',
          cancelText: '取消',
          onOk: async () => {
            if (await orgCtrl.user.applyJoin([member as schema.XTarget])) {
              logger.info('申请成功！请等待审核...');
              finished();
            }
          },
          onCancel: () => {
            modal.destroy();
          },
        });
      } else {
        message.info('没有找到' + memberId);
      }
    };

    /** 加载时间条 */
    const LoadTimeline = () => {
      if (!instance || !current) return <></>;

      const loadTaskRecordInfo = (task: AllTask, node?: model.WorkNodeModel) => {
        if (instance) {
          if (current && (task.approveType == '起始' || task.approveType == '审批')) {
            const data = task.instance?.data ?? instance.data;
            var recordData = eval(`(${data})`);
            return (
              <>
                <Collapse>
                  <Panel header={renderApproverInfo(node, task)} key={task.id}>
                    {recordData && (
                      <WorkForm
                        allowEdit={false}
                        belong={current.belong}
                        nodeId={task.nodeId}
                        data={recordData}
                        allowLabelPrint={current.metadata.status < 200}
                      />
                    )}
                  </Panel>
                </Collapse>
              </>
            );
          }
          return (
            <>
              <Card>{renderApproverInfo(node, task)}</Card>
              {current && (
                <Executors
                  nodeId={task.nodeId}
                  trigger={'after'}
                  current={current}
                  formData={formData}
                  command={commandCtrl.current}
                />
              )}
            </>
          );
        }
        return <></>;
      };
      const approvalStatus = (TaskStatus: number) => {
        return (
          <div className={cls.approval}>
            <div className={cls[loadWorkStatus(TaskStatus).statusClassName]}>
              <img src={loadWorkStatus(TaskStatus).img} alt="" />
              {loadWorkStatus(TaskStatus).text}
            </div>
          </div>
        );
      };
      const renderApproverInfo = (
        node: model.WorkNodeModel | undefined,
        task: AllTask,
      ) => {
        const _isSendInfo =
          isSendInfo && task.status === TaskStatus.InApproval && work?.metadata.canUrge;
        const renderInApprove = (task: schema.XWorkTask) => {
          const members = getMembers(task);
          return (
            <>
              {members[0] && (
                <div style={{ marginBottom: '8px' }}>
                  <Select
                    value={relation || members[0]?.value}
                    bordered={false}
                    options={members}
                    onChange={(value) => {
                      if (value) {
                        setRelation(value as string);
                      }
                    }}
                    style={{ marginLeft: '-15px' }}></Select>
                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={(event) => {
                      let _relation = task!.createUser;
                      event.stopPropagation();
                      if (members?.[0]) {
                        _relation = relation ?? (members?.[0].value as string);
                      }
                      onChat(_relation, task.belongId ?? orgCtrl.user.id);
                    }}>
                    <img src="/svg/dot/chatActive.svg" style={{ width: '20px' }}></img>
                    沟通
                  </span>
                </div>
              )}
              <div
                className={cls.approval}
                style={{
                  color: '#0052d9',
                  backgroundColor: '#d9e1ff',
                  borderRadius: '3px',
                }}>
                <img src="/svg/dot/review.svg" alt="" />
                审核中
              </div>
            </>
          );
        };
        return (
          <div className={cls.approverInfo}>
            <Space size={8} direction="vertical" style={{ width: '100%' }}>
              <div className={cls.approverHeader}>
                <div className={cls.approverLeft}>
                  <div className={cls.approveType}>
                    {task.approveType === '起始' ? (
                      task.title
                    ) : task.approveType !== '子流程' ? (
                      task.approveType
                    ) : task.tasks?.[0].instance ? (
                      <EntityIcon showName entityId={task.tasks?.[0].instance.shareId} />
                    ) : (
                      task.approveType
                    )}
                  </div>
                  <div className={cls.destName}>{node?.destName || task.title}</div>
                  {approvalStatus(task.status)}
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      alignItems: 'center',
                      marginTop: -2,
                    }}>
                    <div className={cls.destName}>{task.createTime}</div>
                    {task.private && <Tag color="red">{task.private}</Tag>}
                  </div>
                </div>
              </div>
              <div>
                {task.approveType != '子流程' &&
                  task.records
                    ?.sort((a, b) => (a.createTime < b.createTime ? -1 : 1))
                    .map((record) => {
                      if (record && record.createUser && record.createUser.length > 0) {
                        return (
                          <div key={record.id}>
                            <div
                              style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                              <EntityIcon entityId={record!.createUser} showName />
                              <span
                                style={{ cursor: 'pointer' }}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onChat(record!.createUser, task.belongId);
                                }}>
                                <img
                                  src="/svg/dot/chatActive.svg"
                                  style={{ width: '20px' }}></img>
                                沟通
                              </span>
                              {approvalStatus(record.status)}
                              <div className={cls.approverTime}>{record.createTime}</div>
                            </div>
                            {task.approveType !== '起始' && (
                              <div className={cls.comment}>
                                审核意见：
                                {record!.comment ??
                                  (record.status >= 200 ? '驳回' : '同意')}
                              </div>
                            )}
                          </div>
                        );
                      }
                    })}
                {task.status === TaskStatus.InApproval && renderInApprove(task)}
                {_isSendInfo && (
                  <div onClick={(e) => e.stopPropagation()}>
                    &nbsp;|
                    <Popconfirm
                      title="是否要对当前审核角色进行短信催办"
                      onConfirm={async () => {
                        const res = await current.sendTaskInfo();
                        if (res.success) {
                          message.success('短信催办成功');
                        }
                      }}>
                      &nbsp;&nbsp;
                      <span className={cls.sendInfo}>短信催办</span>
                    </Popconfirm>
                  </div>
                )}
              </div>
            </Space>
          </div>
        );
      };
      const loadTodoTaskInfo = (tasks: AllTask[] = []) => {
        return tasks
          .sort((a, b) => (a.createTime < b.createTime ? -1 : 1))
          .map((task) => {
            const node = getNodeByNodeId(task.nodeId, current.instanceData?.node);
            const header = (
              <>
                {renderApproverInfo(node, task)}
                {task.status < 100 && (
                  <Executors
                    nodeId={task.nodeId}
                    trigger={'before'}
                    current={current}
                    formData={formData}
                    command={commandCtrl.current}
                  />
                )}
              </>
            );
            const statusClassName = loadWorkStatus(task.status).className;
            if (task.tasks?.length) {
              return (
                <Timeline.Item
                  key={task.id}
                  className={cls[statusClassName]}
                  dot={<img src={loadWorkStatus(task.status).img}></img>}>
                  <Collapse defaultActiveKey={task.id}>
                    <Panel header={header} key={task.id}>
                      {loadTodoTaskInfo(task.tasks)}
                    </Panel>
                  </Collapse>
                </Timeline.Item>
              );
            }
            return (
              <Timeline.Item
                key={task.id}
                className={cls[statusClassName]}
                dot={<img src={loadWorkStatus(task.status).img}></img>}>
                {loadTaskRecordInfo(task, node)}
              </Timeline.Item>
            );
          });
      };

      // 获取身份成员
      const getMembers = (task: schema.XWorkTask) => {
        const [_, _members] = useAsyncLoad(() => _loadMembers(task), []);
        return (
          _members?.map((member) => {
            return {
              key: member.id,
              label: <EntityIcon showImInfo={true} entityId={member.id} showName />,
              value: member.id,
            };
          }) || []
        );
      };

      // 按照时间线排序展示
      const sortRender = (tasks: AllTask[]) => {
        const records = current.getSortedRecords(tasks);
        return records.map((record) => {
          let extraStyle = {};
          switch (record.status) {
            case TaskStatus.InApproval:
              extraStyle = {
                backgroundColor: 'rgb(217, 225, 255)',
                borderRadius: '3px',
              };
              break;
            case TaskStatus.RefuseStart:
            case TaskStatus.BackStartStatus:
              extraStyle = {
                backgroundColor: '#fff1e9',
                borderRadius: '3px',
              };
              break;
          }
          let members: SelectProps['options'] | undefined = [];
          if (record.status === TaskStatus.InApproval) {
            members = getMembers(record);
          }

          return (
            <Timeline.Item
              key={record.id}
              className={cls[loadWorkStatus(record.status)?.className]}
              dot={<img src={loadWorkStatus(record.status)?.img}></img>}>
              <div className={cls.approverInfo} style={{ ...extraStyle }}>
                <div className={cls.approverHeader}>
                  <div className={cls.approverLeft}>
                    <div className={cls.approveType}>{record.approveType}</div>
                    <div className={cls.destName}>{record.destName}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  {record.status !== TaskStatus.InApproval ? (
                    <EntityIcon entityId={record!.createUser} showName />
                  ) : (
                    members[0] && (
                      <Select
                        value={relation || members[0]?.value}
                        bordered={false}
                        options={members}
                        onChange={(value) => {
                          if (value) {
                            setRelation(value as string);
                          }
                        }}
                        style={{ margin: '0px -15px' }}></Select>
                    )
                  )}
                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={(event) => {
                      let _relation = record!.createUser;
                      event.stopPropagation();
                      if (members?.[0]) {
                        _relation = relation ?? members?.[0].value;
                      }
                      onChat(_relation, record.belongId ?? orgCtrl.user.id);
                    }}>
                    <img src="/svg/dot/chatActive.svg" style={{ width: '20px' }}></img>
                    沟通
                  </span>
                  {approvalStatus(record.status)}
                  <div className={cls.approverTime}>{record.createTime}</div>
                </div>
                {record.status !== TaskStatus.InApproval && (
                  <div className={cls.comment} style={{ ...extraStyle }}>
                    审核意见：{record.comment}
                  </div>
                )}
              </div>
            </Timeline.Item>
          );
        });
      };
      return (
        <>
          {tasks && (
            <>
              <div className={cls.flowTitle}>
                <EntityIcon showName entityId={tasks[0]?.shareId} />
                <span style={{ color: '#888', fontSize: 14, marginLeft: 20 }}>
                  {tasks[0]?.instance?.title}
                </span>
              </div>
              <div className={cls.timeline} style={{ padding: '0px 20px' }}>
                <Timeline>
                  <Space
                    size={12}
                    className={cls.examineProcess}
                    direction="vertical"
                    style={{ width: '100%' }}>
                    {segmented === 'timeline'
                      ? sortRender(tasks)
                      : loadTodoTaskInfo(tasks)}
                  </Space>
                </Timeline>
              </div>
            </>
          )}
        </>
      );
    };
    return (
      <Spin spinning={!loaded} tip={'加载中,请稍等...'}>
        <Card className={cls.flow}>
          <LoadTimeline />
        </Card>
        <Affix style={{ position: 'absolute', right: 10, bottom: 100 }}>
          <Segmented
            value={segmented}
            onChange={(value) => {
              setSegmented(value as SegmentedTypes);
            }}
            options={[
              {
                value: 'default',
                icon: <OrgIcons type={'icons/list'} size={22} />,
              },
              {
                value: 'timeline',
                icon: <OrgIcons type={'icons/icon'} size={22} />,
              },
            ]}
          />
        </Affix>
        <ApprovalReview
          task={current}
          onChat={(memberId, belongId) => {
            onChat(memberId, belongId ?? orgCtrl.user.id);
          }}></ApprovalReview>
      </Spin>
    );
  };
  const loadCurrentFormInfo = () => {
    if (!current.instance) {
      return <></>;
    }
    return (
      <Card className={cls.workForm} style={{ margin: 20 }}>
        {current.instanceData && (
          <WorkForm
            allowEdit={false}
            belong={current.belong}
            nodeId={current.instanceData.node.id}
            data={current.instanceData}
            allowLabelPrint={current.metadata.status < 200}
            service={service.current!}
            tabBarExtraContent={<Print current={current} service={service.current} />}
          />
        )}
      </Card>
    );
  };

  const loadItems = () => {
    var forms = getNodeByNodeId(
      current.taskdata.nodeId,
      current.instanceData!.node,
    )?.primaryForms;
    var existForm = forms && forms.length > 0;
    /** tab标签页 */
    const items = [
      {
        key: 'workdetails',
        label: `办事详情`,
        children: (
          <>
            <div className={cls['content']}>
              {/** 时间轴 */}
              <div className={cls.examineContent}>{loadCurrentFormInfo()}</div>
              {!existForm && !['子流程', '起始'].includes(current.typeName) && (
                <TaskApproval task={current} fromData={formData} finished={finished} />
              )}
            </div>
          </>
        ),
      },
      {
        key: 'flowdetails',
        label: `流程跟踪`,
        children: <ApprovalHistory current={current} instance={current.instance} />,
      },
    ];
    if (existForm) {
      const Center: React.FC = () => {
        const [key, setKey] = useState(generateUuid());
        useEffect(() => {
          const id = commandCtrl.current.subscribe(() => setKey(generateUuid()));
          return () => {
            return commandCtrl.current.unsubscribe(id);
          };
        }, []);
        return (
          <>
            <div style={{ height: 'calc(100% - 80px)', overflow: 'auto' }}>
              <WorkForm
                key={key}
                allowEdit={true}
                belong={current.belong}
                nodeId={current.taskdata.nodeId}
                data={current.instanceData!}
                tabBarExtraContent={<Print current={current} service={service.current} />}
              />
            </div>
            {!['子流程', '起始'].includes(current.typeName) && (
              <TaskApproval task={current} fromData={formData} finished={finished} />
            )}
          </>
        );
      };
      items.unshift({
        key: 'formedit',
        label: `填写表单`,
        children: <Center></Center>,
      });
    }
    return items;
  };

  useEffect(() => {
    if (current.instanceData) {
      const items = loadItems();
      if (!selectItem) {
        setActions(items);
        setSelectItem(items[0]);
      }
    }
  }, [current.instanceData]);

  if (!loaded) {
    return <LoadingView text="信息加载中..." top={100} />;
  }
  if (current.instance && current.instanceData?.node && selectItem) {
    return (
      <div className={cls['work-content']}>
        <div style={{ height: '100%' }}>
          <PreviewLayout
            entity={current}
            actions={actions}
            selectKey={selectItem.key}
            onActionChanged={(key: string) => {
              setSelectItem(actions.find((i) => i.key == key));
            }}>
            {selectItem.children}
          </PreviewLayout>
        </div>
        {selectNode && (
          <TaskDrawer
            current={selectNode}
            isOpen={selectNode != undefined}
            onClose={() => setSelectNode(undefined)}
            instance={current.instance!}
          />
        )}
      </div>
    );
  }
  return (
    <div style={{ width: '100%', height: '100%', textAlign: 'center' }}>
      <h3 style={{ padding: 20 }}>办事数据加载失败!</h3>
      <Empty />
      <TaskApproval task={current} fromData={formData} finished={finished} />
    </div>
  );
};

export default TaskContent;

import { changeRecords } from '@/components/Common/ExecutorShowComp';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import FormItem from '@/components/DataStandard/WorkForm/Viewer/formItem';
import { command, model, schema } from '@/ts/base';
import { IWorkTask, TaskStatus } from '@/ts/core';
import { IExecutor } from '@/ts/core/work/executor';
import {
  AddNodeType,
  convertToFields,
  loadMembers,
  loadParentApprovalNode,
  WorkNodeDisplayModel,
} from '@/utils/work';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import ProTable from '@ant-design/pro-table';
import {
  Button,
  Card,
  Input,
  Modal,
  Space,
  message,
  Dropdown,
  Badge,
  Form,
  Radio,
  Select,
} from 'antd';
import type { ItemType } from 'antd/lib/menu/hooks/useItems';
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import cls from './index.module.less';
import orgCtrl from '@/ts/controller';
import lodash, { isString } from 'lodash';
import { $confirm } from '@/utils/react/antd';
import { XValidation } from '@/ts/base/schema';
import { ValidationModal } from '@/components/Common/Validate/ValidationModal';
import type { MutableRefObject } from 'react';
import { IPressedParams } from '@/ts/core/work/task';

export interface TaskDetailType {
  task: IWorkTask;
  finished: () => void;
  fromData?: Map<string, model.FormEditData>;
  children?: ReactNode;
}

export interface ConfirmProps {
  task: IWorkTask;
  executor: IExecutor;
}
type Members = {
  [key: string]: schema.XTarget[];
};

const TaskApproval: React.FC<TaskDetailType> = ({ task, finished, fromData }) => {
  if (task.isHistory) {
    return <></>;
  }
  const [open, setOpen] = React.useState<boolean>(false);
  const [comment, setComment] = useState<string>(task.approvalRemark);
  const [confirm, setConfirm] = useState(<></>);
  const gatewayData = useRef(new Map<string, string[]>());
  const memberData: MutableRefObject<Map<string, string[]>> = useRef(new Map());
  const [nextNodes, setNextNodes] = useState<schema.XWorkNode[]>([]);
  const [nextApprovalNodes, setNextApprovalNodes] = useState<schema.XWorkNode[]>([]);
  const [commonLanguage, setCommonLanguage] = useState<string[]>([]);
  const [currentCommon, setCurrentCommon] = useState<number | null>(null);
  const [validates, setValidates] = useState<XValidation[]>([]);
  const [validateVisible, setValidateVisible] = useState(false);
  const [members, setMembers] = useState<Members>();
  const membersRef: MutableRefObject<Map<string, schema.XTarget[]>> = useRef(new Map());
  const [isPrivate, setIsPrivate] = useState(false);
  const [passModal, setPassModal] = useState(false);
  const [pressedMembers, setPressedMembers] = useState<string[] | schema.XTarget[]>([]);
  const pressedParams: MutableRefObject<IPressedParams> = useRef({});

  const getCommonLanguage = async () => {
    await orgCtrl.user.cacheObj.all(true);
    const _commonLanguage = await orgCtrl.user.cacheObj.get<string[]>('commonLanguage');
    if (_commonLanguage) {
      setCommonLanguage(_commonLanguage);
    }
  };
  useEffect(() => {
    orgCtrl.user.cacheObj.subscribe('commonLanguage', (res) => {
      setCommonLanguage(res);
    });
    getCommonLanguage();

    setValidates(task.instanceData?.validation ?? []);
  }, []);
  // 审核
  const approvalTask = async (status: number, backId?: string, isSkip?: boolean) => {
    await task.approvalTask(
      status,
      undefined,
      fromData,
      memberData.current.size ? memberData.current : gatewayData.current,
      backId,
      isSkip,
    );
    if (status == TaskStatus.RefuseStart) {
      // if (task.instanceData?.reception) {
      //   const executor = new ReceptionChange(
      //     {
      //       id: '',
      //       funcName: '任务状态变更',
      //       trigger: '',
      //     },
      //     task,
      //   );
      //   await executor.reject();
      // }
    }
    command.emitter('preview', 'work');
    finished();
  };

  const validation = (): boolean => {
    if (task.instanceData && fromData) {
      const valueIsNull = (value: any) => {
        return (
          value === null ||
          value === undefined ||
          (typeof value === 'string' && value.length < 1)
        );
      };
      for (const formId of fromData.keys()) {
        const data: any = fromData.get(formId)?.after.at(-1) ?? {};
        for (const item of task.instanceData.fields[formId]) {
          const isRequired = task.instanceData.data[formId]
            .at(-1)
            ?.rules?.find(
              (i) => i.destId === item.id && i.typeName === 'isRequired',
            )?.value;
          if (
            (isRequired == undefined || isRequired == true) &&
            item.options?.isRequired &&
            valueIsNull(data[item.id])
          ) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const approving = async () => {
    if (validation()) {
      if (
        ['事项'].includes(task.taskdata.taskType) &&
        task.taskdata.approveType != '抄送'
      ) {
        const res = await task.loadNextNodes();
        if (res.success) {
          if (res.data?.result) {
            const customNodes: schema.XWorkNode[] = [];
            const approvalNodes: schema.XWorkNode[] = [];
            res.data.result.forEach((a) => {
              if (
                [AddNodeType.CUSTOM, AddNodeType.Confluence].includes(
                  a.nodeType as AddNodeType,
                )
              ) {
                customNodes.push(a);
              }
              if (
                [AddNodeType.APPROVAL, AddNodeType.END].includes(
                  a.nodeType as AddNodeType,
                )
              ) {
                approvalNodes.push(a);
              }
            });
            if (approvalNodes.length > 0) {
              setNextApprovalNodes(approvalNodes);
            }
            if (customNodes.length > 0) {
              setOpen(true);
              setNextNodes(customNodes);
              return;
            }
          }
        } else {
          message.warn('查询下一节点异常!');
          return;
        }
      }
      setPassModal(true);
    } else {
      message.warn('请完善表单内容再提交!');
    }
  };

  const Confirm: React.FC<ConfirmProps> = (props) => {
    const [open, setOpen] = useState(true);

    let content: ReactNode = null;
    let title = '字段变更确认';
    const calcValue = () => {
      const instance = props.executor.task.instanceData;
      if (instance) {
        for (const change of props.executor.metadata.changes) {
          for (const form of instance.node.forms) {
            const editData: model.FormEditData[] = instance.data[change.id];
            if (change.id == form.id) {
              if (editData && editData.length > 0) {
                editData[editData.length - 1].after.forEach((item) => {
                  for (const fieldChange of change.fieldChanges) {
                    let afterValue = fieldChange.after;
                    if (fieldChange.switch && typeof afterValue === 'string') {
                      afterValue = afterValue && afterValue.replace(/\s/g, '');
                      let current = 0;
                      const afterValueArr: (number | string)[] = [];
                      const regex = /[-+*/]/;
                      afterValue.split('').forEach((i: string, index: number) => {
                        if (regex.test(i)) {
                          const value = item[afterValue.slice(current, index)];
                          afterValueArr.push(value);
                          current = index + 1;
                          afterValueArr.push(i);
                        } else if (index === afterValue.length - 1) {
                          const value =
                            item[afterValue.slice(current, afterValue.length)];
                          afterValueArr.push(value);
                        }
                      });
                      afterValue = eval(afterValueArr.join(''));
                      if (!lodash.isNumber(afterValue)) {
                        throw new Error(`公式${fieldChange.after}填写错误`);
                      }
                      if (!(afterValue >= 0)) {
                        throw new Error(`计算为负数`);
                      }
                      fieldChange.after = afterValue;
                      fieldChange.afterName = afterValue;
                    }
                  }
                });
              }
            }
          }
        }
      }
    };
    const funcName = props.executor.metadata.funcName;
    if (funcName == '字段变更') {
      calcValue();
      content = (
        <Space style={{ width: '100%' }} direction="vertical">
          <span>确认后，您的数据将自动产生变更操作，变更字段如下</span>
          {props.executor.metadata.changes.map((item, index) => {
            item.fieldChanges.forEach((change) => {
              switch (change.options?.defaultType) {
                case 'currentPeriod':
                  change.after = task.belong.financial.current;
                  break;
              }
            });
            return (
              <Card key={index} title={item.name}>
                <ProTable
                  key={'id'}
                  search={false}
                  options={false}
                  tableAlertRender={false}
                  dataSource={item.fieldChanges}
                  columns={changeRecords}
                />
              </Card>
            );
          })}
        </Space>
      );
    } else if (funcName == '任务状态变更') {
      if (!task.instanceData?.reception) {
        message.warning('未找到任务接收信息，该办事需要从任务接收中发起提交！');
        return;
      }
      content = (
        <Space style={{ width: '100%' }} direction="vertical">
          <div>
            <span>确认后，将会将任务 </span>
            <EntityIcon entity={task.instanceData.reception} showName />
            <span>{task.instanceData.reception.period}</span>
            <span>状态变更为已完成</span>
          </div>
          <div style={{ color: 'red' }}>
            任务状态变更执行器已过时且不产生任何效果，所有逻辑已移至数据核，请从办事配置中移除
          </div>
        </Space>
      );
    } else if (funcName == '复制表到子表') {
      title = '复制表到子表';
      content = (
        <Space style={{ width: '100%' }} direction="vertical">
          <span>确认后，将会将</span>
          <Space size={10} style={{ fontWeight: 500 }}>
            {props.executor.metadata.copyForm.map((item, idx) => {
              return (
                <div key={idx}>
                  <span key={item[0].id} style={{ backgroundColor: '#ccc' }}>
                    {item[0].name}
                  </span>
                  复制到
                  <span key={item[1].id} style={{ backgroundColor: '#ccc' }}>
                    {item[1].name}
                  </span>
                </div>
              );
            })}
          </Space>
          <div></div>
        </Space>
      );
    } else if (funcName == '商城订单同步') {
      title = '商城订单同步';
      content = (
        <Space style={{ width: '100%' }} direction="vertical">
          <span>确认后，将会将办事所属空间写入</span>
          <Space size={10} style={{ fontWeight: 500 }}>
            {props.executor.metadata.mallOrderSyncForm.forms.map(
              (item: any, idx: number) => {
                return (
                  <div key={idx}>
                    <span
                      key={item.id}
                      style={{ backgroundColor: '#ccc', marginRight: 8 }}>
                      {item.name}
                    </span>
                  </div>
                );
              },
            )}
          </Space>
        </Space>
      );
    } else {
      return <></>;
    }

    return (
      <Modal
        open={open}
        title={title}
        width={1200}
        onOk={async () => {
          try {
            await props.executor.execute(fromData ?? new Map());
            await approving();
            setOpen(false);
          } catch (error) {
            message.error((error as Error).message);
          }
        }}
        onCancel={() => {
          setOpen(false);
        }}>
        {content}
      </Modal>
    );
  };

  if (task.taskdata.status >= TaskStatus.ApprovalStart) {
    return <></>;
  }

  const addCommonLanguage = () => {
    let value: string;
    const modal = Modal.confirm({
      icon: <></>,
      title: '添加常用语',
      okText: '确认',
      cancelText: '取消',
      maskClosable: true,
      content: (
        <input
          style={{ width: '100%' }}
          onChange={(e) => {
            value = e.target.value;
          }}
        />
      ),
      onOk: () => {
        const _commonLanguage = [...commonLanguage, value];
        orgCtrl.user.cacheObj.set('commonLanguage', _commonLanguage);
        orgCtrl.user.cacheObj.notity('commonLanguage', _commonLanguage);
        modal.destroy();
      },
      onCancel: () => modal.destroy(),
    });
  };

  const deleteCommonLanguage = (idx: number) => {
    const _commonLanguage = commonLanguage;
    _commonLanguage.splice(idx, 1);
    orgCtrl.user.cacheObj.set('commonLanguage', _commonLanguage);
    orgCtrl.user.cacheObj.notity('commonLanguage', _commonLanguage);
  };

  const onBack = async (e: any) => {
    await $confirm({
      title: '确认退回吗？',
      content: '退回请注意,可填写退回原因,说明情况',
    });
    const backId = e.key;
    if (['1', '2', '3'].includes(backId)) {
      await approvalTask(TaskStatus.BackStartStatus, backId, false);
    } else {
      const _task = task.instance?.tasks?.find((task) => task.nodeId === backId);
      if (_task) {
        await approvalTask(TaskStatus.BackStartStatus, _task.id, false);
      } else {
        message.error('办事退回失败');
      }
    }
  };

  const memus = useMemo(() => {
    let itemTypes: ItemType[] = [];
    if (task.instance && task.instance.taskId && task.instance.taskId.length > 0) {
      itemTypes.push({
        key: '1',
        label: '主流程发起人',
      });
    }
    itemTypes.push({
      key: '2',
      label: '上一审核人',
    });
    if (task.node) {
      itemTypes.push(
        ...loadParentApprovalNode(
          task.taskdata.nodeId,
          task.node as unknown as WorkNodeDisplayModel,
        )
          .filter((a) => a.id != task.taskdata.nodeId)
          ?.map((a) => {
            return {
              key: a.id,
              label: `[${a.type}] ${a.name}:${a.destName ?? '发起人'}`,
            };
          }),
      );
    }
    return itemTypes;
  }, [task, comment]);

  const renderRefruse = useCallback(() => {
    if (
      task.taskdata.approveType != AddNodeType.END &&
      task.taskdata.approveType != AddNodeType.CC
    ) {
      if (task.targets.length > 0) {
        return (
          <Button
            danger
            onClick={() => {
              if (task.targets.length === 2) {
                approvalTask(TaskStatus.RefuseStart, task.id, false);
              }
            }}
            type="primary"
            style={{ height: '36px', background: '#F43F3F' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CloseOutlined style={{ fontSize: '12px' }} />
              &nbsp; 退回
            </div>
          </Button>
        );
      }
      return (
        <Dropdown
          menu={{
            items: memus,
            onClick: onBack,
          }}
          placement="topLeft">
          <Button danger type="primary" style={{ height: '36px', background: '#F43F3F' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CloseOutlined style={{ fontSize: '12px' }} />
              &nbsp; 退回
            </div>
          </Button>
        </Dropdown>
      );
    }
    return <></>;
  }, [task, comment]);
  useEffect(() => {
    // 获取设置默认身份后的成员
    if (nextNodes.length) {
      Promise.all(
        nextNodes
          .map((a) => convertToFields(a, task.belong))
          .filter((field) => field.defaultRoleIds)
          .map(async (field) => {
            return [field.id, await loadMembers(field.defaultRoleIds as string[])];
          }),
      ).then((res) => {
        membersRef.current = new Map(res);
        setMembers(Object.fromEntries(membersRef.current));
      });
    }
  }, [nextNodes]);
  // 更新自由节点的成员
  const updateMembers = (field: model.FieldModel) => {
    const data = gatewayData.current.get(field.id);
    if (data?.length) {
      loadMembers(data).then((res) => {
        membersRef.current.set(field.id, res);
        setMembers(Object.fromEntries(membersRef.current));
      });
      return;
    }
    membersRef.current.clear();
    setMembers(Object.fromEntries(membersRef.current));
  };
  const chooseRole = useMemo(() => {
    return (
      <>
        {nextNodes
          .map((a) => convertToFields(a, task.belong))
          .map((field) => {
            if (field.defaultRoleIds && !gatewayData.current.get(field.id)) {
              gatewayData.current.set(field.id, field.defaultRoleIds);
            }
            return (
              <FormItem
                rules={[]}
                key={field.id}
                data={{ [field.id]: gatewayData.current.get(field.id) }}
                numStr={'1'}
                field={field}
                belong={task.belong}
                onValuesChange={(_field, data) => {
                  if (data?.length !== gatewayData.current.get(_field)?.length) {
                    const _data = data ? (Array.isArray(data) ? data : [data]) : [];
                    gatewayData.current.set(_field, _data);
                    updateMembers(field);
                  }
                }}
              />
            );
          })}
      </>
    );
  }, [nextNodes]);

  // 获取催办人员
  const getMembers = async () => {
    const members: any[] = [];
    if (nextNodes.length) {
      const _membersData = memberData.current.size
        ? memberData.current
        : membersRef.current;
      if (_membersData.size) {
        _membersData.forEach((values) => {
          if (values?.length) {
            members.push(...values);
          }
        });
      }
    }
    if (nextApprovalNodes.length) {
      const res = await Promise.all(
        nextApprovalNodes.map(async (i) => {
          const _members = await task.loadMembers(i.destId);
          if (_members) {
            return _members;
          }
          return [];
        }),
      );
      const _members = res.flat(1).map((i) => i.id);
      members.push(..._members);
    }
    const res = new Map();
    setPressedMembers(
      members.filter(
        (item) => !res.has(item?.id || item) && res.set(item?.id || item, 1),
      ),
    );
  };
  useEffect(() => {
    if (isPrivate) {
      getMembers();
    }
  }, [isPrivate]);
  return (
    <>
      <Modal
        width={400}
        title="请选择审核人"
        open={open}
        onOk={async () => {
          if (gatewayData.current.size === 0 && memberData.current.size === 0)
            return message.error('请选择审核人');
          setOpen(false);
          setPassModal(true);
        }}
        onCancel={() => setOpen(false)}>
        {chooseRole}
        {members ? (
          <>
            &nbsp;
            <Space direction="vertical" style={{ width: '100%' }}>
              {nextNodes
                .map((a) => convertToFields(a, task.belong))
                .map((field) => (
                  <Select
                    key={field.id}
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="选填：选择审核人员"
                    onChange={(data) => {
                      memberData.current.set(field.id, data);
                    }}
                    allowClear={true}
                    optionFilterProp="name"
                    tagRender={(item) => {
                      return <EntityIcon showName entityId={item.value} />;
                    }}>
                    {members[field.id]?.map((i) => {
                      return (
                        <Select.Option name={i.name} key={i.id} value={i.id}>
                          <EntityIcon showName entityId={i.id} />
                        </Select.Option>
                      );
                    })}
                  </Select>
                ))}
            </Space>
          </>
        ) : (
          <></>
        )}
      </Modal>
      {validateVisible && (
        <ValidationModal data={validates} onCancel={() => setValidateVisible(false)} />
      )}
      <div className={cls.examine}>
        <div className={cls.examineContent}>
          <div>填写意见：</div>
          <div className={cls.examineInput}>
            <Input.TextArea
              placeholder="请输入您的意见"
              bordered={false}
              value={comment}
              style={{ height: '30px', resize: 'none' }}
              onChange={(e) => {
                task.approvalRemark = e.target.value;
                setComment(e.target.value);
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {validates.length > 0 && (
            <Badge count={validates.length}>
              <Button
                style={{ height: '36px' }}
                onClick={() => {
                  setValidateVisible(true);
                }}>
                校验说明
              </Button>
            </Badge>
          )}

          <Dropdown
            dropdownRender={() => {
              return (
                <div className={cls.dropdownContent}>
                  <div className={cls.commonLanguageHeader}>
                    <div>常用语</div>
                    <div onClick={addCommonLanguage}>添加常用语</div>
                  </div>
                  {commonLanguage.length ? (
                    commonLanguage.map((v, i) => {
                      return (
                        <div
                          key={i}
                          className={cls.commonLanguageItem}
                          onMouseOut={() => {
                            setCurrentCommon(null);
                          }}
                          onMouseOver={() => {
                            setCurrentCommon(i);
                          }}
                          onClick={() => {
                            task.approvalRemark = v;
                            setComment(v);
                          }}>
                          <div className={cls.text}>{v}</div>
                          <div>
                            <img
                              src="/svg/operate/delCommonLanguage.svg"
                              style={{ opacity: currentCommon === i ? 100 : 0 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCommonLanguage(i);
                              }}></img>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className={cls.noCommonLanguage}>
                      <img src="/img/work/noCommonLanguage.png" alt="" />
                      <div>
                        未设置常用语，
                        <span
                          style={{ color: '#366ef4', cursor: 'pointer' }}
                          onClick={addCommonLanguage}>
                          添加常用语
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
            placement="bottomLeft"
            arrow>
            <div>
              <img
                src="/svg/dot/commonLanguage.svg"
                onClick={() => {
                  if (!comment) return;
                  const _commonLanguage = [...commonLanguage, comment];
                  orgCtrl.user.cacheObj.set('commonLanguage', _commonLanguage);
                  orgCtrl.user.cacheObj.notity('commonLanguage', _commonLanguage);
                }}
                style={{ cursor: 'pointer' }}
              />
              常用语
            </div>
          </Dropdown>
          {renderRefruse()}
          <Button
            type="primary"
            style={{ height: '36px' }}
            onClick={lodash.debounce(
              async () => {
                const executor = (await task.loadExecutors()).find(
                  (item) =>
                    item.metadata.funcName == '字段变更' ||
                    item.metadata.funcName == '任务状态变更' ||
                    item.metadata.funcName === '复制表到子表' ||
                    item.metadata.funcName === '商城订单同步',
                );
                if (executor) {
                  if (executor.metadata.visible) {
                    setConfirm(<Confirm task={task} executor={executor} />);
                    return;
                  } else {
                    try {
                      await executor.execute(fromData ?? new Map());
                    } catch (error) {
                      message.error((error as Error).message);
                      console.error('执行器异常，请检查:', (error as Error).message);
                      return;
                    }
                  }
                }
                approving();
              },
              1000,
              { leading: true, trailing: false },
            )}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CheckOutlined style={{ fontSize: '12px' }} />
              &nbsp; 通过
            </div>
          </Button>
          <Modal
            width={500}
            title="确认通过吗？"
            open={passModal}
            onOk={async () => {
              await approvalTask(TaskStatus.ApprovalStart);
              if (isPrivate) {
                if (pressedParams.current.targetIds || nextApprovalNodes.length) {
                  await task.sendTaskInfo(pressedParams.current);
                }
              }
            }}
            onCancel={() => setPassModal(false)}>
            <div>确认通过，任务将进行下一步</div>
            <div className={cls.modalComment}>
              <div className={cls.modalCommentTitle}>审核意见</div>
              <div>{comment || '通过'}</div>
            </div>
            <Form layout="vertical" autoComplete="off">
              <Form.Item label="是否催办">
                <Radio.Group
                  onChange={(e) => {
                    setIsPrivate(e.target.value);
                  }}
                  value={isPrivate}>
                  <Radio value={true}>是</Radio>
                  <Radio value={false}>否</Radio>
                </Radio.Group>
              </Form.Item>
              {isPrivate && !!nextApprovalNodes.length && (
                <>
                  {
                    <>
                      {pressedMembers.length ? (
                        <Form.Item label="催办人员">
                          <Select
                            mode="multiple"
                            style={{ width: '100%' }}
                            placeholder="选填：选择审核人员"
                            onChange={(data) => {
                              pressedParams.current = {
                                ...pressedParams.current,
                                targetIds: data,
                              };
                            }}
                            allowClear={true}
                            tagRender={(item) => {
                              return <EntityIcon showName entityId={item.value} />;
                            }}>
                            {pressedMembers &&
                              pressedMembers.map((i) => {
                                const id = isString(i) ? i : i.id;
                                return (
                                  <Select.Option key={id} value={id}>
                                    <EntityIcon showName entityId={id} />
                                  </Select.Option>
                                );
                              })}
                          </Select>
                        </Form.Item>
                      ) : (
                        <>
                          {nextApprovalNodes.map((node) => {
                            return (
                              <Form.Item label="催办节点" key={node.id}>
                                <div>{node.destName || node.name}</div>
                              </Form.Item>
                            );
                          })}
                        </>
                      )}
                    </>
                  }
                  <Form.Item label="催办方式">
                    <Radio.Group defaultValue="note">
                      <Radio value="note">短信</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item label="短信内容">
                    <Input.TextArea
                      defaultValue={pressedParams.current.message}
                      onChange={(e) => {
                        pressedParams.current.message = e.currentTarget.value;
                      }}></Input.TextArea>
                  </Form.Item>
                </>
              )}
            </Form>
          </Modal>
        </div>
        {confirm}
      </div>
    </>
  );
};

export default TaskApproval;

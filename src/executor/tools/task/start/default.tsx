import { ReceptionContext } from '@/components/DataPreview/task';
import FormValidateMessage from '@/components/Common/Validate/FormValidateMessage';
import FormItem from '@/components/DataStandard/WorkForm/Viewer/formItem';
import Confirm from '@/executor/open/reconfirm';
import WorkForm from '@/executor/tools/workForm';
import { command, model, schema } from '@/ts/base';
import {
  FieldModel,
  NodeCodeRule,
  NodeValidateRule,
  ReportTaskTreeNodeView,
  WorkNodeButton,
} from '@/ts/base/model';
import { NodeType } from '@/ts/base/enum';
import orgCtrl from '@/ts/controller';
import { IWork, IWorkApply, IWorkTask } from '@/ts/core';
import { DealGatewayFields, loadMembers } from '@/utils/work';
import { Button, Dropdown, Input, Modal, Spin, message, InputNumber, Select } from 'antd';
import 'lodash';
import React, {
  ReactElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './default.less';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import { IWorkDarft } from '@/ts/core/work/draft';
import { mapErrorToValidateInfo } from '@/ts/scripting/js/util';
import { IReportReception } from '@/ts/core/work/assign/reception/report';
import { delay } from '@/ts/base/common/timer';
import OpenFileDialog from '@/components/OpenFileDialog';
import { SelectBox } from 'devextreme-react';
import { CloseOutlined, DownOutlined } from '@ant-design/icons';
import PrintConfigModal from '@/components/Common/FlowDesign/Config/Components/PrintNode/PrintModal';
import { createRoot } from 'react-dom/client';
import PrintTemplate from '@/components/Common/FlowDesign/Config/Components/PrintNode/printTemplate';
import { EditModal } from '../../editModal';
import { XPrint } from '@/ts/base/schema';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import type { MutableRefObject } from 'react';
import { WorkTask } from '@/ts/core/work/task';
import { DocumentContent } from '../document';

// 卡片渲染
interface IProps {
  apply: IWorkApply;
  work: IWork | IWorkTask | IWorkDarft;
  finished?: (success: boolean, instanceId?: string) => void;
  onStagging?: (instanceId: string) => void;
  staggingId?: string;
  content?: string;
  children?: ReactElement;
  splitDetailFormId?: string;
  curTreeNode?: ReportTaskTreeNodeView;
}
type Members = {
  [key: string]: schema.XTarget[];
};

/** 办事发起-默认类型 */
const DefaultWayStart: React.FC<IProps> = ({
  apply,
  work,
  finished,
  onStagging,
  staggingId,
  content = '',
  children,
  splitDetailFormId,
  curTreeNode,
}) => {
  const gatewayData = useRef(new Map<string, string[]>());
  const [openGatewayModal, setOpenGatewayModal] = useState<boolean>();
  const [gatewayFields, setGatewayFields] = useState<FieldModel[]>([]);
  const info: { content: string } = { content };
  const [isModalOpen, setIsModalOpen] = useState(false); //二次确认框
  const [opensplit, setOpensplit] = useState(false);
  const [splitNum, setSplitNum] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [printType, setPrintType] = useState<string>('');
  const [print, setPrint] = useState<any>([]);
  const [printModalCreate, setPrintModalCreate] = useState(false);
  const [resource, setResource] = useState<any>();
  const [ser, setSer] = useState<any>();
  const [printModal, setPrintModal] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [instanceData, setInstanceData] = useState<model.InstanceDataModel>();
  const service = useRef(
    new WorkFormService(apply.target, apply.instanceData, true, apply.reception),
  );
  const [members, setMembers] = useState<Members>();
  const membersRef: MutableRefObject<Map<string, schema.XTarget[]>> = useRef(new Map());
  const memberData: MutableRefObject<Map<string, string[]>> = useRef(new Map());
  const hasReport = useMemo(
    () => apply.primaryForms.some((f) => f.typeName === '报表' || f.typeName === '表格'),
    [apply.instanceData.node],
  );
  // 是否为资产合并办事
  const hasMerge = useMemo(
    () =>
      apply.instanceData.node.formRules.filter(
        (i) => i.type === 'combination' && i.applyType === '合并',
      ),
    [apply.instanceData.node],
  );

  // 是否为主子表赋值规则
  const hasAssignment = useMemo(
    () =>
      apply.instanceData.node.formRules.filter(
        (i) => i.type === 'assignment' && i.ruleType === 'mainToDetail',
      ),
    [apply.instanceData.node],
  );
  // 是否字段赋值
  const hasFieldAssignment = useMemo(
    () =>
      apply.instanceData.node.formRules.filter(
        (i) => i.type === 'assignment' && i.ruleType === 'fieldToField',
      ),
    [apply.instanceData.node],
  );

  // 资产拆分提交校验
  const hasSplit = useMemo(
    () =>
      apply.instanceData.node.formRules.filter(
        (i) => i.type === 'combination' && i.applyType === '拆分',
      ),
    [apply.instanceData.node],
  );

  const filterFormRules = async () => {
    let result: boolean = true;
    if (hasAssignment.length > 0) {
      result = await service.current.assignment();
    }
    if (hasFieldAssignment.length > 0) {
      result = await service.current.fieldAssignment();
    }
    if (hasMerge.length > 0) {
      result = await service.current.assetMerge();
    }
    if (hasSplit.length > 0) {
      result = await service.current.assetSplit();
    }
    return result;
  };

  const reception = useContext(ReceptionContext);
  const reportStatus = useMemo(() => {
    if (!reception) {
      return null;
    }
    return reception.metadata.content;
  }, [reception]);

  function updateData(obj1: schema.XThing, obj2: schema.XThing) {
    for (let key in obj2) {
      if (obj1.hasOwnProperty(key)) {
        obj1[key] = obj2[key];
      }
    }
    return obj1;
  }

  async function handleClick(current: WorkNodeButton) {
    const node = apply.instanceData.node;
    try {
      if (current.type == 'rule') {
        const rule = node.formRules.find((r) => r.id == current.ruleId);
        if (!rule) {
          return;
        }
        if (rule.type == 'code') {
          await service.current.executeCodeRule(rule as NodeCodeRule);
        } else if (rule.type == 'validate') {
          const errors = await service.current.executeValidateRule(
            rule as NodeValidateRule,
          );
          service.current.handlingResult(errors);
        } else {
          console.warn('不支持规则 ' + rule.type);
          return;
        }
      } else if (current.type == 'getWorkData') {
        EditModal.workSelectModal({
          form: current.form?.metadata!,
          belong: apply.target.space,
          onSave: (values: model.InstanceDataModel | undefined) => {
            if (values) {
              const res = updateData(
                apply.instanceData.data[apply.primaryForms[0].id][0].after.at(-1)!,
                values.data[values.node.primaryForms[0].id][0].after.at(-1)!,
              );
              apply.instanceData.data[apply.primaryForms[0].id][0].after[0] = res;
              setInstanceData(values);
            }
          },
        });
      } else {
        message.warn('暂不支持执行器');
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function summaryAll(recursive = false, mode: 1 | 2) {
    try {
      setLoading(true);
      const changes = await service.current.summaryAll(
        reception as IReportReception,
        recursive,
        mode,
      );
      if (changes.length > 0) {
        message.success('汇总成功');
      } else {
        message.success('没有可汇总的数据');
      }
    } catch (error) {
      console.error(error);
      message.error('汇总失败');
    } finally {
      setLoading(false);
    }
  }

  async function summaryDirectChildren() {
    try {
      setLoading(true);
      const changes = await service.current.summaryDirectChildren(
        reception as IReportReception,
      );
      if (changes.length > 0) {
        message.success('汇总成功');
      } else {
        message.success('没有可汇总的数据');
      }
    } catch (error) {
      console.error(error);
      message.error('汇总失败');
    } finally {
      setLoading(false);
    }
  }

  const renderNodeButtons = () => {
    const buttons = apply.instanceData.node.buttons || [];
    return buttons.map((button) => {
      if (button.scene !== 'mobile') {
        return (
          <Button key={button.code} onClick={() => handleClick(button)}>
            {button.name}
          </Button>
        );
      }
    });
  };
  const removePrintIframe = () => {
    const oldIframe = document.getElementById('printedIframe');
    if (oldIframe) {
      oldIframe.remove();
    }
  };
  const handleRemoveItem = (
    e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
    data: { id: string },
  ) => {
    const current = work as IWorkTask;
    e.stopPropagation();
    const newPrintData = print.filter((option: { id: string }) => option.id !== data.id);
    //删除保存
    const parsedResource = JSON.parse(current.instanceData!.node.resource);
    let newAttributes = [...parsedResource.printData.attributes].filter(
      (option: { title: string }) => option.title !== data.id,
    );
    let newPrints = [...parsedResource.print].filter(
      (option: { id: string }) => option.id !== data.id,
    );
    parsedResource.printData.attributes = newAttributes;
    parsedResource.print = newPrints;
    const updatedResourceString = JSON.stringify(parsedResource);
    current.instanceData!.node.resource = updatedResourceString;
    setPrint(newPrintData);
  };
  const saveStatus = useRef<boolean>(false);
  useEffect(() => {
    const fetchData = async () => {
      const ser = await service.current;
      const resource = await service.current.model.node.resource;
      setResource(resource ? JSON.parse(resource) : {});
      setSer(ser);

      try {
        if (apply.instanceData.node.resource) {
          setPrint(JSON.parse(apply.instanceData.node.resource).print);
          setPrintType(JSON.parse(apply.instanceData.node.resource).printData.type);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
    saveStatus.current = false;

    const ret = service.current.init();
    if (ret instanceof Error) {
      if (Array.isArray(ret.cause)) {
        service.current.handlingResult(
          ret.cause.map((e) => mapErrorToValidateInfo(e, '初始化')),
        );
      } else {
        service.current.handlingResult([mapErrorToValidateInfo(ret, '初始化')]);
      }
    }
    return () => {
      removePrintIframe();
    };
  }, []);
  const loadRecallApply = () => {
    if ('recallApply' in work && work.instance && '起始' == work.taskdata.approveType) {
      if (work.instance.createUser === work.belong.userId) {
        return (
          <Button
            type="primary"
            onClick={async () => {
              await work.recallApply();
            }}>
            撤回
          </Button>
        );
      }
    }
    return <></>;
  };
  useEffect(() => {
    // 获取设置默认身份后的成员
    if (gatewayFields.length) {
      Promise.all(
        gatewayFields
          .filter((field) => field.defaultRoleIds)
          .map(async (field) => {
            return [field.id, await loadMembers(field.defaultRoleIds as string[])];
          }),
      ).then((res) => {
        membersRef.current = new Map(res);
        setMembers(Object.fromEntries(membersRef.current));
      });
    }
  }, [gatewayFields]);

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
  return (
    <div className="workstart-default">
      <div className="workstart-content">
        <div className="workstart-content-left">
          <FormValidateMessage service={service.current} />
        </div>
        <div className="workstart-content-right">
          {loading && (
            <div className="loading-spin">
              <Spin spinning></Spin>
            </div>
          )}
          <WorkForm
            allowEdit
            belong={apply.target.space}
            data={apply.instanceData}
            nodeId={apply.instanceData.node.id}
            service={service.current}
            splitDetailFormId={splitDetailFormId}
            instanceData={instanceData}
          />
        </div>
      </div>
      <div className="workstart--toolbar">
        <div className="examineContent">
          <div>备注信息：</div>
          <div className="examineInput">
            <Input
              placeholder="请填写备注信息"
              bordered={false}
              defaultValue={content}
              onChange={(e) => {
                info.content = e.target.value;
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {children} <div style={{ flex: 'auto', width: '1px' }}></div>
          {renderNodeButtons()}
          {!(work as IWorkTask).taskdata && (
            <a
              onClick={() => {
                setPrintModalCreate(true);
              }}>
              添加打印模板
            </a>
          )}
          {!(work as IWorkTask).taskdata && (
            <SelectBox
              showClearButton
              value={printType}
              placeholder="请选择打印模板"
              dataSource={print}
              displayExpr={'name'}
              valueExpr={'id'}
              onFocusIn={() => {
                setPrintType('');
              }}
              onValueChange={(e) => {
                if (!e) return false;
                setPrintType(e);
                if (e == '默认无') return false;
                //保存
                const parsedResource = JSON.parse(apply.instanceData!.node.resource);
                parsedResource.printData.type = e;
                const updatedResourceString = JSON.stringify(parsedResource);
                apply.instanceData!.node.resource = updatedResourceString;
                const resource = JSON.parse(apply.instanceData?.node.resource ?? '{}');
                setResource(resource);
                setPrintModal(true);
                //e是拿到的id，放到一个数据里，保存掉。然后进入模版页面
              }}
              itemRender={(data) => (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      wordWrap: 'break-word',
                    }}>
                    {data.name}
                  </span>
                  <CloseOutlined onClick={(e) => handleRemoveItem(e, data)} />
                </div>
              )}
            />
          )}
          {!(work as IWorkTask).taskdata && resource && (
            <Button
              type="primary"
              loading={btnLoading}
              onClick={async () => {
                setBtnLoading(true);
                try {
                  const IPrints = await orgCtrl.loadFindPrint(
                    resource.printData.type,
                    work.metadata.shareId,
                  );
                  let newPrint: XPrint[] = [];
                  let name = '';
                  if (IPrints) {
                    newPrint = [IPrints as XPrint];
                    name = (IPrints as XPrint).table![0].title.name;
                  }
                  const originalTitle = document.title;
                  document.title = name ? name : document.title; // 设置自定义标题
                  removePrintIframe();
                  const iframe = document.createElement('IFRAME') as HTMLIFrameElement;
                  iframe.setAttribute(
                    'style',
                    'position:fixed;width:100%;height:100%;left:0px;top:0px; z-index: 1000; background: rgba(0, 0, 0, 0); display: none;',
                  );
                  iframe.setAttribute('id', 'printedIframe');
                  iframe.onload = () => {
                    let doc = iframe.contentWindow?.document;
                    const loading = () => {
                      setTimeout(() => {
                        iframe.contentWindow?.focus();
                        iframe.contentWindow?.print();
                        document.title = originalTitle; // 打印后恢复原始标题
                      }, 1000);
                      if (navigator.userAgent.indexOf('MSIE') > 0) {
                        document.body.removeChild(iframe);
                      }
                    };
                    createRoot(doc as unknown as Element | DocumentFragment).render(
                      <PrintTemplate
                        name={work.name}
                        instanceData={apply.instanceData}
                        printData={resource.printData}
                        primary={ser.model.primary}
                        print={newPrint}
                        loading={loading}
                        type={'default'}
                      />,
                    );
                  };
                  document.body.appendChild(iframe);
                } catch (error) {
                  console.error('打印请求失败:', error);
                } finally {
                  setBtnLoading(false);
                }
              }}>
              打印
            </Button>
          )}
          {printModalCreate && (
            <OpenFileDialog
              multiple
              title={`选择打印模板`}
              accepts={['打印模板']}
              rootKey={''}
              excludeIds={print.filter((i: any) => i.id).map((file: any) => file.id)}
              onCancel={() => setPrintModalCreate(false)}
              onOk={(files) => {
                //保存到办事上
                setPrint([...print, ...files]);
                setPrintModalCreate(false);
              }}
            />
          )}
          {printModal && (
            <PrintConfigModal
              refresh={(cur) => {
                apply.instanceData!.node.resource = JSON.stringify(cur);
                setPrintModal(false);
              }}
              resource={JSON.parse(apply.instanceData!.node.resource)}
              printType={printType}
              print={print}
              ser={ser}
              primaryForms={apply.instanceData!.node.primaryForms}
              detailForms={apply.instanceData!.node.detailForms}
              type={'default'}
            />
          )}
          {onStagging && (
            <Button
              type="primary"
              style={{ marginLeft: 10 }}
              onClick={async () => {
                if (saveStatus.current) {
                  message.warn('请勿重复提交单据！');
                  return null;
                }
                saveStatus.current = true;
                const instance = await apply.staggingApply(
                  info.content,
                  gatewayData.current,
                  orgCtrl.user.workStagging,
                  staggingId,
                );
                if (instance) {
                  orgCtrl.user.workStagging.cache.push(instance);
                  onStagging?.apply(this, [instance.id]);
                  finished && finished(false);
                } else {
                  saveStatus.current = false;
                }
              }}>
              保存草稿
            </Button>
          )}
          {hasReport && reportStatus?.treeNode.nodeType == NodeType.Summary && (
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  // {
                  //   key: 'summary',
                  //   label: '汇总',
                  //   onClick: () => {
                  //     summaryAll(false, 1);
                  //   },
                  // },
                  // {
                  //   key: 'summary2',
                  //   label: '汇总（模式2）',
                  //   onClick: () => {
                  //     summaryAll(false, 2);
                  //   },
                  // },
                  // {
                  //   key: 'summaryAll',
                  //   label: '逐级汇总',
                  //   onClick: () => {
                  //     summaryAll(true, 1);
                  //   },
                  // },
                  // {
                  //   key: 'summaryAll2',
                  //   label: '逐级汇总（模式2）',
                  //   onClick: () => {
                  //     summaryAll(true, 2);
                  //   },
                  // },
                  {
                    key: 'summaryDirectChildren',
                    label: '直属下级汇总',
                    onClick: () => {
                      summaryDirectChildren();
                    },
                  },
                ],
              }}>
              <Button>
                汇总 <DownOutlined />
              </Button>
            </Dropdown>
          )}
          {hasReport && (
            <Button
              onClick={async () => {
                try {
                  setLoading(true);
                  // 等待loading显示出来
                  await delay(10);
                  await service.current.calculateAll();
                  message.success('计算成功');
                } catch (error) {
                  console.error(error);
                  service.current.handlingResult([mapErrorToValidateInfo(error, '计算')]);
                } finally {
                  setLoading(false);
                }
              }}>
              计算
            </Button>
          )}
          {hasSplit.length > 0 && (
            <Button onClick={() => setOpensplit(true)}>拆分重新计算</Button>
          )}
          {hasReport && (
            <Button
              onClick={async () => {
                const errors = await service.current.validateAll();
                if (errors.some((e) => e.errorLevel == 'error')) {
                  message.error('校验失败');
                } else if (errors.length > 0) {
                  message.warning(`校验通过，但存在 ${errors.length} 个问题，请核实`);
                } else {
                  message.success('校验成功');
                }
              }}>
              校验
            </Button>
          )}
          {<DocumentContent current={work as WorkTask} service={service.current} />}
          {loadRecallApply()}
          <Button
            type="primary"
            onClick={async () => {
              let errors: model.ValidateErrorInfo[] = [];
              await service.current.executeSubmitRule(errors);
              await service.current.validateAll(errors);
              if (errors.some((e) => e.errorLevel == 'error')) {
                message.error('校验失败');
              } else {
                let reasonFlag = service.current.validate.validationInfo.some(
                  (e) => !e.reason,
                );
                if (reasonFlag) return message.error('存在说明未填写');
                if (!(await filterFormRules())) return;
                var gateways = DealGatewayFields(apply);
                if (gateways.length > 0) {
                  setGatewayFields(gateways);
                  // 如果当前提交的节点是自由节点且为权限控制,设为报表树的上级节点
                  const fieldModel = gateways[0];
                  let backWork = work as IWorkTask;
                  if (
                    fieldModel.nodeType === '自由节点' &&
                    fieldModel.widget === '内部机构选择框' &&
                    curTreeNode
                  ) {
                    try {
                      const taskTree = await (
                        reception as IReportReception
                      ).holder.loadTree();
                      if (!curTreeNode?.parentId) {
                        await taskTree
                          ?.loadNodeById([curTreeNode.id])
                          .then((curTreeNodeInfo) => {
                            let xReportTreeNode = curTreeNodeInfo[0];
                            curTreeNode.parentId = xReportTreeNode.parentId;
                          });
                      }
                      await taskTree
                        ?.loadNodeById([curTreeNode?.parentId as string])
                        .then((treeNode) => {
                          if (treeNode.length === 1) {
                            gatewayData.current.set(fieldModel.id, [
                              treeNode[0].targetId,
                            ]);
                          }
                        });
                    } catch (error) {
                      console.error('加载树数据失败', error);
                    }
                    setIsModalOpen(true);
                  } else if (
                    fieldModel.nodeType === '自由节点' &&
                    fieldModel.widget === '内部机构选择框' &&
                    backWork.instance?.gateways
                  ) {
                    let parse = JSON.parse(backWork.instance.gateways);
                    if (parse[0].targetIds) {
                      gatewayData.current.set(fieldModel.id, parse[0].targetIds);
                    }
                    setIsModalOpen(true);
                  } else {
                    setOpenGatewayModal(true);
                  }
                } else {
                  setIsModalOpen(true);
                }
              }
            }}>
            提交
          </Button>
          {'taskdata' in work && (
            <Button
              type="link"
              onClick={async () => {
                command.emitter('executor', 'remark', work);
              }}>
              查看任务详情
            </Button>
          )}
        </div>
      </div>
      <Modal
        width={400}
        title="请选择接收单位"
        open={openGatewayModal}
        onOk={() => {
          if (gatewayData.current.size === 0 && memberData.current.size === 0)
            return message.error('请选择接收单位');
          setOpenGatewayModal(false);
          setIsModalOpen(true);
        }}
        onCancel={() => setOpenGatewayModal(false)}>
        {gatewayFields.map((field) => {
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
              belong={work.directory.target.space}
              onValuesChange={(fieldId, data) => {
                if (fieldId == '1') {
                  apply.metadata.groupId = data;
                }
                if (!data || data?.length !== gatewayData.current.get(fieldId)?.length) {
                  const _data = data ? (Array.isArray(data) ? data : [data]) : [];
                  gatewayData.current.set(fieldId, _data);
                  updateMembers(field);
                }
              }}
            />
          );
        })}
        &nbsp;
        {members ? (
          <>
            {gatewayFields.map((field) => (
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="选填：选择审核人员"
                key={field.id}
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
                    <>
                      <Select.Option name={i.name} key={i.id} value={i.id}>
                        <EntityIcon showName entityId={i.id} />
                      </Select.Option>
                    </>
                  );
                })}
              </Select>
            ))}
          </>
        ) : (
          <></>
        )}
      </Modal>
      <Modal
        width={400}
        title="拆分重新计算"
        open={opensplit}
        onOk={async () => {
          await service.current.splitRecount(splitNum);
          setOpensplit(false);
          setSplitNum(0);
        }}
        onCancel={() => setOpenGatewayModal(false)}>
        <InputNumber
          style={{ width: '150px' }}
          type="number"
          min={1}
          precision={0} // 禁止小数输入
          placeholder="请输入剩余资产的拆分份数"
          required
          onChange={(e) => {
            setSplitNum(e || 1);
          }}
        />
      </Modal>
      {isModalOpen && !saveStatus.current && (
        <Confirm
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          onOk={async () => {
            if (curTreeNode?.directionChildrenComplete === false) {
              message.warn('直属下级节点存在未完结节点！');
              return null;
            }
            if (saveStatus.current) {
              message.warn('请勿重复提交单据！');
              return null;
            }
            saveStatus.current = true;
            setIsModalOpen(false);
            try {
              setLoading(true);
              const data = memberData.current.size
                ? memberData.current
                : gatewayData.current;
              const instance = await apply.createApply(
                apply.target.spaceId,
                info.content,
                data,
              );
              if (instance) {
                message.success('提交成功');
                finished?.(true, instance.id);
              } else {
                message.warn('提交失败');
                saveStatus.current = false;
              }
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default DefaultWayStart;

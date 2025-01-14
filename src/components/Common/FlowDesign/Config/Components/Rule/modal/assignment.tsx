import React, { useState, useEffect } from 'react';
import { Card, Button, Popconfirm, DatePicker, message, Popover, Divider } from 'antd';
import { TextArea, TextBox, SelectBox } from 'devextreme-react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { model, schema } from '@/ts/base';
import { IWork, IForm } from '@/ts/core';
import { getUuid } from '@/utils/tools';
import FullScreenModal from '@/components/Common/fullScreen';
import { FieldSelect } from '@/components/Common/FlowDesign/Config/Components/Rule/modal/FieldSelect';
import OpenFileDialog from '@/components/OpenFileDialog';
import moment from 'moment';

/**
 * 赋值规则
 */

interface Iprops {
  primarys: schema.XForm[];
  details: schema.XForm[];
  current: model.NodeAssignmentRule;
  work: IWork;
  onOk: (rule: model.NodeAssignmentRule) => void;
  onCancel: () => void;
}

type ValueType = {
  primary: any;
  detail: any;
  type?: string;
};

const Assignment: React.FC<Iprops> = ({
  primarys,
  details,
  current,
  work,
  onCancel,
  onOk,
}) => {
  const initMap = new Map([
    [
      getUuid(),
      {
        primary: {},
        detail: {},
        type: 'mainToMain',
      },
    ],
  ]);
  const [targetSource, setTargetSource] = useState<model.MappingData[]>([]);
  const [targetDetailSource, setTargetDetailSource] = useState<model.MappingData[]>([]);
  const [dataMap, setDataMap] = useState<Map<string, ValueType> | undefined>();
  const [assignName, setAssignName] = useState<string>('');
  const [assignRemark, setAssignRemark] = useState<string>('');
  const [ruleType, setRuleType] = useState<string>('mainToDetail');
  const [formModel, setFormModel] = useState<boolean>(false);
  const [capture, setCapture] = useState<model.DetailToDetailRuleType>();
  const [qutoas, setQutoas] = useState<model.QuotaRuleType>({
    quotaExpirationDate: moment(moment().add(1, 'year').month(11)).format('YYYY-MM'),
  }); // 配置限额规则
  const [files, setFiles] = useState<schema.XForm[]>([]);
  // 字段给字段赋值
  const [visibleFieldAssignmentPopover, setVisibleFieldAssignmentPopover] =
    useState(false);
  const [fieldDataMap, setFieldDataMap] = useState<Map<string, ValueType> | undefined>();

  useEffect(() => {
    switch (current?.ruleType) {
      case 'mainToDetail':
        if (current?.assignments) {
          const newDataMap = new Map();
          current.assignments.forEach((item) => {
            newDataMap.set(getUuid(), item);
          });
          setDataMap(newDataMap);
        } else {
          setDataMap(initMap);
        }
        break;
      case 'fieldToField':
        if (current?.fieldAssignments) {
          const newDataMap = new Map();
          current.fieldAssignments.forEach((item) => {
            newDataMap.set(getUuid(), item);
          });
          setFieldDataMap(newDataMap);
        } else {
          setFieldDataMap(initMap);
        }
        break;
      case 'quota':
        if (current?.quota) {
          setQutoas(current.quota);
          if (current.quota.quotaDeprecitionForm) {
            setFiles(current.quota.quotaDeprecitionForm);
          }
        }
        break;
      case 'detailToDetail':
        if (current?.detailToDetail) {
          setCapture(current.detailToDetail);
          if (current.detailToDetail.forms) {
            setFiles(current.detailToDetail.forms);
          }
        }
        break;
      default:
        break;
    }
    setRuleType(current?.ruleType);
    setAssignName(current?.name);
    setAssignRemark(current?.remark);
  }, [current]);

  useEffect(() => {
    const tgs: model.MappingData[] = [];
    const detailTgs: model.MappingData[] = [];
    primarys.forEach((a, index) => {
      tgs.unshift(
        ...a.attributes.map((s) => {
          return {
            id: s.id,
            key: index.toString() + s.id,
            formId: a.id,
            formName: a.name,
            typeName: '属性',
            trigger: s.id,
            code: s.code,
            name: s.name,
            widget: s.widget,
            valueType: s.valueType,
          };
        }),
      );
    });
    details.forEach((a, index) => {
      const { id, name, attributes } = a;
      const commonFields = {
        formId: id,
        formName: name,
        typeName: '属性',
      };
      detailTgs.push({
        ...commonFields,
        id: 'belongId',
        key: `belongId`,
        trigger: 'belongId',
        code: 'BELONG_ID',
        name: '归属',
        valueType: '用户型',
      });

      const attributeDetails = attributes.map((s) => ({
        ...commonFields,
        id: s.propId || s.id,
        key: `${index}${s.id}`,
        trigger: s.id,
        code: s.code,
        name: s.name,
        widget: s.widget,
        valueType: s.valueType,
      }));

      detailTgs.unshift(...attributeDetails);
    });
    setTargetSource(tgs);
    setTargetDetailSource(detailTgs);
  }, [primarys, details]);

  // 计算主表向子表赋值规则
  const conditionChange = (type: string) => {
    if (dataMap && type === 'mainToDetail') {
      return Array.from(dataMap.values());
    } else if (fieldDataMap && type === 'fieldToField') {
      return Array.from(fieldDataMap.values());
    } else {
      return Array.from(initMap.values());
    }
  };

  const renderElement = () => {
    const addFieldValue = (type: string) => {
      const newMap = new Map(fieldDataMap || initMap);
      if (typeof fieldDataMap?.size !== 'undefined') {
        newMap.set(getUuid(), {
          primary: {},
          detail: {},
          type,
        });
      } else if (!fieldDataMap) {
        const key = Array.from(newMap.keys())[0];
        const item: any = newMap.get(key);
        item.type = type;
        newMap.set(key, item);
      }
      setFieldDataMap(newMap);
      setVisibleFieldAssignmentPopover(false);
    };
    if (ruleType === 'mainToDetail') {
      return (
        <Card
          title="子表赋值规则"
          extra={
            <Button
              type="link"
              onClick={() => {
                const newMap = new Map(dataMap || initMap);
                newMap.set(getUuid(), {
                  primary: {},
                  detail: {},
                });
                setDataMap(newMap);
              }}>
              新增一条
            </Button>
          }>
          <div
            style={{
              height: '300px',
              overflowY: 'scroll',
            }}>
            {dataMap &&
              Array.from(dataMap).map(([key, _value], index) => {
                const primaryValueType = dataMap.get(key)?.primary?.valueType;
                const primaryWidget = dataMap.get(key)?.primary?.widget;
                const detailTargets = targetDetailSource.filter(
                  (f) => f.valueType === primaryValueType || f.widget === primaryWidget,
                );
                return (
                  <div
                    key={key}
                    style={{
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                    }}>
                    <div>{index + 1}</div>
                    <div>
                      <FieldSelect
                        style={{ flex: 'auto' }}
                        value={dataMap.get(key)?.primary}
                        buttonText="主表选择"
                        onChange={(e: model.MappingData) => {
                          const newValue = {
                            detail: {},
                            primary: e,
                          };
                          const newDataMap = new Map(dataMap);
                          newDataMap.set(key, newValue);
                          setDataMap(newDataMap);
                        }}
                        data={targetSource}
                      />
                    </div>
                    <div>
                      <FieldSelect
                        style={{ flex: 'auto' }}
                        value={dataMap.get(key)?.detail}
                        buttonText="子表选择"
                        onChange={(e: model.MappingData) => {
                          const newValue = {
                            detail: e,
                            primary: dataMap.get(key)!.primary,
                          };
                          const newDataMap = new Map(dataMap);
                          newDataMap.set(key, newValue);
                          setDataMap(newDataMap);
                        }}
                        data={detailTargets}
                      />
                    </div>
                    <div>
                      <Button
                        type="link"
                        onClick={() => {
                          if (dataMap) {
                            const newMap = new Map(dataMap);
                            newMap.delete(key);
                            setDataMap(newMap);
                          }
                        }}>
                        删除
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      );
    }

    if (ruleType === 'fieldToField') {
      return (
        <Card
          title="字段赋值规则"
          extra={
            <Popover
              open={visibleFieldAssignmentPopover}
              trigger="click"
              placement="bottomLeft"
              content={
                <>
                  <a style={{ padding: 5 }} onClick={() => addFieldValue('mainToMain')}>
                    + 主表给主表字段赋值
                  </a>
                  <Divider style={{ margin: 6 }} />
                  <a
                    style={{ padding: 5 }}
                    onClick={() => addFieldValue('detailToDetail')}>
                    + 子表给子表字段赋值
                  </a>
                </>
              }>
              <a
                className="primary-color"
                onClick={() => setVisibleFieldAssignmentPopover(true)}>
                新增一条
              </a>
            </Popover>
          }>
          <div
            style={{
              height: '300px',
              overflowY: 'scroll',
            }}>
            {fieldDataMap &&
              Array.from(fieldDataMap).map(([key, _value], index) => {
                const primaryValueType = fieldDataMap.get(key)?.primary?.valueType;
                const primaryWidget = fieldDataMap.get(key)?.primary?.widget;
                const detailTargets = targetDetailSource.filter(
                  (f) => f.valueType === primaryValueType || f.widget === primaryWidget,
                );
                const type = fieldDataMap.get(key)?.type;
                return (
                  <div
                    key={key}
                    style={{
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                    }}>
                    <div>{index + 1}</div>
                    <div>
                      <FieldSelect
                        style={{ flex: 'auto' }}
                        value={fieldDataMap.get(key)?.primary}
                        buttonText={type === 'detailToDetail' ? '子表字段1' : '主表字段1'}
                        onChange={(e: model.MappingData) => {
                          const newValue = {
                            detail: {},
                            primary: e,
                            type,
                          };
                          const newDataMap = new Map(fieldDataMap);
                          newDataMap.set(key, newValue);
                          setFieldDataMap(newDataMap);
                        }}
                        data={type === 'detailToDetail' ? detailTargets : targetSource}
                      />
                    </div>
                    <div>
                      <FieldSelect
                        style={{ flex: 'auto' }}
                        value={fieldDataMap.get(key)?.detail}
                        buttonText={type === 'detailToDetail' ? '子表字段2' : '主表字段2'}
                        onChange={(e: model.MappingData) => {
                          const newValue = {
                            detail: e,
                            primary: fieldDataMap.get(key)!.primary,
                            type,
                          };
                          const newDataMap = new Map(fieldDataMap);
                          newDataMap.set(key, newValue);
                          setFieldDataMap(newDataMap);
                        }}
                        data={type === 'detailToDetail' ? detailTargets : targetSource}
                      />
                    </div>
                    <div>
                      <Button
                        type="link"
                        onClick={() => {
                          if (fieldDataMap) {
                            const newMap = new Map(fieldDataMap);
                            newMap.delete(key);
                            setFieldDataMap(newMap);
                          }
                        }}>
                        删除
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      );
    }

    if (ruleType === 'detailToDetail') {
      return (
        <Card>
          <div className="flex items-center" style={{ marginBottom: '10px' }}>
            <div style={{ marginRight: '16px' }}>被赋值的表单：</div>
            <div
              style={{
                flex: '1',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <span>{files[0]?.name || ''}</span>
              {files.length > 0 ? (
                <span>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    style={{ marginRight: '10px' }}
                    onClick={() => {
                      setFormModel(true);
                    }}>
                    编辑表单绑定
                  </Button>
                  <Popconfirm
                    key={'delete'}
                    title="确定删除吗？"
                    onConfirm={() => {
                      setFiles([]);
                    }}>
                    <Button type="primary" icon={<DeleteOutlined />} danger>
                      删除条件
                    </Button>
                  </Popconfirm>
                </span>
              ) : (
                <Button
                  type="primary"
                  onClick={() => {
                    setFormModel(true);
                  }}>
                  选择表单绑定
                </Button>
              )}
            </div>
            {formModel && (
              <OpenFileDialog
                title={`选择表单`}
                rootKey={work.application.key}
                accepts={['表单']}
                excludeIds={files.map((i) => i.id)}
                onCancel={() => setFormModel(false)}
                onOk={(files) => {
                  if (files.length > 0) {
                    const forms = (files as unknown[] as IForm[]).map((i) => i.metadata);
                    setFiles(forms);
                  }
                  setFormModel(false);
                }}
              />
            )}
          </div>
        </Card>
      );
    }

    return (
      <Card>
        <div className="flex items-center" style={{ marginBottom: '10px' }}>
          <div style={{ marginRight: '16px' }}>计算可更新数截止年份</div>
          <div
            style={{
              flex: '1',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}>
            <DatePicker
              value={moment(qutoas?.quotaExpirationDate)}
              format={'YYYY-MM'}
              picker="month"
              onChange={(e) => {
                setQutoas({
                  ...qutoas,
                  quotaExpirationDate: moment(e).format('YYYY-MM'),
                });
              }}
            />
          </div>
        </div>
        <div className="flex items-center" style={{ marginBottom: '10px' }}>
          <div style={{ marginRight: '16px' }}>取得日期：</div>
          <FieldSelect
            style={{ flex: 'auto' }}
            value={qutoas?.quotaAcquisitionDate}
            onChange={(e: model.MappingData) => {
              setQutoas({
                ...qutoas,
                quotaAcquisitionDate: e,
              });
            }}
            data={targetDetailSource.filter(
              (i) => i.widget === '日期选择框' || i.valueType === '日期型',
            )}
          />
        </div>
        <div className="flex items-center" style={{ marginBottom: '10px' }}>
          <div style={{ marginRight: '16px' }}>折旧摊销年限字段：</div>
          <FieldSelect
            style={{ flex: 'auto' }}
            value={qutoas?.quotaDeprecitionDate}
            onChange={(e: model.MappingData) => {
              setQutoas({
                ...qutoas,
                quotaDeprecitionDate: e,
              });
            }}
            data={targetDetailSource.filter(
              (i) => i.widget === '数字框' || i.valueType === '数值型',
            )}
          />
        </div>
        <div className="flex items-center" style={{ marginBottom: '10px' }}>
          <div style={{ marginRight: '16px' }}>可更新数字段：</div>
          <FieldSelect
            style={{ flex: 'auto' }}
            value={qutoas?.quotaNumber}
            onChange={(e: model.MappingData) => {
              setQutoas({
                ...qutoas,
                quotaNumber: e,
              });
            }}
            data={targetDetailSource.filter(
              (i) => i.widget === '文本框' || i.valueType === '描述型',
            )}
          />
        </div>
        <div className="flex items-center" style={{ marginBottom: '10px' }}>
          <div style={{ marginRight: '16px' }}>折旧摊销年限表单：</div>
          <div
            style={{
              flex: '1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <span>{files[0]?.name || ''}</span>
            {files.length > 0 ? (
              <span>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  style={{ marginRight: '10px' }}
                  onClick={() => {
                    setFormModel(true);
                  }}>
                  编辑表单绑定
                </Button>
                <Popconfirm
                  key={'delete'}
                  title="确定删除吗？"
                  onConfirm={() => {
                    setFiles([]);
                  }}>
                  <Button type="primary" icon={<DeleteOutlined />} danger>
                    删除条件
                  </Button>
                </Popconfirm>
              </span>
            ) : (
              <Button
                type="primary"
                onClick={() => {
                  setFormModel(true);
                }}>
                选择表单绑定
              </Button>
            )}
          </div>
          {formModel && (
            <OpenFileDialog
              title={`选择表单`}
              rootKey={work.directory.spaceKey}
              accepts={['表单']}
              excludeIds={files.map((i) => i.id)}
              onCancel={() => setFormModel(false)}
              onOk={(files) => {
                if (files.length > 0) {
                  const forms = (files as unknown[] as IForm[]).map((i) => i.metadata);
                  setFiles(forms);
                }
                setFormModel(false);
              }}
            />
          )}
        </div>
        <div
          style={{
            marginBottom: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}>
          <div>
            <FieldSelect
              style={{ flex: 'auto' }}
              value={capture?.billsField}
              buttonText="单据表 - 单据编号字段"
              formId={details[0]?.id || ''}
              onChange={(e: model.MappingData) => {
                setCapture({
                  ...capture,
                  billsField: e,
                });
              }}
              data={targetDetailSource.filter((f) => f.valueType === '序列型')}
            />
          </div>
          <div>
            <FieldSelect
              style={{ flex: 'auto' }}
              value={capture?.detailField}
              buttonText="明细表 - 单据编号字段"
              formId={details[1]?.id || ''}
              onChange={(e: model.MappingData) => {
                setCapture({
                  ...capture,
                  detailField: e,
                });
              }}
              data={targetDetailSource.filter((f) => f.valueType === '序列型')}
            />
          </div>
        </div>
      </Card>
    );
  };

  const vaildDisable = () => {
    if (ruleType === 'quota' || current?.ruleType === 'quota') {
      if (
        qutoas.quotaNumber !== undefined &&
        qutoas.quotaAcquisitionDate !== undefined &&
        qutoas.quotaDeprecitionDate &&
        files.length > 0
      ) {
        save();
      } else {
        onCancel();
        return message.error('请完善配置限额规则');
      }
    } else {
      save();
    }
  };

  const save = () => {
    onOk.apply(this, [
      {
        id: current?.id ?? getUuid(),
        type: 'assignment',
        name: assignName,
        remark: assignRemark,
        ruleType: ruleType,
        assignments: ruleType === 'mainToDetail' ? conditionChange('mainToDetail') : [],
        fieldAssignments:
          ruleType === 'fieldToField' ? conditionChange('fieldToField') : [],
        quota: ruleType === 'quota' ? { ...qutoas, quotaDeprecitionForm: files } : {},
        trigger: [],
        detailToDetail: {
          forms: files,
          ...capture,
        },
      },
    ]);
  };

  return (
    <FullScreenModal
      open={true}
      title={'赋值规则'}
      destroyOnClose
      width={'60vw'}
      bodyHeight={'65vh'}
      onSave={() => {
        vaildDisable();
      }}
      onCancel={onCancel}>
      <div>
        <TextBox
          label="名称"
          labelMode="floating"
          value={assignName}
          onValueChange={(e) => {
            setAssignName(e);
          }}
        />
        <SelectBox
          label="请选择赋值规则类型"
          showClearButton
          value={ruleType}
          dataSource={[
            { text: '主表向子表赋值规则', value: 'mainToDetail' },
            { text: '字段向字段赋值规则', value: 'fieldToField' },
            { text: '配置限额规则', value: 'quota' },
            { text: '子表向子表赋值', value: 'detailToDetail' },
          ]}
          displayExpr={'text'}
          valueExpr={'value'}
          onValueChange={(e) => {
            setRuleType(e);
          }}
        />
        {renderElement()}
        <TextArea
          label="备注"
          labelMode="floating"
          onValueChanged={(e) => {
            setAssignRemark(e.value);
          }}
          value={assignRemark}
        />
      </div>
    </FullScreenModal>
  );
};
export default Assignment;

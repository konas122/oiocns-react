import { Emitter } from '@/ts/base/common';
import { IReport, IProperty, orgAuth } from '@/ts/core';
import { Form } from 'devextreme-react';
import { GroupItem, SimpleItem } from 'devextreme-react/form';
import React, { useState, useEffect } from 'react';
import { ValueChangedEvent } from 'devextreme/ui/text_box';
import useObjectUpdate from '@/hooks/useObjectUpdate';
import { Button, Popconfirm } from 'antd';
import OpenFileDialog from '@/components/OpenFileDialog';
import { XCells } from '@/ts/base/schema';
import { excelCellRef } from '../Utils';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { model } from '@/ts/base';
import ValidateRule from './reportRule/modal/validateRule';
import DataRetrievalRue from './reportRule/modal/dataRetrievalRue';
import { loadwidgetOptions } from '@/components/DataStandard/WorkForm/Utils';
import { deepClone } from '@/ts/base/common';

interface IRowInfoProps {
  current: IReport;
  cell: XCells;
  notifyEmitter: Emitter;
}

const CellConfig: React.FC<IRowInfoProps> = ({ current, cell, notifyEmitter }) => {
  const [key, forceUpdate] = useObjectUpdate(current);
  const [formData, setFormData] = useState<XCells>({
    ...cell,
    rule: cell.rule || {},
  });
  const [center, setCenter] = useState(<></>);
  const [select, setSelect] = useState<model.Rule>();
  const [openType, setOpenType] = useState(0);
  const [dataRetrievalRue, setDataRetrievalRue] = useState<any>(undefined);
  const [visibleDataRetrievalRue, setVisibleDataRetrievalRue] = useState(false);

  const pubileCellType = [
    { key: '固定型', text: '固定型' },
    { key: '输入型', text: '输入型' },
    { key: '函数型', text: '函数型' },
    { key: '属性型', text: '属性型' },
    { key: '取数型', text: '取数型' },
  ];

  const variableCellType = [
    { key: '数组型', text: '数组型' },
    { key: '取数型', text: '取数型' },
  ];

  useEffect(() => {
    try {
      if (cell.rule.value?.type === '取数型' && cell.rule.value.valueString) {
        setDataRetrievalRue(cell.rule.value.valueString);
      } else {
        setDataRetrievalRue(undefined);
      }
      if (cell.rule.value?.type !== '固定型' && cell.rule.value?.type !== '取数型') {
        setSelect(JSON.parse(cell.rule?.ruleString ?? '{}'));
      }
    } catch (error) {
      console.log('error', error);
    }
    setFormData(cell);
    forceUpdate();
  }, [cell]);

  const notityAttrChanged = () => {
    setFormData({ ...formData });
    notifyEmitter.changCallback('cell', formData);
  };

  const updatedataType = (e: ValueChangedEvent) => {
    setFormData((prevFormData) => {
      const newRule = {
        ...prevFormData.rule,
        type: e.value,
      };
      return {
        ...prevFormData,
        rule: newRule,
        valueType: '',
      };
    });
    forceUpdate();
  };

  const updateAttrWidget = (e: ValueChangedEvent) => {
    setFormData((prevFormData) => {
      const newRule = deepClone(prevFormData.rule);
      if (newRule.value) {
        newRule.value.valueString.widget = e.value;
      }
      return {
        ...prevFormData,
        rule: newRule,
        valueType: '',
      };
    });
    forceUpdate();
  };

  const getcoords = () => {
    return excelCellRef({ row: cell.row, col: cell.col });
  };

  return (
    <>
      <Form
        key={key}
        height={'calc(100vh - 130px)'}
        scrollingEnabled
        formData={formData}
        onFieldDataChanged={notityAttrChanged}>
        <GroupItem>
          <SimpleItem>
            <span>坐标：{getcoords()}</span>
          </SimpleItem>
          <SimpleItem
            dataField="rule.value.type"
            editorType="dxSelectBox"
            label={{ text: '数据类型' }}
            editorOptions={{
              items:
                formData.code !== 'variableSheet' ? pubileCellType : variableCellType,
              displayExpr: 'text',
              valueExpr: 'text',
              value: formData.rule.value?.type || '固定型',
              onValueChanged: (e: ValueChangedEvent) => updatedataType(e),
            }}
          />
          {formData?.rule.value?.type !== '属性型' &&
            formData?.rule.value?.type !== '输入型' &&
            formData?.rule.value?.type !== '取数型' &&
            formData?.rule.value?.type !== '' && (
              <SimpleItem
                editorType="dxTextArea"
                dataField="rule.value.valueString"
                label={{ text: '数据值' }}
                editorOptions={{
                  height: 120,
                }}
              />
            )}
        </GroupItem>
        {formData.code != 'variableSheet' && (
          <GroupItem>
            {formData?.rule.value?.type === '属性型' && (
              <SimpleItem label={{ text: '引用其他属性' }}>
                <Button
                  size="small"
                  style={{ marginRight: '5px' }}
                  onClick={() =>
                    setCenter(
                      <OpenFileDialog
                        title={`选择属性`}
                        accepts={['属性']}
                        rootKey={current.spaceKey}
                        excludeIds={[]}
                        onCancel={() => setCenter(<></>)}
                        onOk={(files) => {
                          setFormData((prevFormData) => {
                            let newRuleValue = prevFormData.rule.value || {
                              type: '',
                              valueString: null,
                            };
                            (files as IProperty[]).forEach((item) => {
                              newRuleValue.valueString = {
                                propId: item.id,
                                property: item.metadata,
                                ...item.metadata,
                                id: 'snowId()',
                                rule: '{}',
                                queryRule: '',
                                options: {
                                  visible: true,
                                  isRequired: false,
                                },
                                formId: current.id,
                                authId: orgAuth.SuperAuthId,
                              };
                            });
                            newRuleValue.type = '属性型';
                            return {
                              ...prevFormData,
                              rule: {
                                ...prevFormData.rule,
                                value: newRuleValue,
                              },
                            };
                          });
                          notifyEmitter.changCallback('cell', formData);
                          setCenter(<></>);
                        }}
                      />,
                    )
                  }>
                  配置
                </Button>
                {formData.rule.value.valueString?.name}{' '}
                {formData.rule.value.valueString?.code}
              </SimpleItem>
            )}
            {formData?.rule.value?.type === '属性型' && (
              <SimpleItem
                dataField="rule.value.valueString.widget"
                editorType="dxSelectBox"
                label={{ text: '组件' }}
                editorOptions={{
                  items: formData.rule.value.valueString
                    ? loadwidgetOptions(formData.rule.value.valueString)
                    : [],
                  onValueChanged: (e: ValueChangedEvent) => updateAttrWidget(e),
                }}
              />
            )}
            {formData?.rule.value?.type !== '属性型' &&
              formData?.code != 'variableSheet' && (
                <SimpleItem
                  dataField="valueType"
                  editorType="dxSelectBox"
                  label={{ text: '数据格式' }}
                  editorOptions={{
                    items: [
                      { key: '文本框', text: '文本框' },
                      { key: '数字框', text: '数字框' },
                      { key: '日期型', text: '日期型' },
                    ],
                    displayExpr: 'text',
                    valueExpr: 'text',
                    value: formData?.valueType,
                  }}
                />
              )}
            {formData?.valueType === '数字框' && (
              <SimpleItem dataField="accuracy" label={{ text: '精度' }} />
            )}
            {formData?.rule.value?.type === '函数型' && (
              <SimpleItem
                dataField="rule.isVariableData"
                editorType="dxCheckBox"
                label={{ text: '是否变量集取数' }}
              />
            )}
            <SimpleItem
              dataField="readOnly"
              editorType="dxCheckBox"
              label={{ text: '是否只读' }}
            />
            <SimpleItem
              dataField="rule.isRequired"
              editorType="dxCheckBox"
              label={{ text: '是否必填' }}
            />
            <SimpleItem
              dataField="rule.isSummary"
              editorType="dxCheckBox"
              label={{ text: '是否计算汇总' }}
            />
            {formData?.rule.value?.type !== '固定型' &&
              formData?.rule.value?.type !== '取数型' && (
                <SimpleItem
                  label={{ text: '校验规则', visible: true }}
                  render={() =>
                    select?.id ? (
                      <span>
                        <Button
                          type="link"
                          icon={<EditOutlined />}
                          onClick={() => {
                            setSelect(JSON.parse(formData.rule?.ruleString ?? '{}'));
                            setOpenType(1);
                          }}>
                          编辑校验规则
                        </Button>
                        <Popconfirm
                          key={'delete'}
                          title="确定删除吗？"
                          onConfirm={() => {
                            if (formData.rule.ruleString) {
                              formData.rule.ruleString = undefined;
                            }
                            setSelect(undefined);
                          }}>
                          <Button type="link" icon={<DeleteOutlined />} danger>
                            删除校验规则
                          </Button>
                        </Popconfirm>
                      </span>
                    ) : (
                      <Button
                        type="link"
                        onClick={() => {
                          setOpenType(1);
                          setSelect(undefined);
                        }}>
                        添加校验规则
                      </Button>
                    )
                  }
                />
              )}
          </GroupItem>
        )}
        {formData?.rule.value?.type === '取数型' && (
          <SimpleItem
            label={{ text: '取数规则', visible: true }}
            render={() =>
              dataRetrievalRue ? (
                <span>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setDataRetrievalRue(formData.rule.value!.valueString ?? '{}');
                      setVisibleDataRetrievalRue(true);
                    }}>
                    编辑取数规则
                  </Button>
                  <Popconfirm
                    key={'delete'}
                    title="确定删除吗？"
                    onConfirm={() => {
                      // if (formData.rule.ruleString) {
                      //   formData.rule.ruleString = undefined;
                      // }
                      if (formData.rule.value!.valueString) {
                        formData.rule.value!.valueString = undefined;
                      }
                      notifyEmitter.changCallback('cell', formData);
                      setDataRetrievalRue(undefined);
                    }}>
                    <Button type="link" icon={<DeleteOutlined />} danger>
                      删除取数规则
                    </Button>
                  </Popconfirm>
                </span>
              ) : (
                <Button
                  type="link"
                  onClick={() => {
                    setVisibleDataRetrievalRue(true);
                    setDataRetrievalRue('');
                  }}>
                  添加取数规则
                </Button>
              )
            }
          />
        )}

        {openType == 1 && (
          <ValidateRule
            reports={[current.metadata]}
            onCancel={() => setOpenType(0)}
            current={select as model.NodeValidateRule}
            targetId={getcoords()}
            onOk={(rule) => {
              setSelect(rule);
              if (!formData.rule) {
                formData.rule = {};
              }
              formData.rule.ruleString = JSON.stringify(rule);
              notifyEmitter.changCallback('cell', formData);
              setOpenType(0);
            }}
          />
        )}
        {visibleDataRetrievalRue && (
          <DataRetrievalRue
            data={dataRetrievalRue}
            current={current}
            targetId={getcoords()}
            onCancel={() => setVisibleDataRetrievalRue(false)}
            onOk={(values) => {
              setDataRetrievalRue(values);
              if (!formData.rule) {
                formData.rule = {
                  value: {
                    valueString: '',
                    type: '取数型',
                  },
                };
              }
              // formData.rule.ruleString = values;
              formData.rule.value!.valueString = values;
              notifyEmitter.changCallback('cell', formData);
              setVisibleDataRetrievalRue(false);
            }}
          />
        )}
      </Form>
      {center}
    </>
  );
};

export default CellConfig;

import React, { FC, useState } from 'react';
import { IForm, IProperty, ISequence } from '@/ts/core';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Form, message, Button, Modal, Table, Row, Col, Select, Input } from 'antd';
import { model } from '@/ts/base';
import OpenFileDialog from '@/components/OpenFileDialog';

interface IAttrAsyncValProps {
  fieldName: string;
  value?: boolean;
  conditionConfig?: model.Encode[];
  current: IForm;
  // onValueChanged: Function;
  onConditionsChanged: Function;
  onConditionsDelete: Function;
}
const typeOptions = [
  { value: 0, label: '常量' },
  { value: 1, label: '流水' },
  { value: 2, label: '时间' },
];
const timeOptions = [
  {
    value: 0,
    label: '年',
  },
  {
    value: 1,
    label: '年月',
  },
  {
    value: 2,
    label: '年月日',
  },
];

const AttrAsyncVal: FC<IAttrAsyncValProps> = (props) => {
  const { conditionConfig, current } = props;
  const [form] = Form.useForm();
  const FormItem = Form.Item;
  const [tableData, setTableData] = useState<model.Encode[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [sequenceDialog, setSequenceDialog] = useState(false);
  const [sequence, setSequence] = useState<ISequence>();

  const encodeColumns = [
    {
      title: '类型',
      dataIndex: 'encodeType',
      width: 60,
      render: (_: any, record: model.Encode) => {
        return record.encodeType?.label;
      },
    },
    {
      title: '取值/序列规则',
      dataIndex: 'length',
      width: 60,
      render: (_: any, record: model.Encode) => {
        return record.sequence?.name || record.encodeValue;
      },
    },
    {
      title: '维度精度', // 显示精度
      dataIndex: 'dimensionalAccuracy',
      width: 80,
      render: (_: any, record: model.Encode) => {
        return record.dimensionalAccuracy?.label;
      },
    },
    { title: '顺序', dataIndex: 'order', width: 50 },
    {
      title: '操作',
      dataIndex: 'operate',
      width: 50,
      render: (_: any, record: model.Encode) => {
        return (
          <>
            <Button
              type="text"
              danger
              onClick={() => {
                const last = tableData.filter((a) => a.id !== record.id);
                setTableData(last);
              }}>
              删除
            </Button>
          </>
        );
      },
    },
  ];
  const getFormat = () => {
    let show = '';
    for (const conf of conditionConfig!!) {
      show =
        show +
        conf.encodeType.label +
        `(${conf.encodeValue || conf.sequence?.name || conf.dimensionalAccuracy?.label})`;
    }
    return show;
  };
  const cnfirmDelete = () => {
    Modal.confirm({
      title: '是否确定删除已配置的规则？',
      onOk() {
        setTableData([]);
        props.onConditionsDelete(props.fieldName);
      },
    });
  };
  return (
    <div>
      <Button
        onClick={() => {
          setShowModal(true);
          setTableData(conditionConfig || []);
        }}
        size="small"
        icon={conditionConfig?.length ? <EditOutlined /> : null}
        type="link">
        {conditionConfig?.length ? '编辑编号规则' : '添加编号规则'}
      </Button>
      {conditionConfig?.length ? (
        <Button
          onClick={() => {
            cnfirmDelete();
          }}
          size="small"
          icon={<DeleteOutlined />}
          danger
          type="link">
          删除编号规则
        </Button>
      ) : null}
      {conditionConfig && conditionConfig.length > 0 ? (
        <Row>
          <Col span={18}>
            <span>取值格式：</span>
            <span>{getFormat()}</span>
          </Col>
        </Row>
      ) : null}
      <Modal
        title="编号规则"
        open={showModal}
        destroyOnClose
        width={800}
        onCancel={() => {
          form.resetFields();
          setTableData([]);
          setShowModal(false);
        }}
        onOk={() => {
          if (!tableData.length) {
            message.warn('请先填写信息,再确定!');
            return;
          }
          props.onConditionsChanged(tableData, props.fieldName);
          setTableData([]);
          setShowModal(false);
        }}>
        <>
          <Form preserve={false} layout="vertical" form={form}>
            <Row gutter={16}>
              <Col className="gutter-row" span={4}>
                <FormItem
                  label="编号类型"
                  name="encodeType"
                  rules={[{ required: true, message: '请选择类型' }]}>
                  <Select labelInValue options={typeOptions} />
                </FormItem>
              </Col>
              <FormItem
                noStyle
                shouldUpdate={(prevValues: any, currentValues: any) =>
                  prevValues.encodeType !== currentValues.encodeType
                }>
                {({ getFieldValue }) =>
                  ~[0].indexOf(getFieldValue('encodeType')?.value) ? (
                    <Col className="gutter-row" span={4}>
                      <FormItem
                        label="编号取值"
                        name="encodeValue"
                        rules={[{ required: true, message: '请填写编号取值' }]}>
                        <Input />
                      </FormItem>
                    </Col>
                  ) : null
                }
              </FormItem>
              <FormItem
                noStyle
                shouldUpdate={(prevValues: any, currentValues: any) =>
                  prevValues.encodeType !== currentValues.encodeType
                }>
                {({ getFieldValue }) =>
                  getFieldValue('encodeType')?.value === 2 ? (
                    <Col className="gutter-row" span={4}>
                      <FormItem
                        label="维度精度"
                        name="dimensionalAccuracy"
                        rules={[{ required: true, message: '请填写维度精度' }]}>
                        <Select labelInValue options={timeOptions} />
                      </FormItem>
                    </Col>
                  ) : null
                }
              </FormItem>
              <FormItem
                noStyle
                shouldUpdate={(prevValues: any, currentValues: any) =>
                  prevValues.encodeType !== currentValues.encodeType
                }>
                {({ getFieldValue }) =>
                  getFieldValue('encodeType')?.value === 1 ? (
                    <Col className="gutter-row" span={4}>
                      <FormItem
                        label="序列规则"
                        name="sequence"
                        rules={[{ required: true, message: '请选择序列规则' }]}>
                        <Input
                          value={sequence?.name}
                          onClick={() => setSequenceDialog(true)}
                        />
                      </FormItem>
                    </Col>
                  ) : null
                }
              </FormItem>
              <Col className="gutter-row" span={4}>
                <FormItem
                  label="顺序"
                  name="order"
                  rules={[{ required: true, message: '请填写顺序' }]}>
                  <Input />
                </FormItem>
              </Col>
              <Col className="gutter-row" span={4}>
                <FormItem label="&nbsp;" name="btn">
                  <Button
                    type="primary"
                    onClick={() => {
                      form.validateFields().then((vals: model.Encode) => {
                        for (const data of tableData) {
                          if (data.order === vals.order) {
                            message.warn('已有相同顺序类型');
                            return;
                          }
                        }
                        setTableData(
                          tableData.concat([
                            {
                              ...vals,
                              sequence: sequence?.metadata,
                              id: Math.floor(Math.random() * 1000),
                            } as unknown as model.Encode,
                          ]),
                        );
                        // setSequence(undefined);
                        form.resetFields();
                      });
                    }}>
                    添加
                  </Button>
                </FormItem>
              </Col>
            </Row>
          </Form>
          <Table pagination={false} dataSource={tableData} columns={encodeColumns} />
        </>
      </Modal>
      {sequenceDialog && (
        <OpenFileDialog
          multiple={false}
          title={`选择序列规则`}
          accepts={['序列']}
          rootKey={current.spaceKey}
          // excludeIds={current.attributes.filter((i) => i.propId).map((a) => a.propId)}
          onCancel={() => setSequenceDialog(false)}
          onOk={(files) => {
            (files as IProperty[]).forEach((item) => {
              form.setFieldValue('sequence', item.name);
              setSequence(item as unknown as ISequence);
            });
            setSequenceDialog(false);
          }}
        />
      )}
    </div>
  );
};

export default AttrAsyncVal;

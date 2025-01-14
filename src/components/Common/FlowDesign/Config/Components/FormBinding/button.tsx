import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Form, Input, Select, Radio } from 'antd';
import OpenFileDialog from '@/components/OpenFileDialog';
import { IWork } from '@/ts/core';
import { model } from '@/ts/base';
import { XAttribute } from '@/ts/base/schema';
import { FieldChangeTable } from '@/components/Common/ExecutorShowComp';

type ButtonConfigProps = {
  work: IWork;
  finished: () => void;
  operateRule: model.FormInfo;
};

const ButtonConfig: React.FC<ButtonConfigProps> = (props) => {
  const [showChildModal, setShowChildModal] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>();
  const [tableData, setTableData] = useState<any[]>(
    props.operateRule['operationButton'] ? props.operateRule['operationButton'] : [],
  );
  const [form] = Form.useForm();
  const [center, setCenter] = useState(<></>);
  const [fieldChanges, setFieldChanges] = useState<model.FieldChange[]>([]);
  const [fields, setFields] = useState<XAttribute[]>([]);
  const [scene, setScene] = useState('');
  const { Option } = Select;

  const subtableButtonType = [
    {
      label: '选择按钮',
      value: 'choice',
    },
    {
      label: '汇总按钮',
      value: 'summary',
    },
    {
      label: '同步按钮',
      value: 'syncData',
    },
  ];

  const columns = [
    {
      title: '按钮名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '按钮类型',
      dataIndex: 'type',
      key: 'type',
      render: (_: any, row: any) => {
        const matchedItem = subtableButtonType.find((item) => item.value === row.type);
        if (matchedItem) {
          return matchedItem.label;
        }
      },
    },
    {
      title: '业务场景',
      dataIndex: 'scene',
      key: 'scene',
      render: (_: any, row: any) => {
        const name = row?.scene === 'mobile' ? '移动端' : 'PC端';
        return name;
      },
    },
    {
      title: '绑定表单',
      dataIndex: 'form',
      key: 'form',
      render: (_: any, row: any) => {
        return row.form?.name;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, item: any) => (
        <Button
          type="primary"
          onClick={() => {
            setTableData([...tableData.filter((it) => it.code != item.code)]);
          }}>
          删除
        </Button>
      ),
    },
  ];

  useEffect(() => {
    if (scene === 'mobile') {
      const id = props.operateRule.id;
      const formList = [...props.work.detailForms, ...props.work.primaryForms];
      const forms = formList.find((form_) => form_.id == id);
      form.setFieldValue('form', {
        name: forms?.name,
        id: forms?.id,
        metadata: forms?.metadata,
      });
      setFormName(forms?.name ?? '');
      setFields(forms?.metadata.attributes ?? []);
    }
  }, [scene]);

  const childModal = () => {
    return (
      <Modal
        title="按钮配置"
        open={showChildModal}
        onOk={() => {
          form.validateFields().then(() => {
            setTableData([...tableData, form.getFieldsValue()]);
            setFormName('');
            setShowChildModal(false);
          });
        }}
        onCancel={() => {
          setShowChildModal(false);
          setFormName('');
        }}>
        <Form preserve={false} layout="vertical" form={form}>
          <Form.Item
            label="按钮名称"
            name="name"
            rules={[{ required: true, message: '请输入按钮名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="按钮编码"
            name="code"
            rules={[{ required: true, message: '请输入按钮编码' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="按钮类型"
            name="type"
            rules={[{ required: true, message: '请选择按钮类型' }]}>
            <Select>
              {subtableButtonType.map((option: any, index: number) => (
                <Option key={index} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="scene"
            label="业务场景"
            rules={[{ required: true, message: '请选择业务场景' }]}>
            <Radio.Group onChange={(e) => setScene(e.target.value)}>
              <Radio value="pc">PC端</Radio>
              <Radio value="mobile">移动端</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label="绑定表单"
            name="form"
            rules={[{ required: true, message: '请选择要绑定的表单' }]}>
            <div>
              <Button
                type="primary"
                style={{ marginRight: '5px' }}
                onClick={() => {
                  setCenter(
                    <OpenFileDialog
                      title={`选择表单`}
                      rootKey={(props.work as IWork)?.directory?.spaceKey}
                      currentKey={(props.work as IWork)?.directory?.spaceKey}
                      accepts={['表单']}
                      excludeIds={[]}
                      rightShow={false}
                      onCancel={() => setCenter(<></>)}
                      onOk={(files) => {
                        form.setFieldValue('form', {
                          name: files[0].name,
                          id: files[0].id,
                          metadata: files[0].metadata,
                        });
                        getFormFields();
                        setFormName(files[0].name);
                        form.validateFields(['form']);
                        setCenter(<></>);
                      }}
                    />,
                  );
                }}>
                选择表单
              </Button>
              {formName}
            </div>
          </Form.Item>
          {formName && scene === 'mobile' && (
            <>
              <Form.Item
                label="关联表单字段"
                name="correlationCode"
                rules={[{ required: true, message: '请选择关联表单字段' }]}
                tooltip="业务需要关联已选表单中的字段,可咨询开发">
                <Select>
                  {fields.map((option: any, index: number) => (
                    <Option key={index} value={option.id}>
                      {option.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label={'字段变更-' + formName}
                name="fieldChanges"
                rules={[{ required: true, message: '请选择要变更的字段' }]}>
                已设置变更字段{fieldChanges?.length}个
                <Button
                  type="link"
                  size="small"
                  onClick={() =>
                    setCenter(
                      <FieldChangeTable
                        work={props.work}
                        finished={(e: model.FieldChange[]) => {
                          setFieldChanges(e);
                          if (fieldChanges.length) {
                            form.setFieldValue('fieldChanges', {
                              ...form.getFieldValue('form'),
                              fieldChanges: fieldChanges,
                            });
                          } else {
                            form.setFieldValue('fieldChanges', undefined);
                          }
                          form.validateFields(['fieldChanges']);
                          setCenter(<></>);
                        }}
                        formChange={{
                          ...form.getFieldValue('form'),
                          fieldChanges: fieldChanges,
                        }}
                      />,
                    )
                  }>
                  编辑变更字段
                </Button>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    );
  };

  const getFormFields = () => {
    const formInfo = form.getFieldValue('form');
    if (formInfo) {
      setFields(formInfo.metadata.attributes ?? []);
    }
  };

  return (
    <div>
      <Modal
        title={'按钮配置'}
        width={800}
        open={true}
        onOk={() => {
          props.operateRule['operationButton'] = tableData;
          props.finished();
        }}
        onCancel={props.finished}>
        <div style={{ display: 'flex', marginBottom: '5px' }}>
          <Button type="primary" onClick={() => setShowChildModal(true)}>
            添加
          </Button>
        </div>
        <Table columns={columns} rowKey={'code'} dataSource={tableData} />
      </Modal>

      {showChildModal && childModal()}
      {center}
    </div>
  );
};

export default ButtonConfig;

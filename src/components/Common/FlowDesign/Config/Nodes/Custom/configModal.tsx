import { model } from '@/ts/base';
import React, { FC, useEffect, useState } from 'react';
import { Modal, Button, Form, Select } from 'antd';
import { WorkNodeDisplayModel, executorNames } from '@/utils/work';

interface IProps {
  current: WorkNodeDisplayModel;
  refresh: (param?: { trigger: string; funcName: string }) => void;
}

const ConfigModal: FC<IProps> = (props) => {
  const [executors, setExecutors] = useState<model.Executor[]>([]);
  const [form] = Form.useForm();
  useEffect(() => {
    props.current.executors = props.current.executors || [];
    setExecutors(props.current.executors);
  }, [props.current]);

  const onOk = () => {
    form.validateFields().then((val) => {
      props.refresh(val);
    });
  };
  return (
    <Modal
      bodyStyle={{ border: 'none' }}
      open={true}
      title="执行器配置"
      onCancel={() => props.refresh()}
      onOk={onOk}
      footer={[
        <Button key="cancel" onClick={() => props.refresh()}>
          取消
        </Button>,
        <Button type="primary" key="cancel" onClick={() => onOk()}>
          确定
        </Button>,
      ]}>
      <Form
        preserve={false}
        form={form}
        layout="vertical"
        initialValues={{ trigger: 'before', funcName: '' }}>
        <Form.Item
          name="trigger"
          label="状态"
          rules={[
            {
              required: true,
              message: '请选择状态',
            },
          ]}>
          <Select
            bordered={false}
            allowClear
            style={{
              borderRadius: '3px',
              border: '1px solid #DCDCDC',
            }}
            options={[
              { label: '审核前', value: 'before' },
              { label: '审核后', value: 'after' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="funcName"
          label="数据"
          rules={[
            {
              required: true,
              message: '请选择数据',
            },
          ]}>
          <Select
            bordered={false}
            allowClear
            style={{
              borderRadius: '3px',
              border: '1px solid #DCDCDC',
            }}
            options={executorNames
              .filter((a) => executors.find((s) => s.funcName == a) == undefined)
              .map((name: string) => {
                return {
                  label: name,
                  value: name,
                };
              })}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ConfigModal;

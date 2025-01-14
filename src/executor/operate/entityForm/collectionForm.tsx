import { schema } from '@/ts/base';
import { IBelong } from '@/ts/core';
import { ActionType, ProTable } from '@ant-design/pro-components';
import { Button, Form, Input, Modal, Space, message } from 'antd';
import React, { useRef, useState } from 'react';

interface IProps {
  space: IBelong;
  finished: () => void;
}

export const CollectionForm: React.FC<IProps> = (props) => {
  const [form] = Form.useForm();
  return (
    <Modal
      open
      title={'创建集合'}
      onOk={async () => {
        const value = await form.validateFields();
        try {
          await props.space.activated?.dataManager.createColl(value);
          props.finished();
        } catch (error) {
          message.error((error as Error).message);
        }
      }}
      onCancel={props.finished}>
      <Form form={form} preserve>
        <Form.Item
          label="集合名称（前缀 formdata-）"
          name="id"
          rules={[{ required: true, message: '集合代码为必填项!' }]}>
          <Input />
        </Form.Item>
        <Form.Item
          label="集合别名"
          name="alias"
          rules={[{ required: true, message: '集合名称为必填项!' }]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

interface TableProps {
  space: IBelong;
  finished: (coll?: schema.XDefinedColl[]) => void;
  multiple?: boolean;
}

export const CollectionTable: React.FC<TableProps> = (props) => {
  const [selected, setSelected] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<schema.XDefinedColl[]>([]);
  const [center, setCenter] = useState(<></>);
  const actionRef = useRef<ActionType>();
  return (
    <>
      <Modal
        open
        title={'集合管理'}
        width={1024}
        onOk={() => {
          props.finished(selectedRows);
        }}
        onCancel={() => props.finished()}>
        <Space>
          <Button
            onClick={() => {
              setCenter(
                <CollectionForm
                  space={props.space}
                  finished={() => {
                    actionRef.current?.reloadAndRest?.();
                    setCenter(<></>);
                  }}
                />,
              );
            }}>
            创建集合
          </Button>
        </Space>
        <ProTable<schema.XDefinedColl>
          rowKey="id"
          size="small"
          actionRef={actionRef}
          style={{ marginTop: 8 }}
          search={false}
          options={false}
          rowSelection={{
            selectedRowKeys: selected,
            onChange: (selected, rows) => {
              setSelected(selected);
              setSelectedRows(rows);
            },
            type: props.multiple ? 'checkbox' : 'radio',
          }}
          columns={[
            {
              title: '集合名称',
              dataIndex: 'id',
            },
            {
              title: '集合别名',
              dataIndex: 'alias',
            },
            {
              title: '操作',
              dataIndex: 'action',
              render: (_, record) => {
                return (
                  <a
                    onClick={async () => {
                      await props.space.activated?.dataManager.removeColl(record);
                      actionRef.current?.reloadAndRest?.();
                    }}>
                    删除
                  </a>
                );
              },
            },
          ]}
          pagination={{ pageSize: 10 }}
          request={async (params) => {
            const take = params.pageSize ?? 10;
            const skip = ((params.current ?? 1) - 1) * take;
            const result = await props.space.activated?.dataManager.loadDefinedColl({
              take,
              skip,
            });
            return {
              data: result?.data ?? [],
              success: result?.success,
              total: result?.totalCount ?? 0,
            };
          }}
        />
      </Modal>
      {center}
    </>
  );
};

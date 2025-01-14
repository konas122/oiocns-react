import { XValidation } from '@/ts/base/schema';
import { ProColumns } from '@ant-design/pro-components';
import React, { useEffect } from 'react';
import { Tag, Form, Input, Button, Divider, Space } from 'antd';
import FullScreenModal from '../fullScreen';
import CardOrTable from '@/components/CardOrTableComp';
import message from '@/utils/message';
import SelectFilesItem from '@/components/DataStandard/WorkForm/Viewer/customItem/fileItem';

interface Props {
  data: XValidation[];
  onFinish?: (data: XValidation[]) => Promise<boolean>;
  onCancel?: () => void;
  allowEdit?: boolean;
}

export function ValidationModal(props: Props) {
  const [isEdit, setIsEdit] = React.useState(false);
  const [row, setRow] = React.useState<XValidation>(props.data[0]);
  const [files, setFiles] = React.useState('');

  const columns: ProColumns<XValidation>[] = [
    { title: '序号', valueType: 'index', width: 50 },
    {
      title: '错误标识',
      dataIndex: 'errorLevel',
      width: 50,
      render: (_: any, record: XValidation) => {
        return (
          <Tag color={record.errorLevel}>
            {record.errorLevel == 'warning'
              ? '警告'
              : record.errorLevel == 'error'
              ? '错误'
              : '提醒'}
          </Tag>
        );
      },
    },
    { title: '信息', dataIndex: 'message', width: 50 },
    { title: '位置', dataIndex: 'position', width: 50 },
    { title: '说明', dataIndex: 'reason', width: 80 },
    { title: '错误编码', dataIndex: 'errorCode', width: 80 },
    {
      title: '附件',
      dataIndex: 'files',
      width: 110,
      render: (_: any, record: XValidation) => {
        return props.allowEdit 
        ? <span>共有 {record.files?.length} 说明文件</span> 
        : <SelectFilesItem
            value={JSON.stringify(record.files)}
            height={36}
            readOnly={true}
          />
      },
    },
  ];

  // 操作内容渲染函数
  const renderOperate = (item: XValidation) => {
    return [
      {
        key: item.errorCode,
        label: `填写`,
        onClick: () => {
          setRow(item);
          setFiles(JSON.stringify(item.files));
          setIsEdit(true);
          form.setFieldsValue(item);
        },
      },
    ];
  };
  const [form] = Form.useForm();

  const onSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        form.resetFields();
        Object.assign(row, values);
        setIsEdit(false);
        message.info('填写成功');
      })
      .catch((_) => {});
  };

  const FormRender = () => {
    return isEdit ? (
      <FullScreenModal
        open
        centered
        width={'50vw'}
        bodyHeight={'25vh'}
        destroyOnClose
        title="填写说明"
        onCancel={() => setIsEdit(false)}>
        <Form
          form={form}
          name="form_in_modal"
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 20 }}
          initialValues={row}>
          <Form.Item
            label="说明"
            name="reason"
            rules={[{ required: true, message: '请填写说明' }]}>
            <Input />
          </Form.Item>

          <Form.Item label="说明文件">
            <SelectFilesItem
              value={files}
              height={36}
              onValueChanged={(v: any) => {
                console.log(v, 'file');
                row.files = JSON.parse(v.value);
              }}
            />
          </Form.Item>
        </Form>
        <Space>
          <Button type="primary" onClick={onSubmit}>
            确认
          </Button>
        </Space>
      </FullScreenModal>
    ) : (
      <></>
    );
  };

  return (
    <FullScreenModal
      open
      centered
      width={'60vw'}
      bodyHeight={'80vh'}
      destroyOnClose
      title="校验说明"
      onCancel={props.onCancel}>
      <CardOrTable<XValidation>
        rowKey="errorCode"
        dataSource={props.data}
        hideOperation={!props.allowEdit}
        operation={renderOperate}
        columns={columns}
      />
      {FormRender()}
    </FullScreenModal>
  );
}

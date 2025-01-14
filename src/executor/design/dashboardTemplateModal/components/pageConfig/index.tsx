import SchemaForm from '@/components/SchemaForm';
import UploadItem from '@/executor/tools/uploadItem';
import { schema } from '@/ts/base';
import { IDirectory } from '@/ts/core';
import { ProFormColumnsType } from '@ant-design/pro-components';
import { ProFormInstance } from '@ant-design/pro-form';
import { Input, Select } from 'antd';
import React, { useRef } from 'react';
const { Option } = Select;
interface Iprops {
  current: any,
  pageConfig: any,
  onUpdateConfig: (values: any) => void,
  finished: () => void
}

/**
 * 数据看板页面配置
 * @param props 
 * @returns 
 */
const DashboardPageConfig: React.FC<Iprops> = ({ current, pageConfig, onUpdateConfig, finished }) => {
  let initialValue: any = (typeof pageConfig === "object" && Object.keys(pageConfig).length > 0) ? pageConfig : {
    name: current.metadata?.name,
    widthUnit: '%',
    heightUnit: '%',
    bgColor: '#F8F8F8'
  };
  const formRef = useRef<ProFormInstance>();
  const columns: ProFormColumnsType<schema.XForm>[] = [
    {
      title: '背景图片',
      dataIndex: 'bgImg',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <UploadItem
            readonly={false}
            typeName={`模块`}
            tips="背景图片"
            icon={initialValue.bgImg}
            onChanged={(values: any) => {
              form.setFieldValue('bgImg', values);
            }}
            directory={current?.directory as IDirectory}
          />
        );
      },
    },
    {
      title: '页面名称',
      dataIndex: 'name',
      readonly: false,
      formItemProps: {
        rules: [{ required: true, message: '名称为必填项' }],
      },
    },
    {
      title: '宽度',
      dataIndex: 'widthValue',
      colProps: { span: 12 },
      renderFormItem: (_, __, form) => {
        return (
          <Input.Group compact>
            <Input
              defaultValue={initialValue?.widthValue}
              style={{ width: '60%' }}
              placeholder="请输入数值"
              onInput={(event: any) => {
                form.setFieldValue('widthValue', event.target.value);
              }}
            />
            <Select
              defaultValue={initialValue?.widthUnit}
              style={{ width: '40%' }}
              onChange={(value: any) => {
                initialValue['widthUnit'] = value;
              }}
            >
              <Option value="%">百分比</Option>
              <Option value="px">绝对值</Option>
            </Select>
          </Input.Group>
        );
      },
    },
    {
      title: '高度',
      dataIndex: 'heightValue',
      colProps: { span: 12 },
      renderFormItem: (_, __, form) => {
        return (
          <Input.Group compact>
            <Input defaultValue={initialValue?.heightValue} style={{ width: '60%' }} placeholder="请输入数值"
              onInput={(event: any) => {
                form.setFieldValue('heightValue', event.target.value);
              }} />
            <Select defaultValue={initialValue?.heightUnit} style={{ width: '40%' }}
              onChange={(value: any) => {
                initialValue['heightUnit'] = value;
              }}
            >
              <Option value="%">百分比</Option>
              <Option value="px">绝对值</Option>
            </Select>
          </Input.Group>
        );
      },
    },
    {
      title: '背景颜色',
      dataIndex: 'bgColor',
      colProps: { span: 12 },
      valueType: "color"
    }
  ];
  return (
    <>
      <SchemaForm<schema.XForm>
        formRef={formRef}
        open
        title={'页面配置'}
        width={640}
        columns={columns}
        initialValues={initialValue}
        rowProps={{
          gutter: [24, 0],
        }}
        layoutType="ModalForm"
        onOpenChange={(open: boolean) => {
          if (!open) {
            finished && finished();
          }
        }}
        onFinish={async (values) => {
          const newValues = Object.assign(initialValue, values);
          onUpdateConfig && onUpdateConfig(newValues);
          finished && finished();
        }}></SchemaForm>
    </>
  );
};

export default DashboardPageConfig;

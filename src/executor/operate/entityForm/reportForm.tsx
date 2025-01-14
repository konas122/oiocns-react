import SchemaForm from '@/components/SchemaForm';
import { schema } from '@/ts/base';
import { IBelong, IDirectory, IApplication, IReport } from '@/ts/core';
import { ProFormColumnsType } from '@ant-design/pro-components';
import { Input } from 'antd';
import React, { useState, useRef } from 'react';
import UploadItem from '../../tools/uploadItem';
import { CollectionTable } from './collectionForm';
import { EntityColumns } from './entityColumns';
import { ProFormInstance } from '@ant-design/pro-form';
import { generateCodeByInitials } from '@/utils/tools';

interface Iprops {
  formType: string;
  typeName: string;
  current: IDirectory | IReport;
  finished: () => void;
}

/*
  编辑
*/
const ReportForm = (props: Iprops) => {
  let title = '';
  let space: IBelong;
  let directory: IDirectory;
  let form: IReport | undefined;
  if (props.formType == 'new') {
    space = (props.current as IDirectory).target.space;
  } else {
    space = (props.current as IReport).directory.target.space;
  }
  const [center, setCenter] = useState(<></>);
  const readonly = props.formType === 'remark';
  let initialValue: any = props.current.metadata;
  var applicationId: string | undefined = undefined;
  const formRef = useRef<ProFormInstance>();

  switch (props.formType) {
    case 'new':
      title = '新建' + props.typeName;
      initialValue = {};
      if ('works' in props.current) {
        directory = (props.current as unknown as IApplication).directory;
        applicationId = props.current.id;
      } else {
        directory = props.current as IDirectory;
      }
      break;
    case 'update':
      form = props.current as IReport;
      directory = form.directory;
      title = '更新' + props.typeName;
      break;
    case 'remark':
      form = props.current as IReport;
      directory = form.directory;
      title = '查看' + props.typeName;
      break;
    default:
      return <></>;
  }
  const columns: ProFormColumnsType<schema.XReport>[] = [
    {
      title: '图标',
      dataIndex: 'icon',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <UploadItem
            readonly={readonly}
            typeName={props.typeName}
            icon={initialValue.icon}
            onChanged={(icon) => {
              form.setFieldValue('icon', icon);
            }}
            directory={directory as IDirectory}
          />
        );
      },
    },
    {
      title: '名称',
      dataIndex: 'name',
      readonly: readonly,
      formItemProps: {
        rules: [{ required: true, message: '分类名称为必填项' }],
      },
    },
    {
      title: '代码',
      dataIndex: 'code',
      readonly: readonly,
      formItemProps: {
        rules: [{ required: true, message: '分类代码为必填项' }],
      },
    },
    {
      title: '类型',
      dataIndex: 'typeName',
      valueType: 'select',
      initialValue: '表格',
      readonly: true,
      formItemProps: {
        rules: [{ required: true, message: '类型为必填项' }],
      },
    },
    {
      title: '存储位置',
      dataIndex: 'collName',
      renderFormItem: (_, __, form) => {
        const value = form.getFieldValue('collName');
        if (props.formType !== 'new') {
          return value ?? '_system-things（默认）';
        }
        return (
          <Input
            allowClear
            onClick={() => {
              setCenter(
                <CollectionTable
                  space={space}
                  finished={(collections) => {
                    if (collections && collections.length == 1) {
                      form.setFieldValue('collName', collections[0].id);
                    }
                    setCenter(<></>);
                  }}
                />,
              );
            }}
            value={value}
          />
        );
      },
    },
  ];
  if (readonly) {
    columns.push(...EntityColumns(props.current!.metadata));
  }
  columns.push({
    title: '备注信息',
    dataIndex: 'remark',
    valueType: 'textarea',
    colProps: { span: 24 },
    readonly: readonly,
    formItemProps: {
      rules: [{ required: true, message: '备注信息为必填项' }],
    },
  });
  return (
    <>
      <SchemaForm<schema.XReport>
        formRef={formRef}
        open
        title={title}
        width={640}
        columns={columns}
        initialValues={initialValue}
        rowProps={{
          gutter: [24, 0],
        }}
        layoutType="ModalForm"
        onOpenChange={(open: boolean) => {
          if (!open) {
            props.finished();
          }
        }}
        onValuesChange={async (values: any) => {
          if (Object.keys(values)[0] === 'name') {
            formRef.current?.setFieldValue(
              'code',
              generateCodeByInitials(values['name']),
            );
          }
        }}
        onFinish={async (values) => {
          switch (props.formType) {
            case 'update':
              await form!.update(values);
              break;
            case 'new':
              if ('standard' in directory) {
                await directory.standard.createReport({
                  ...values,
                  applicationId: applicationId,
                });
              }
              break;
          }
          props.finished();
        }}></SchemaForm>
      {center}
    </>
  );
};

export default ReportForm;

import SchemaForm from '@/components/SchemaForm';
import { schema } from '@/ts/base';
import { IApplication, IBelong, IDirectory, IView } from '@/ts/core';
import { ProFormColumnsType } from '@ant-design/pro-components';
import { Input } from 'antd';
import React, { useState, useRef } from 'react';
import UploadItem from '../../tools/uploadItem';
import { CollectionTable } from './collectionForm';
import { EntityColumns } from './entityColumns';
import { ProFormInstance } from '@ant-design/pro-form';
import { generateCodeByInitials } from '@/utils/tools';
import { ViewTypes } from '@/ts/core/public/consts';
interface Iprops {
  formType: string;
  typeName: string;
  current: IDirectory | IView;
  finished: () => void;
}

/*
  编辑
*/
const LabelsForm = (props: Iprops) => {
  let title = '';
  let space: IBelong;
  let directory: IDirectory;
  let form: IView | undefined;
  if (props.formType == 'new') {
    space = (props.current as IDirectory).target.space;
  } else {
    space = (props.current as IView).directory.target.space;
  }
  const [center, setCenter] = useState(<></>);
  const readonly = props.formType === 'remark';
  let initialValue: any = props.current.metadata;
  var applicationId: string | undefined = undefined;
  const formRef = useRef<ProFormInstance>();
  switch (props.formType) {
    case 'new':
      title = '新建' + props.typeName;
      initialValue = {
        typeName: '视图',
      };
      if ('works' in props.current) {
        directory = (props.current as unknown as IApplication).directory;
        applicationId = props.current.id;
      } else {
        directory = props.current as IDirectory;
      }
      break;
    case 'update':
      form = props.current as IView;
      directory = form.directory;
      title = '更新' + props.typeName;
      break;
    case 'remark':
      form = props.current as IView;
      directory = form.directory;
      title = '查看' + props.typeName;
      break;
    default:
      return <></>;
  }
  const columns: ProFormColumnsType<schema.XView>[] = [
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
      readonly: true,
      fieldProps: {
        options: ['视图'].map((i) => {
          return {
            value: i,
            label: i,
          };
        }),
      },
    },
    {
      title: '二级类型',
      dataIndex: 'subTypeName',
      valueType: 'select',
      initialValue: '表单',
      readonly: readonly,
      fieldProps: {
        options: ViewTypes.map((i) => {
          return {
            value: i,
            label: i,
          };
        }),
      },
      formItemProps: {
        rules: [{ required: true, message: '二级类型为必填项' }],
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
      rules: [{ required: false, message: '备注信息为必填项' }],
    },
  });
  return (
    <>
      <SchemaForm<schema.XView>
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
                await directory.standard.createView({
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

export default LabelsForm;

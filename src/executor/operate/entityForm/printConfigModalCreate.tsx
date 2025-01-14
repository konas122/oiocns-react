import SchemaForm from '@/components/SchemaForm';
import { schema } from '@/ts/base';
import { IDirectory, IApplication, IPrint } from '@/ts/core';
import { ProFormColumnsType } from '@ant-design/pro-components';
import React, { useRef } from 'react';
import UploadItem from '../../tools/uploadItem';
import { ProFormInstance } from '@ant-design/pro-form';
interface Iprops {
  formType: string;
  typeName: string;
  current: IDirectory | IPrint;
  finished: () => void;
}

/*
  编辑
*/
const PrintConfigModalCreate = (props: Iprops) => {
  let title = '';
  let directory: IDirectory;
  var applicationId: string | undefined = undefined;
  let print: IPrint | undefined;
  let initialValue: any = props.current.metadata;
  const formRef = useRef<ProFormInstance>();
  switch (props.formType) {
    case 'newPrint':
      title = '新建' + props.typeName;
      initialValue = {};
      directory = (props.current as unknown as IApplication).directory;
      applicationId = props.current.id;
      break;
    case 'updatePrint':
      print = props.current as IPrint;
      directory = print.directory;
      title = '更新' + props.typeName;
      break;
    default:
      return <></>;
  }
  const columns: ProFormColumnsType<schema.XPrint>[] = [
    {
      title: '图标',
      dataIndex: 'icon',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <UploadItem
            readonly={false}
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
      title: '模板名称',
      dataIndex: 'name',
      readonly: false,
      formItemProps: {
        rules: [{ required: true, message: '模板名称为必填项' }],
      },
    },
    {
      title: '备注信息',
      dataIndex: 'remark',
      valueType: 'textarea',
      colProps: { span: 24 },
      readonly: false,
      formItemProps: {
        rules: [{ required: true, message: '备注信息为必填项' }],
      },
    },
  ];
  return (
    <>
      <SchemaForm<schema.XPrint>
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
        onFinish={async (values) => {
          switch (props.formType) {
            case 'updatePrint':
              values = Object.assign(values, {
                typeName: '打印模板',
                code: values.name,
              });
              await print!.update(values);
              break;
            case 'newPrint':
              values = Object.assign(values, {
                typeName: '打印模板',
                table: [],
                code: values.name,
              });
              await directory.standard.createPrint({
                ...values,
                applicationId: applicationId,
              });
              break;
          }
          props.finished();
        }}></SchemaForm>
    </>
  );
};

export default PrintConfigModalCreate;

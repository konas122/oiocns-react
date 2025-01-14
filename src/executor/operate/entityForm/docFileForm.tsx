import SchemaForm from '@/components/SchemaForm';
import { schema } from '@/ts/base';
import { IDirectory } from '@/ts/core';
import { ProFormColumnsType } from '@ant-design/pro-components';
import React, { useRef } from 'react';
import { ProFormInstance } from '@ant-design/pro-form';
interface Iprops {
  formType: string;
  current: IDirectory;
  finished: () => void;
}

/*
  编辑
*/
const DocFileForm = (props: Iprops) => {
  let title = '新增文件';
  let initialValue: any = {};
  const formRef = useRef<ProFormInstance>();
  const columns: ProFormColumnsType<schema.XStandard>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      readonly: false,
      formItemProps: {
        rules: [{ required: true, message: '名称为必填项' }],
      },
    },
    {
      title: '类型',
      dataIndex: 'typeName',
      valueType: 'select',
      initialValue: 'md',
      fieldProps: {
        options: [
          {
            value: 'md',
            label: 'MarkDown文件',
          },
        ],
      },
      formItemProps: {
        rules: [{ required: true, message: '文档类型为必填项' }],
      },
    },
  ];
  return (
    <SchemaForm<schema.XStandard>
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
        const file = new Blob(['\n'], { type: 'text/markdown' });
        await props.current.createFile(values.name + '.md', file);
        props.finished();
      }}
    />
  );
};

export default DocFileForm;

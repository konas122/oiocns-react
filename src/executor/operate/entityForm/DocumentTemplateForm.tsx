import SchemaForm from '@/components/SchemaForm';
import staticContext from '@/components/PageElement';
import { schema } from '@/ts/base';
import { XDocumentTemplate } from '@/ts/base/schema';
import type { IDirectory } from '@/ts/core';
import { ProFormColumnsType } from '@ant-design/pro-components';
import React from 'react';
import UploadItem from '../../tools/uploadItem';
import { EntityColumns } from './entityColumns';
import { IDocumentTemplate } from '@/ts/core/thing/standard/document';
import ElementTreeManager from '@/ts/element/ElementTreeManager';
import ElementFactory from '@/ts/element/ElementFactory';

interface Iprops {
  formType: string;
  current: IDirectory | IDocumentTemplate;
  finished: () => void;
}

const getMeta = (kind: string) => {
  for (const item of Object.entries(staticContext.components)) {
    if (item[0] == kind) {
      return item[1].meta;
    }
  }
  return;
};

/*
  编辑
*/
const DocumentTemplateForm = (props: Iprops) => {
  let title = '';
  let directory: IDirectory;
  let tree: IDocumentTemplate | undefined;
  const readonly = props.formType === 'remark';
  let initialValue: Partial<XDocumentTemplate> = props.current.metadata as any;
  switch (props.formType) {
    case 'newDocumentTemplate':
      title = '新建文档模板';
      initialValue = {};
      directory = props.current as IDirectory;
      break;
    case 'updateDocumentTemplate':
      title = '更新文档模板';
      tree = props.current as IDocumentTemplate;
      directory = props.current.directory;
      break;
    default:
      return <></>;
  }
  const columns: ProFormColumnsType<XDocumentTemplate>[] = [
    {
      title: '图标',
      dataIndex: 'icon',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <UploadItem
            readonly={readonly}
            typeName={'文档模板'}
            icon={initialValue.icon}
            onChanged={(icon) => {
              form.setFieldValue('icon', icon);
            }}
            directory={directory}
          />
        );
      },
    },
    {
      title: '名称',
      dataIndex: 'name',
      readonly: readonly,
      formItemProps: {
        rules: [{ required: true, message: '模板名称为必填项' }],
      },
    },
    {
      title: '代码',
      dataIndex: 'code',
      readonly: readonly,
      formItemProps: {
        rules: [{ required: true, message: '模板代码为必填项' }],
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
    <SchemaForm<schema.XDocumentTemplate>
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
        values = Object.assign({}, initialValue, values);
        values.typeName = '文档模板';
        switch (props.formType) {
          case 'updateDocumentTemplate':
            await tree!.update(values);
            break;
          case 'newDocumentTemplate':
            values.rootElement = ElementTreeManager.createRoot();
            const type = 'Paper';
            const meta = getMeta(type);
            if (meta) {
              values.rootElement.children.push(
                new ElementFactory(staticContext.metas).create(
                  type,
                  meta.label,
                ),
              );
            }
            await directory.standard.createDocumentTemplate(values);
            break;
        }
        props.finished();
      }}
    />
  );
};

export default DocumentTemplateForm;

import SchemaForm from '@/components/SchemaForm';
import { schema } from '@/ts/base';
import { XReportTree } from '@/ts/base/schema';
import type { IDirectory, ITarget } from '@/ts/core';
import { IReportTree } from '@/ts/core/thing/standard/reporttree';
import { ReportTree } from '@/ts/core/thing/standard/reporttree/ReportTree';
import { treeTypeNames } from '@/ts/core/thing/standard/reporttree/consts';
import { ProFormColumnsType } from '@ant-design/pro-components';
import React from 'react';
import UploadItem from '../../tools/uploadItem';
import { EntityColumns } from './entityColumns';
import { message } from 'antd';

interface Iprops {
  formType: string;
  current: IDirectory | IReportTree | ITarget;
  finished: () => void;
}
/*
  编辑
*/
const ReportTreeForm = (props: Iprops) => {
  let title = '';
  let directory: IDirectory;
  let tree: IReportTree | undefined;
  const readonly = props.formType === 'remark';
  let initialValue: Partial<XReportTree> = props.current.metadata as any;
  switch (props.formType) {
    case 'newReportTree':
      title = '新建报表树';
      initialValue = {};
      directory = props.current as IDirectory;
      break;
    case 'generateReportTree':
      title = '生成报表树';
      {
        let target = props.current as ITarget;
        initialValue = {
          code: target.code,
          name: target.name + '报表树',
          remark: `组织 [${target.name}] 生成的报表树`,
        };
        directory = target.directory;
      }
      break;
    case 'updateReportTree':
      title = '更新报表树';
      tree = props.current as IReportTree;
      directory = props.current.directory;
      break;
    default:
      return <></>;
  }
  const columns: ProFormColumnsType<schema.XReportTree>[] = [
    {
      title: '图标',
      dataIndex: 'icon',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <UploadItem
            readonly={readonly}
            typeName={'报表树'}
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
        rules: [{ required: true, message: '报表树名称为必填项' }],
      },
    },
    {
      title: '代码',
      dataIndex: 'code',
      readonly: readonly,
      formItemProps: {
        rules: [{ required: true, message: '报表树代码为必填项' }],
      },
    },
    {
      title: '树类型',
      dataIndex: 'treeType',
      valueType: 'select',
      fieldProps: {
        options: Object.entries(treeTypeNames).map(([value, label]) => ({
          value: parseInt(value),
          label,
        })),
      },
      formItemProps: {
        rules: [{ required: true, message: '树类型为必填项' }],
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
    <SchemaForm<schema.XReportTree>
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
        values.typeName = '报表树';
        switch (props.formType) {
          case 'updateReportTree':
            await tree!.update(values);
            break;
          case 'newReportTree':
            await directory.standard.createReportTree(values);
            break;
          case 'generateReportTree': {
            const result = await directory.standard.createReportTree(values);
            if (result) {
              const reportTree = new ReportTree(result, directory);
              await reportTree.generateNodes(props.current as ITarget);
              message.success('生成成功');
            }
            break;
          }
        }
        props.finished();
      }}
    />
  );
};

export default ReportTreeForm;

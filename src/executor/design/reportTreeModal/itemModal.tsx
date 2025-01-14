import React from 'react';
import { ProFormColumnsType } from '@ant-design/pro-components';
import SchemaForm from '@/components/SchemaForm';
import { schema } from '@/ts/base';
import UploadItem from '../../tools/uploadItem';
import type { IReportTree } from '@/ts/core/thing/standard/reporttree';
import { allNodeTypes } from '@/ts/core/thing/standard/reporttree/consts';

interface Iprops {
  open: boolean;
  typeName: string;
  operateType: string;
  data?: schema.XReportTreeNode;
  handleCancel: () => void;
  handleOk: (success: boolean) => void;
  current: IReportTree;
}
/*
  字典子项编辑模态框
*/
const ReportTreeNodeModal = ({
  open,
  typeName,
  operateType,
  handleOk,
  current,
  data,
  handleCancel,
}: Iprops) => {
  const title =
    operateType == 'add'
      ? data
        ? `新增[${data.name}]的子${typeName}节点`
        : `新增${typeName}节点`
      : `编辑[${data?.name}]${typeName}节点`;
  const initialValue = operateType === 'edit' ? data : {};
  const columns: ProFormColumnsType<schema.XReportTreeNode>[] = [
    {
      title: '图标',
      dataIndex: 'icon',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <UploadItem
            typeName={typeName}
            icon={data?.icon || ''}
            onChanged={(icon) => {
              form.setFieldValue('icon', icon);
            }}
            directory={current.directory}
          />
        );
      },
    },
    {
      title: '名称',
      dataIndex: 'name',
      formItemProps: {
        rules: [{ required: true, message: typeName + '节点名称为必填项' }],
      },
    },
    {
      title: '代码',
      dataIndex: 'code',
      formItemProps: {
        rules: [{ required: true, message: '报表树节点代码为必填项' }],
      },
    },
    {
      title: '节点类型',
      dataIndex: 'nodeTypeName',
      valueType: 'select',
      fieldProps: {
        options: allNodeTypes.map((value) => ({
          value,
          label: value,
        })),
      },
      formItemProps: {
        rules: [{ required: true, message: '节点类型为必填项' }],
      },
    },
    {
      title: '上级节点',
      dataIndex: 'parentId', // 设置为父节点 ID
      valueType: 'treeSelect', // 使用 TreeSelect 类型
      fieldProps: {
        treeDefaultExpandAll: true, // 默认展开树节点
        treeData: current.nodes.map((node) => ({
          title: node.name,
          value: node.id,
          key: node.id,
          children: [],
        })),
        placeholder: '请选择上级节点', // 提示文本
      },
      formItemProps: {
        rules: [{ required: true, message: '上级节点为必填项' }],
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      valueType: 'textarea',
      colProps: { span: 24 },
    },
  ];

  return (
    <SchemaForm<schema.XReportTreeNode>
      title={title}
      open={open}
      width={640}
      columns={columns}
      layoutType="ModalForm"
      initialValues={initialValue}
      onOpenChange={(open: boolean) => {
        if (!open) {
          handleCancel();
        }
      }}
      rowProps={{
        gutter: [24, 0],
      }}
      onFinish={async (values) => {
        if (operateType == 'edit') {
          handleOk(await current.updateNode(data!, { ...data, ...values }));
        } else {
          if (data) {
            values.parentId = data.id;
          }
          handleOk((await current.createNode(values)) != undefined);
        }
      }}
    />
  );
};

export default ReportTreeNodeModal;

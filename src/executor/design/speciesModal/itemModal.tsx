import React, { useMemo } from 'react';
import { ProFormColumnsType } from '@ant-design/pro-components';
import SchemaForm from '@/components/SchemaForm';
import { schema } from '@/ts/base';
import { ISpecies } from '@/ts/core';
import UploadItem from '../../tools/uploadItem';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import useAsyncLoad from '@/hooks/useAsyncLoad';

interface Iprops {
  open: boolean;
  typeName: string;
  operateType: string;
  data?: schema.XSpeciesItem;
  handleCancel: () => void;
  handleOk: (success: boolean) => void;
  current: ISpecies;
}
/*
  字典子项编辑模态框
*/
const SpeciesItemModal = ({
  open,
  typeName,
  operateType,
  handleOk,
  current,
  data,
  handleCancel,
}: Iprops) => {
  const isTargetSpecies = useMemo(() => {
    return !!current.metadata.generateTargetId;
  }, [current.metadata]);
  const title =
    operateType == '新增'
      ? data
        ? `新增[${data.name}]的子${typeName}项`
        : `新增${typeName}项`
      : `编辑[${data?.name}]${typeName}项`;
  const initialValue = operateType === '编辑' ? data : {};
  const [, membersData] = useAsyncLoad(async () => {
    const data = await current.target.loadMembers();
    return data.map((item) => {
      return {
        label: <EntityIcon entityId={item.id} showName size={20} />,
        value: item.id,
      };
    });
  });

  let columns: ProFormColumnsType<schema.XSpeciesItem>[] = [
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
        rules: [{ required: true, message: typeName + '项名称为必填项' }],
      },
    },
    {
      title: typeName !== '人员分类' ? ' 编号' : '手机号',
      dataIndex: 'code',
      formItemProps: {
        rules: [
          { required: true, message: typeName + '项编号为必填项' },
          {
            validator: (_, value) =>
              current.items.filter((a) => a.code === value).length &&
              operateType !== '编辑'
                ? Promise.reject(
                    new Error(`已存在这个${typeName !== '人员分类' ? ' 编号' : '手机号'}`),
                  )
                : Promise.resolve(),
          },
        ],
      },
    },
  ];
  if (typeName !== '人员分类') {
    columns.push({
      title: '附加信息',
      dataIndex: 'info',
      formItemProps: {
        rules: [
          {
            required: isTargetSpecies ? operateType != '新增' : true,
            message: typeName + '项附加信息为必填项',
          },
        ],
      },
    });
  } else {
    columns = [
      ...columns,
      {
        title: '关联人员',
        dataIndex: 'relevanceId',
        valueType: 'select',
        colProps: { span: 12 },
        fieldProps: {
          showCheckedStrategy: 'SHOW_CHILD',
          options: membersData,
        },
      },
      {
        title: '关联部门编号',
        dataIndex: 'departmentCode',
      },
    ];
  }
  columns.push({
    title: '备注',
    dataIndex: 'remark',
    valueType: 'textarea',
    colProps: { span: 24 },
  });

  return (
    <SchemaForm<schema.XSpeciesItem>
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
        if (operateType == '编辑') {
          handleOk(await current.updateItem(data!, { ...data!, ...values }));
        } else {
          if (data) {
            values.parentId = data.id;
          }
          if (isTargetSpecies && !values.info) {
            // 给组织分类生成一个新的id
            values.info = 'snowId()';
            values.remark = (values.remark || '') + '[无实际关联组织]';
          }
          handleOk((await current.createItem(values)) != undefined);
        }
      }}
    />
  );
};

export default SpeciesItemModal;

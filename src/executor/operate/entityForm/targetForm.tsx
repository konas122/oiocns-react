import React, { useState } from 'react';
import { ProFormColumnsType } from '@ant-design/pro-components';
import SchemaForm from '@/components/SchemaForm';
import { kernel, model } from '@/ts/base';
import { TargetModel } from '@/ts/base/model';
import { ITarget, TargetType, departmentTypes } from '@/ts/core';
import UploadItem from '../../tools/uploadItem';
import UpdatePhone from '../../tools/updatePhone';
import { EntityColumns } from './entityColumns';
import { BathNewDepartment } from '@/executor/tools/uploadDepartments';
import { Button } from 'antd';

interface Iprops {
  formType: string;
  current: ITarget;
  finished: () => void;
}
/*
  编辑
*/
const TargetForm = (props: Iprops) => {
  let title = '';
  let typeName = '';
  let tcodeLabel = '代码';
  let types: string[] = [props.current.typeName];
  const readonly = props.formType === 'remark';
  let initialValue: any = props.current.metadata;
  const [formData, setFormData] = useState<model.LoginModel>({
    account: '',
  });

  switch (props.formType) {
    case 'newCohort':
      typeName = '群组';
      title = '设立群组';
      types = [TargetType.Cohort];
      initialValue = {};
      break;
    case 'newStorage':
      typeName = '存储资源';
      title = '设立存储资源';
      types = [TargetType.Storage];
      initialValue = {};
      break;
    case 'newStation':
      typeName = '岗位';
      title = '设立岗位';
      types = [TargetType.Station];
      initialValue = {};
      break;
    case 'newGroup':
      typeName = '组织群';
      title = '设立集群';
      types = [TargetType.Group];
      initialValue = {};
      break;
    case 'newCompany':
      typeName = '单位';
      title = '设立单位';
      types = [TargetType.Company];
      initialValue = {};
      tcodeLabel = '社会统一信用代码';
      break;
    case 'newDepartment':
      typeName = '部门';
      title = '设立部门';
      if ('childrenTypes' in props.current) {
        types = props.current.childrenTypes as string[];
      } else {
        types = [...departmentTypes];
      }
      initialValue = {};
      break;
    case 'update':
      typeName = props.current.typeName;
      title = '更新' + props.current.name;
      if (props.current.id === props.current.belongId) {
        if (typeName === '人员') {
          tcodeLabel = '手机号码';
        } else {
          tcodeLabel = '社会统一信用代码';
        }
      }
      break;
    case 'remark':
      typeName = props.current.typeName;
      title = '查看' + props.current.name;
      if (props.current.id === props.current.belongId) {
        if (typeName === '人员') {
          tcodeLabel = '手机号码';
        } else {
          tcodeLabel = '社会统一信用代码';
        }
      }
      break;
    default:
      return <></>;
  }
  const columns: ProFormColumnsType<TargetModel>[] = [
    {
      title: '图标',
      dataIndex: 'icon',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <UploadItem
            readonly={readonly}
            typeName={typeName}
            icon={initialValue.icon}
            onChanged={(icon) => {
              form.setFieldValue('icon', icon);
            }}
            directory={props.current.directory}
          />
        );
      },
    },
    {
      title: '名称',
      dataIndex: 'name',
      readonly: readonly,
      formItemProps: {
        rules: [
          { required: true, message: '分类名称为必填项' },
          {
            pattern: title === '设立单位' ? /^(?!\d{5,255}$)[\d\D]{5,255}$/ : undefined,
            message: '允许5-255个不能是纯数字的字符',
          },
        ],
      },
    },
    {
      title: '类型',
      dataIndex: 'typeName',
      valueType: 'select',
      initialValue: types[0],
      readonly: readonly,
      fieldProps: {
        options: types.map((i) => {
          return {
            value: i,
            label: i,
          };
        }),
      },
      formItemProps: {
        rules: [{ required: true, message: '类型为必填项' }],
      },
    },
  ];
  if (title === '设立部门') {
    columns.unshift({
      title: '',
      dataIndex: 'NewBathDepartment',
      colProps: { span: 24 },
      readonly: readonly,
      renderFormItem: () => {
        return (
          <Button onClick={() => BathNewDepartment(props.current as any)}>
            批量设立部门
          </Button>
        );
      },
    });
  }
  if (readonly) {
    columns.push(...EntityColumns(props.current.metadata));
  }
  if (tcodeLabel === '手机号码') {
    columns.push({
      title: tcodeLabel,
      dataIndex: 'code',
      readonly: readonly,
      formItemProps: {
        rules: [{ required: true, message: '手机号码为必填项' }],
      },
      renderFormItem: (_, __, form) => {
        return (
          <UpdatePhone
            title="修改手机号"
            value={form.getFieldValue('code')}
            readonly={true}
            onChanged={(value: model.LoginModel) => {
              form.setFieldValue('code', value.account);
              setFormData(value);
            }}
          />
        );
      },
    });
  } else {
    columns.push({
      title: tcodeLabel,
      dataIndex: 'code',
      readonly: readonly,
      formItemProps: {
        rules: [{ required: true, message: '分类代码为必填项' }],
      },
    });
  }
  if (
    ['newGroup'].includes(props.formType) ||
    ['组织群'].includes(props.current.typeName)
  ) {
    columns.push({
      title: '当前数据核',
      dataIndex: 'storeId',
      valueType: 'select',
      fieldProps: {
        options: props.current.space.storages.map((i) => {
          return {
            value: i.id,
            label: i.name,
          };
        }),
      },
    });
  }
  columns.push({
    title: '是否公开',
    dataIndex: 'public',
    valueType: 'switch',
  });
  columns.push({
    title: '简介',
    dataIndex: 'remark',
    valueType: 'textarea',
    colProps: { span: 24 },
    readonly: readonly,
    formItemProps: {
      rules: [{ required: true, message: '简介为必填项' }],
    },
  });
  return (
    <SchemaForm<TargetModel>
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
        var success = false;
        switch (props.formType) {
          case 'update': {
            values.teamName = values.name;
            values.teamCode = values.code;
            let data = { ...values, ...formData };
            success = await props.current.update(data);
            if (data.storeId && data.storeId !== props.current.metadata.storeId) {
              await kernel.activateStorage({ id: data.storeId, subId: props.current.id });
            }
            break;
          }
          default:
            success =
              props.formType.startsWith('new') &&
              (await props.current.createTarget({ ...values, ...formData })) != undefined;
            break;
        }
        success && props.finished();
      }}
    />
  );
};

export default TargetForm;

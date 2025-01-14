import SchemaForm from '@/components/SchemaForm';
import { schema } from '@/ts/base';
import { IBelong, IDirectory, IApplication, IForm, IAuthority } from '@/ts/core';
import { ProFormColumnsType } from '@ant-design/pro-components';
import { Input } from 'antd';
import React, { useState, useRef } from 'react';
import UploadItem from '../../tools/uploadItem';
import { CollectionTable } from './collectionForm';
import { EntityColumns } from './entityColumns';
import { ProFormInstance } from '@ant-design/pro-form';
import { generateCodeByInitials } from '@/utils/tools';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { DefaultOptionType } from 'antd/lib/select';
interface Iprops {
  formType: string;
  typeName: string;
  current: IDirectory | IForm;
  finished: () => void;
}

/*
  编辑
*/
const LabelsForm = (props: Iprops) => {
  let title = '';
  let space: IBelong;
  let directory: IDirectory;
  let form: IForm | undefined;
  if (props.formType == 'new') {
    space = (props.current as IDirectory).target.space;
  } else {
    space = (props.current as IForm).directory.target.space;
  }
  const [center, setCenter] = useState(<></>);
  const readonly = props.formType === 'remark';
  let initialValue: any = props.current.metadata;
  var applicationId: string | undefined = undefined;
  const formRef = useRef<ProFormInstance>();
  const [treeData, setTreeData] = useState<any[]>([]);
  const [applyAuths, setApplyAuths] = useState<any[]>([]);
  const [loaded] = useAsyncLoad(async () => {
    const getTreeData = (targets: IAuthority[]): DefaultOptionType[] => {
      return targets.map((item: IAuthority) => {
        return {
          label: item.name,
          value: item.id,
          children:
            item.children && item.children.length > 0 ? getTreeData(item.children) : [],
        };
      });
    };
    const getTreeValue = (applyAuth: string, auths: IAuthority[]): string[] => {
      const applyAuths: string[] = [];
      if (applyAuth == '0') {
        return ['0'];
      }
      for (const auth of auths) {
        if (auth.id == applyAuth) {
          return [auth.id];
        }
        const childAuth = getTreeValue(applyAuth, auth.children);
        if (childAuth.length > 0) {
          applyAuths.push(auth.id, ...childAuth);
        }
      }
      return applyAuths;
    };
    let tree = await props.current.directory.target.space.loadSuperAuth(false);
    if (tree) {
      setApplyAuths(getTreeValue(initialValue.applyAuth ?? '0', [tree]));
      setTreeData([
        ...[{ label: '全员', value: '0', children: [] }],
        ...getTreeData([tree]),
      ]);
    }
  });
  if (!loaded) return <></>;
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
      form = props.current as IForm;
      directory = form.directory;
      title = '更新' + props.typeName;
      break;
    case 'remark':
      form = props.current as IForm;
      directory = form.directory;
      title = '查看' + props.typeName;
      break;
    default:
      return <></>;
  }
  const columns: ProFormColumnsType<schema.XForm>[] = [
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
      initialValue: '表单',
      readonly: readonly,
      fieldProps: {
        options: ['表单', '报表'].map((i) => {
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
    {
      title: '设置权限',
      readonly: readonly,
      colProps: { span: 24 },
      dataIndex: 'applyAuths',
      valueType: 'cascader',
      initialValue: applyAuths,
      formItemProps: { rules: [{ required: true, message: '请选择发起权限' }] },
      fieldProps: {
        showCheckedStrategy: 'SHOW_CHILD',
        changeOnSelect: true,
        options: treeData,
        displayRender: (labels: string[]) => labels[labels.length - 1],
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
      <SchemaForm<schema.XForm>
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
                await directory.standard.createForm({
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

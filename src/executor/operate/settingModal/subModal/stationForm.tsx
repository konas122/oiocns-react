import React, { useRef } from 'react';
import { ProFormColumnsType, ProFormInstance } from '@ant-design/pro-components';
import SchemaForm from '@/components/SchemaForm';
import { IStation, ICompany } from '@/ts/core';
import { TargetModel } from '@/ts/base/model';
import UploadItem from '@/executor/tools/uploadItem';
import { generateCodeByInitials } from '@/utils/tools';

interface IProps {
  current: ICompany | IStation;
  finished: (success: boolean) => void;
}
/*
  编辑
*/
const IdentityForm: React.FC<IProps> = ({ current, finished }) => {
  const formRef = useRef<ProFormInstance>();
  const isEdit = !('groups' in current);
  const columns: ProFormColumnsType<TargetModel>[] = [
    {
      title: '图标',
      dataIndex: 'icon',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <UploadItem
            typeName={'岗位'}
            icon={isEdit ? current.metadata.icon : ''}
            onChanged={(icon) => {
              form.setFieldValue('icon', icon);
            }}
            directory={isEdit ? current.space.directory : current.directory}
          />
        );
      },
    },
    {
      title: '名称',
      dataIndex: 'name',
      formItemProps: {
        rules: [
          { required: true, message: '分类名称为必填项' },
          {
            pattern: /^(?!\d{5,255}$)[\d\D]{5,255}$/,
            message: '允许5-255个不能是纯数字的字符',
          },
        ],
      },
    },
    {
      title: '代码',
      dataIndex: 'code',
      formItemProps: {
        rules: [
          { required: true, message: '分类代码为必填项' },
          () => ({
            validator(_, value) {
              if (value && new RegExp(/^1[3-9]\d{9}$/).test(value)) {
                return Promise.resolve();
              } else if (
                value &&
                !new RegExp(/^(?!\d{5,255}$)[\w_]{5,255}$/).test(value)
              ) {
                return Promise.reject(
                  new Error(
                    `允许英文字母、数字、'_'等符号,长度5-255 除手机号之外不能纯数字`,
                  ),
                );
              }
              return Promise.resolve();
            },
          }),
        ],
      },
    },
    {
      title: '简称',
      dataIndex: 'teamName',
    },
    {
      title: '标识',
      dataIndex: 'teamCode',
    },
    {
      title: '岗位简介',
      dataIndex: 'remark',
      valueType: 'textarea',
      colProps: { span: 24 },
      formItemProps: {
        rules: [{ required: true, message: '岗位简介为必填项' }],
      },
    },
  ];
  return (
    <SchemaForm<TargetModel>
      formRef={formRef}
      open
      title={isEdit ? '编辑岗位' : '新建岗位'}
      width={640}
      columns={columns}
      initialValues={isEdit ? current.metadata : {}}
      rowProps={{
        gutter: [24, 0],
      }}
      layoutType="ModalForm"
      onOpenChange={(open: boolean) => {
        if (!open) {
          finished(false);
        }
      }}
      onValuesChange={async (values: any) => {
        if (Object.keys(values)[0] === 'name') {
          formRef.current?.setFieldValue('code', generateCodeByInitials(values['name']));
        }
      }}
      onFinish={async (values) => {
        if (isEdit) {
          await current.update(values);
        } else {
          await current.createStation(values);
        }
        finished(true);
      }}></SchemaForm>
  );
};

export default IdentityForm;

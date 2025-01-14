import React from 'react';
import { ProFormColumnsType } from '@ant-design/pro-components';
import SchemaForm from '@/components/SchemaForm';
import { IDirectory, IApplication } from '@/ts/core';
import UploadItem from '../../tools/uploadItem';
import { ISequence } from '@/ts/core';
import { EntityColumns } from './entityColumns';
import { schema } from '@/ts/base';
import { Form } from 'antd';
import { generateCodeByInitials } from '@/utils/tools';

interface Iprops {
  formType: string;
  typeName: string;
  current: ISequence | IApplication;
  finished: () => void;
}
/*
  编辑
*/
const SequenceForm = (props: Iprops) => {
  let title = '';
  let directory: IDirectory;
  let sequences: ISequence | undefined;
  const readonly = props.formType === 'remarkSequence';
  const { current } = props;
  const [form] = Form.useForm();

  let initialValue: any = props.current.metadata;
  const operate = props.formType.split('Sequence')[0];
  switch (operate) {
    case 'new':
      title = '新建' + props.typeName;
      initialValue = {};
      break;
    case 'update':
      sequences = props.current as ISequence;
      initialValue = { ...sequences?.metadata };
      title = '更新' + props.typeName;
      break;
    case 'remark':
      sequences = props.current as ISequence;
      title = '查看' + props.typeName;
      break;
    default:
      return <></>;
  }
  const columns: ProFormColumnsType<schema.XSequence>[] = [
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
            directory={directory}
          />
        );
      },
    },
    {
      title: '序列名',
      dataIndex: 'name',
      readonly: readonly,
      formItemProps: {
        rules: [{ required: true, message: '序列名为必填项' }],
      },
    },
    {
      title: '代码',
      dataIndex: 'code',
      readonly: readonly,
      formItemProps: {
        rules: [{ required: true, message: '序列代码为必填项' }],
      },
    },
    {
      title: '初始值',
      dataIndex: 'initValue',
      initialValue: 0,
      readonly: readonly,
      fieldProps: {
        type: 'number',
      },
      formItemProps: {
        rules: [{ required: true, message: '初始值为必填项' }],
      },
    },
    {
      title: '增量值',
      dataIndex: 'increament',
      initialValue: 1,
      readonly: readonly,
      fieldProps: {
        type: 'number',
      },
      formItemProps: {
        rules: [{ required: true, message: '增量值为必填项' }],
      },
    },
    {
      title: '长度',
      dataIndex: 'length',
      readonly: readonly,
      initialValue: 4,
      fieldProps: {
        type: 'number',
      },
      formItemProps: {
        rules: [{ required: true, message: '当设置循环时，循环选项为必填项！' }],
      },
    },
    {
      title: '最大值',
      dataIndex: 'maxNum',
      readonly: readonly,
      fieldProps: {
        type: 'number',
      },
      formItemProps: {
        rules: [
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (
                getFieldValue('sequenceValue') &&
                value < Number(getFieldValue('sequenceValue'))
              ) {
                return Promise.reject(new Error('最大值必须要大于初始值！'));
              }
              if (value && !new RegExp(/^[0-9]*$/).test(value)) {
                return Promise.reject(new Error('只能输入数字'));
              }
              return Promise.resolve();
            },
          }),
        ],
      },
    },
    {
      title: '循环选项',
      dataIndex: 'circleOpt',
      readonly: readonly,
      valueType: 'select',
      valueEnum: {
        time: '时间',
        number: '数值',
      },
      formItemProps: {
        rules: [{ required: true }],
      },
    },
    {
      valueType: 'dependency',
      name: ['circleOpt', 'isCircle'],
      columns: ({ circleOpt }) => {
        return circleOpt === 'time'
          ? [
              {
                title: '循环条件',
                readonly: readonly,
                dataIndex: 'conditionOpt',
                valueType: 'select',
                valueEnum: {
                  everyDay: '每天',
                  everyWeek: '每周',
                  everyMonth: '每月',
                  everyYear: '每年',
                  otherTime: '其他时间点',
                },
                formItemProps: {
                  preserve: false,
                  initialValue: '',
                  rules: [
                    { required: true, message: '当设置循环时，循环选项为必填项！' },
                  ],
                },
              },
            ]
          : circleOpt === 'number'
          ? [
              {
                title: '循环条件',
                dataIndex: 'conditionOpt',
                readonly: readonly,
                valueType: 'select',
                valueEnum: {
                  equal: '等于',
                  max: '大于',
                },
                formItemProps: {
                  preserve: false,
                  initialValue: '',
                  rules: [
                    {
                      required: true,
                      message: '循环条件为必填项！',
                    },
                  ],
                },
              },
              {
                title: '数值',
                dataIndex: 'conditionValue',
                readonly: readonly,
                formItemProps: {
                  preserve: false,
                  initialValue: '',
                  rules: [
                    {
                      required: true,
                      message: '数值为必填项！',
                    },
                    () => ({
                      validator(_, value) {
                        if (value && !new RegExp(/^[0-9]*$/).test(value)) {
                          return Promise.reject(new Error('只能输入数字'));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ],
                },
              },
            ]
          : [];
      },
    },
    {
      valueType: 'dependency',
      name: ['conditionOpt'],
      columns: ({ conditionOpt }) => {
        if (conditionOpt === 'otherTime') {
          return [
            {
              title: '时间',
              readonly: readonly,
              dataIndex: 'conditionValue',
              valueType: 'dateTime',
              formItemProps: {
                rules: [{ required: true, message: '时间为必填项！' }],
              },
            },
          ];
        }
        return [];
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
  const handleChange = (val: { [key: string]: any }, _vals: { [key: string]: any }) => {
    switch (Object.keys(val)[0]) {
      case 'isCircle': {
        form.setFieldsValue({
          conditionOpt: undefined,
          circleOpt: undefined,
          conditionValue: undefined,
        });
        break;
      }
      case 'circleOpt': {
        form.setFieldsValue({
          conditionOpt: undefined,
          conditionValue: undefined,
        });
        break;
      }
      case 'conditionOpt': {
        form.setFieldsValue({
          conditionValue: undefined,
          circleNum: undefined,
        });
        break;
      }
      case 'name':
        form.setFieldValue('code', generateCodeByInitials(val['name']));
        break;
      default:
        break;
    }
  };
  return (
    <>
      <SchemaForm<schema.XSequence>
        form={form}
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
        onValuesChange={handleChange}
        shouldUpdate={false}
        onFinish={async (values) => {
          switch (operate) {
            case 'update':
              await sequences!.update({
                ...values,
                value: values.initValue,
              });
              break;
            case 'new':
              await (current as IApplication).createSequence({
                ...values,
                value: values.initValue,
              });
              break;
          }
          props.finished();
        }}
      />
    </>
  );
};

export default SequenceForm;

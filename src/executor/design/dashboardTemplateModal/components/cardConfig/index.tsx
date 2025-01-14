import SchemaForm from '@/components/SchemaForm';
import UploadItem from '@/executor/tools/uploadItem';
import { schema } from '@/ts/base';
import { Input, Select } from 'antd';
import { IDirectory } from '@/ts/core';
import { ProFormColumnsType } from '@ant-design/pro-components';
import { ProFormInstance } from '@ant-design/pro-form';
import React, { useRef, useState } from 'react';
import _ from 'lodash';

const { Option } = Select;
interface Iprops {
  current: any;
  currentCard: any;
  finished: (values?: any) => void;
}

/**
 * 数据看板卡片配置
 * @param props
 * @returns
 */
const DashboardCardConfig: React.FC<Iprops> = ({ current, currentCard, finished }) => {
  const newCardConfig = _.cloneDeep(currentCard?.cardConfig);
  const [styleType, setStyleType] = useState(newCardConfig?.style || 'default');
  const formRef = useRef<ProFormInstance>();

  let initialValue = newCardConfig || {
    icon: undefined,
    bg: undefined,
    name: newCardConfig?.name,
    nameColor: undefined,
    indexName: undefined,
    indexNameColor: undefined,
    indexValueColor: undefined,
    indexValueUnitColor: undefined,
    style: 'default',
    size: 'large',
    widthValue: undefined,
    widthUnit: '%',
    heightValue: undefined,
    heightUnit: '%',
    cardBgColor: '#ffffff',
    chartTextColor:undefined
  };

  const columns: ProFormColumnsType<schema.XForm>[] = [
    {
      title: '卡片图标',
      dataIndex: 'icon',
      tooltip: '仅在卡片大小为大时显示',
      colProps: { span: 12 },
      renderFormItem: (_, __, form) => {
        return (
          <UploadItem
            readonly={false}
            typeName={`image/jpeg`}
            icon={initialValue.icon}
            onChanged={(values: any) => {
              form.setFieldValue('icon', values);
            }}
            directory={current?.directory as IDirectory}
          />
        );
      },
    },
    {
      title: '卡片背景',
      dataIndex: 'bg',
      colProps: { span: 12 },
      renderFormItem: (_, __, form) => {
        return (
          <UploadItem
            readonly={false}
            typeName={`image/jpeg`}
            icon={initialValue.bg}
            tips="背景"
            onChanged={(values: any) => {
              form.setFieldValue('bg', values);
            }}
            directory={current?.directory as IDirectory}
          />
        );
      },
    },
    {
      title: '卡片名称',
      dataIndex: 'nameGroup',
      colProps: { span: 12 },
      tooltip: '仅在卡片大小为大时显示',
      renderFormItem: (_, __, form) => (
        <Input.Group compact>
          <Input
            style={{ width: '60%' }}
            placeholder="卡片名称"
            defaultValue={initialValue.name}
            onInput={(event: any) => {
              initialValue.name = event.target.value;
            }}
          />
          <Input
            type="color"
            style={{ width: '40%' }}
            defaultValue={initialValue.nameColor || '#000000'}
            onInput={(event: any) => {
              initialValue.nameColor = event.target.value;
            }}
          />
        </Input.Group>
      ),
    },
    {
      title: '指标名称',
      dataIndex: 'indexGroup',
      colProps: { span: 12 },
      tooltip: '仅在卡片大小为中或小时显示。当未设置该项时，显示汇总维度的指标名称。',
      renderFormItem: (_, __, form) => (
        <Input.Group compact>
          <Input
            style={{ width: '60%' }}
            placeholder="指标名称"
            defaultValue={initialValue.indexName}
            onInput={(event: any) => {
              initialValue.indexName = event.target.value;
            }}
          />
          <Input
            type="color"
            style={{ width: '40%' }}
            defaultValue={initialValue.indexNameColor || '#000000'}
            onInput={(event: any) => {
              initialValue.indexNameColor = event.target.value;
            }}
          />
        </Input.Group>
      ),
    },
    {
      title: '指标值/单位颜色',
      dataIndex: 'indexColorGroup',
      colProps: { span: 12 },
      tooltip: '仅在卡片大小为中或小时有效。',
      renderFormItem: (_, __, form) => (
        <Input.Group compact>
          <Input
            type="color"
            style={{ width: '50%' }}
            defaultValue={initialValue.indexValueColor || '#000000'}
            onInput={(event: any) => {
              initialValue.indexValueColor = event.target.value;
            }}
          />
          <Input
            type="color"
            style={{ width: '50%' }}
            defaultValue={initialValue.indexValueUnitColor || '#000000'}
            onInput={(event: any) => {
              initialValue.indexValueUnitColor = event.target.value;
            }}
          />
        </Input.Group>
      ),
    },
    {
      title: '卡片样式',
      dataIndex: 'style',
      valueType: 'radio',
      fieldProps: {
        options: [
          {
            label: '系统内置',
            value: 'default',
          },
          {
            label: '自定义',
            value: 'custom',
          },
        ],
      },
    },
    {
      title: '卡片大小',
      dataIndex: 'size',
      valueType: 'radio',
      tooltip: '选择卡片的大小以适应您的布局需求',
      hideInForm: styleType !== 'default',
      fieldProps: {
        options: [
          {
            label: '大',
            value: 'large',
          },
          {
            label: '中',
            value: 'medium',
          },
          {
            label: '小',
            value: 'small',
          },
        ],
      },
    },
    {
      title: '宽度',
      dataIndex: 'widthValue',
      hideInForm: styleType !== 'custom',
      colProps: { span: 12 },
      renderFormItem: (_, __, form) => {
        return (
          <Input.Group compact>
            <Input
              defaultValue={initialValue.widthValue || undefined}
              style={{ width: '60%' }}
              placeholder="请输入数值"
              onInput={(event: any) => {
                form.setFieldValue('widthValue', event.target.value);
              }}
            />
            <Select
              defaultValue={initialValue.widthUnit || '%'}
              style={{ width: '40%' }}
              onChange={(value: any) => {
                initialValue['widthUnit'] = value;
              }}>
              <Option value="%">百分比</Option>
              <Option value="px">绝对值</Option>
            </Select>
          </Input.Group>
        );
      },
    },
    {
      title: '高度',
      dataIndex: 'heightValue',
      hideInForm: styleType !== 'custom',
      colProps: { span: 12 },
      renderFormItem: (_, __, form) => {
        return (
          <Input.Group compact>
            <Input
              defaultValue={initialValue.heightValue || undefined}
              style={{ width: '60%' }}
              placeholder="请输入数值"
              onInput={(event: any) => {
                form.setFieldValue('heightValue', event.target.value);
              }}
            />
            <Select
              defaultValue={initialValue.heightUnit || '%'}
              style={{ width: '40%' }}
              onChange={(value: any) => {
                initialValue['heightUnit'] = value;
              }}>
              <Option value="%">百分比</Option>
              <Option value="px">绝对值</Option>
            </Select>
          </Input.Group>
        );
      },
    },
    {
      title: '卡片颜色',
      dataIndex: 'cardBgColor',
      tooltip: '未设置卡片背景图时生效。',
      renderFormItem: (_, __, form) => (
        <Input
          type="color"
          style={{ width: '100%' }}
          defaultValue={initialValue.cardBgColor || '#ffffff'}
          onInput={(event: any) => {
            form.setFieldValue('cardBgColor', event.target.value);
          }}
        />
      ),
    },
    {
      title: '图表图例/坐标轴/刻度值字体颜色',
      dataIndex: 'chartTextColor',
      tooltip: '仅在卡片大小为大时有效。',
      renderFormItem: (_, __, form) => (
        <Input
          type="color"
          style={{ width: '100%' }}
          defaultValue={initialValue.chartTextColor || '#000000'}
          onInput={(event: any) => {
            form.setFieldValue('chartTextColor', event.target.value);
          }}
        />
      ),
    },
  ];
  return (
    <>
      <SchemaForm<schema.XForm>
        formRef={formRef}
        open
        title={'卡片配置'}
        width={640}
        columns={columns}
        initialValues={initialValue}
        rowProps={{
          gutter: [24, 0],
        }}
        layoutType="ModalForm"
        onOpenChange={(open: boolean) => {
          if (!open) {
            finished && finished();
          }
        }}
        onValuesChange={async (values: any) => {
          if (Object.keys(values)[0] === 'style') {
            setStyleType(values['style']);
          }
        }}
        onFinish={async (values) => {
          const newValues = Object.assign(initialValue, values);
          finished && finished(newValues);
        }}></SchemaForm>
    </>
  );
};

export default DashboardCardConfig;

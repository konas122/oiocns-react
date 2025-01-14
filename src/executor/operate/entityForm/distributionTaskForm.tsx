import React from 'react';
import { ProFormColumnsType } from '@ant-design/pro-components';
import SchemaForm from '@/components/SchemaForm';
import { IDirectory } from '@/ts/core';
import UploadItem from '../../tools/uploadItem';
import { EntityColumns } from './entityColumns';
import { schema } from '@/ts/base';
import { IDistributionTask } from '@/ts/core/thing/standard/distributiontask';
import { XDistributionTask } from '@/ts/base/schema';
import { TaskContentType } from '@/ts/base/model';
import { ReportContentForm } from './taskContent/ReportContentForm';
import { Button } from 'antd';
import { PeriodType } from '@/ts/base/enum';

const periodTypeNames: PeriodType[] = [
  PeriodType.Year,
  PeriodType.Quarter,
  PeriodType.Month,
  PeriodType.Week,
  PeriodType.Day,
  PeriodType.Once,
  PeriodType.Any,
];

interface Iprops {
  formType: string;
  current: IDirectory | IDistributionTask;
  finished: () => void;
}
/*
  编辑
*/
const DistributionTaskForm = (props: Iprops) => {
  let title = '';
  let directory: IDirectory;
  let task: IDistributionTask | undefined;
  const readonly = props.formType === 'remark';
  let initialValue: Partial<XDistributionTask> = props.current.metadata as any;

  switch (props.formType) {
    case 'newDistributionTask':
      title = '新建任务';
      initialValue = {
        content: {
          type: TaskContentType.Report,
          directoryId: '',
          treeId: '',
          workId: '',
          // reportId: ''
        },
      };
      directory = props.current as IDirectory;
      break;
    case 'updateDistributionTask':
      title = '更新任务';
      task = props.current as IDistributionTask;
      directory = props.current.directory;
      break;
    default:
      return <></>;
  }
  const columns: ProFormColumnsType<schema.XDistributionTask>[] = [
    {
      title: '图标',
      dataIndex: 'icon',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <UploadItem
            readonly={readonly}
            typeName={'任务'}
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
        rules: [{ required: true, message: '任务名称为必填项' }],
      },
    },
    {
      title: '代码',
      dataIndex: 'code',
      readonly: readonly,
      formItemProps: {
        rules: [{ required: true, message: '任务代码为必填项' }],
      },
    },
    {
      title: '任务周期',
      dataIndex: 'periodType',
      valueType: 'select',
      fieldProps: {
        options: periodTypeNames.map((value) => ({
          value,
          label: value,
        })),
      },
      formItemProps: {
        rules: [{ required: true, message: '任务周期为必填项' }],
      },
    },
  ];
  if (task) {
    columns.push({
      title: '任务详情',
      dataIndex: 'content',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        if (!initialValue.content) {
          return (
            <Button
              onClick={() =>
                form.setFieldValue('content', {
                  type: TaskContentType.Report,
                  directoryId: '',
                  treeId: '',
                  workId: '',
                })
              }>
              新建
            </Button>
          );
        }
        switch (initialValue.content.type) {
          case TaskContentType.Report:
            return (
              <ReportContentForm
                task={task!}
                value={initialValue.content!}
                onChange={(f) => {
                  form.setFieldValue('content', f);
                }}
                directory={directory}
              />
            );
          default:
            return <></>;
        }
      },
    });
  }
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
    <SchemaForm<schema.XDistributionTask>
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
        values.typeName = '任务';
        switch (props.formType) {
          case 'updateDistributionTask':
            await task!.update(values);
            break;
          case 'newDistributionTask':
            await directory.standard.createDistributionTask(values);
            break;
        }
        props.finished();
      }}
    />
  );
};

export default DistributionTaskForm;

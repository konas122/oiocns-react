import {
  DatePicker,
  DatePickerProps,
} from '@/components/Common/StringDatePickers/DatePicker';
import { ReportContent } from '@/ts/base/model';
import { PeriodType } from '@/ts/base/enum';
import { IDirectory, IFile, IWork } from '@/ts/core';
import { IDistributionTask } from '@/ts/core/thing/standard/distributiontask';
import {Form, Tag, message, Input} from 'antd';
import React, { useEffect, useState } from 'react';
import { EntityInput as _EntityInput } from '../../../../components/Common/EntityInput';
import {AuthoritySessionIdSet} from "@/ts/core/target/authority/authority";

const EntityInput: any = _EntityInput;

interface Props {
  value: ReportContent;
  onChange: (e: ReportContent) => any;
  directory: IDirectory;
  distribute?: boolean;
  task: IDistributionTask;
}

export function ReportContentForm(props: Props) {
  const workValidate = async (file: IFile[]): Promise<boolean> => {
    let work = file[0] as IWork;
    await work.loadNode();
    let flag = work.primaryForms.some((value) => {
      return value.typeName === '报表' || '表格';
    });
    if (!flag) {
      message.warning('办事主表中未存在报表类型数据');
    }
    return true;
  };

  const periodType = props.task.metadata.periodType;

  const [form] = Form.useForm();
  const [value, setValue] = useState<ReportContent>(props.value);
  const [directory, setDirectory] = useState(props.directory);

  useEffect(() => {
    setValue(props.value);
    form.setFieldsValue(props.value);
  }, [props.value]);

  async function updateValue(v: ReportContent) {
    let vClone = Object.assign(value, v);
    setValue(vClone);
    props.onChange(vClone);
  }

  function createPeriodType() {
    const attrs: DatePickerProps = {
      picker: 'date',
      format: 'YYYY-MM-DD',
    };
    switch (periodType) {
      case PeriodType.Year:
        attrs.picker = 'year';
        attrs.format = 'YYYY';
        break;
      case PeriodType.Quarter:
        attrs.picker = 'quarter';
        attrs.format = 'YYYY-MM';
        break;
      case PeriodType.Month:
        attrs.picker = 'month';
        attrs.format = 'YYYY-MM';
        break;
      case PeriodType.Week:
        attrs.picker = 'week';
        attrs.format = 'YYYY-MM-DD';
        break;
      case PeriodType.Day:
        attrs.picker = 'date';
        attrs.format = 'YYYY-MM-DD';
        break;
      default:
        break;
    }

    return <DatePicker {...attrs} />;
  }

  return (
    <div className="report-content-form" style={{ padding: '16px' }}>
      <Form
        initialValues={value}
        form={form}
        layout="vertical"
        onValuesChange={(_, v) => updateValue(v)}>
        <Form.Item name="type" label="类型">
          <Tag color="green">{periodType}</Tag>
          <Tag color="processing">{value.type}</Tag>
        </Form.Item>
        <Form.Item name="directoryId" label="目录" required={!props.distribute}>
          <EntityInput
            readonly={props.distribute}
            typeName="目录"
            directory={props.directory.target.directory}
            onValueChange={(file: any) => {
              if (file) {
                setDirectory(file);
              }
            }}
          />
        </Form.Item>
        <Form.Item name="workId" label="办事" required={!props.distribute}>
          <EntityInput
            readonly={props.distribute}
            typeName="办事"
            directory={directory}
            validate={workValidate}
          />
        </Form.Item>
        <Form.Item name="treeId" label="报表树" required={!props.distribute}>
          <EntityInput
            readonly={props.distribute}
            typeName="报表树"
            directory={props.directory}
          />
        </Form.Item>

        {/* 分发详情专属字段 */}
        {props.distribute ? (
          <>
            {periodType == PeriodType.Once ? (
              <></>
            ) : (
              <Form.Item name="period" label="数据时期" required>
                {createPeriodType()}
              </Form.Item>
            )}
            <Form.Item name="startDate" label="填报开始时间">
              <DatePicker picker="date" format="YYYY-MM-DD 00:00:00" />
            </Form.Item>
            <Form.Item name="endDate" label="填报结束时间">
              <DatePicker picker="date" format="YYYY-MM-DD 23:59:59" />
            </Form.Item>
            <Form.Item name="autoDistributionAuthCode" label="自动下发权限编码" required>
              <Input />
            </Form.Item>
          </>
        ) : (
          <></>
        )}
      </Form>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { DatePicker as AntdDatePicker } from 'antd';
import moment, { Moment } from 'moment';
import { RangePickerProps as AntdRangePickerProps } from 'antd/lib/date-picker/generatePicker';
import { omit } from 'lodash';

type ValueType = Moment | null;

export type DatePickerProps = Omit<
  AntdRangePickerProps<Moment>,
  'value' | 'onChange' | 'format'
> & {
  format?: string;
  value?: string;
  onChange?: (value: string) => void;
};

/**
 * 绑定到字符串形式日期范围的组件
 * @param props 原始Antd RangePicker的属性，其中value和onChange类型做了调整
 */
export function DatePicker(props: DatePickerProps) {
  const [dateValue, setDateValue] = useState<ValueType>(null);

  useEffect(() => {
    let date: ValueType = null;
    if (props.value) {
      date = props.value ? moment(props.value, props.format) : null;
    }
    setDateValue(date);
  }, [props.value]);

  function valueChange(date?: ValueType) {
    if (!date) {
      date = null;
    }
    setDateValue(() => date!);

    let dateStr = date ? date.format(props.format) : '';
    props.onChange?.(dateStr);
  }

  return (
    <AntdDatePicker
      {...(omit(props, ['value', 'onChange']) as any)}
      value={dateValue!}
      onChange={valueChange}
    />
  );
}

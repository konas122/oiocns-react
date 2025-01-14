import React, { useEffect, useState } from 'react';
import { DatePicker } from 'antd';
import moment, { Moment } from 'moment';
import { RangePickerProps as AntdRangePickerProps } from 'antd/lib/date-picker/generatePicker';
import { omit } from 'lodash';

type ValueType = [Moment | null, Moment | null];
type StringValueType = [string, string];

export type RangePickerProps = Omit<
  AntdRangePickerProps<Moment>,
  'value' | 'onChange' | 'format'
> & {
  format?: string;
  value?: StringValueType;
  onChange?: (value: StringValueType) => void;
};

/**
 * 绑定到字符串形式日期范围的组件
 * @param props 原始Antd RangePicker的属性，其中value和onChange类型做了调整
 */
export function RangePicker(props: RangePickerProps) {
  const [dateRange, setDateRange] = useState<ValueType>([null, null]);

  useEffect(() => {
    let date: ValueType = [null, null];
    if (props.value) {
      date = [
        props.value[0] ? moment(props.value[0], props.format) : null,
        props.value[1] ? moment(props.value[1], props.format) : null,
      ];
    }
    setDateRange(date);
  }, [props.value]);

  function valueChange(date: ValueType | null) {
    if (!date) {
      date = [null, null];
    }
    setDateRange(() => date!);

    let dateStr = date.map((d) => (d ? d.format(props.format) : '')) as StringValueType;
    props.onChange?.(dateStr);
  }

  return (
    <DatePicker.RangePicker
      {...omit(props, ['value', 'onChange'])}
      value={dateRange}
      onChange={valueChange}
    />
  );
}

import {
  LoadingOutlined,
  ReloadOutlined,
  UploadOutlined,
  UpOutlined,
} from '@ant-design/icons';
import {
  Button,
  Cascader,
  Checkbox,
  DatePicker,
  Form as FormAntd,
  Popover,
  Space,
} from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import _ from 'lodash';
import moment from 'moment';
import React, { memo, useEffect, useState } from 'react';
import cls from '../index.module.less';
import { IFormBrowserProps } from './FormBrowser';

interface IProps extends IFormBrowserProps {
  subjectTree: any;
  isReload: boolean;
  currentSubject: any[];
  onUpdateSubject: (values: any) => void;
  onUpdateAdFilter: (values: any) => void;
  onExport: () => void;
  onReload: () => void;
}
const defaultFilterValue = [
  {
    key: 1,
    label: '余额为0 不显示',
    checked: false,
  },
  {
    key: 2,
    label: '无发生额且余额为 0 不显示',
    checked: false,
  },
];

const FormTools = ({
  subjectTree,
  period,
  currentSubject,
  isReload,
  latestAndOldestBillingPeriods,
  onExport,
  onReload,
  onUpdatePeriod,
  onUpdateSubject,
  onUpdateAdFilter,
}: IProps) => {
  const [visibleFilter, setVisibleFilter] = useState<boolean>(false); // 高级筛选
  const formRef = FormAntd.useForm()[0];
  const [minDate, maxDate] = latestAndOldestBillingPeriods.map((period: string) =>
    moment(period, 'YYYY-MM'),
  );
  useEffect(() => {
    if (period) {
      formRef.setFieldsValue({ period: [moment(period[0]), moment(period[1])] });
    }
    if (currentSubject) {
      formRef.setFieldsValue({ subject: currentSubject });
    }
    if (isReload) {
      setFilterValue(defaultFilterValue);
    }
  }, [period, currentSubject, isReload]);

  const [filterValue, setFilterValue] = useState(defaultFilterValue);

  const PopoverTitle: React.FC = () => {
    const onCheckboxChange = (idx: number, e: CheckboxChangeEvent) => {
      const newFilterValue = _.cloneDeep(filterValue);
      newFilterValue[idx]['checked'] = e.target.checked;
      setFilterValue(newFilterValue);
    };

    return (
      <div className={cls.popoverTitle}>
        <Space size={16} direction="vertical" style={{ padding: '12px 0' }}>
          {filterValue.map((val, idx) => {
            return (
              <Checkbox
                key={val.key}
                checked={val.checked}
                onChange={onCheckboxChange.bind(this, idx)}>
                {val.label}
              </Checkbox>
            );
          })}
        </Space>
      </div>
    );
  };
  const PopoverContent: React.FC = ({}) => {
    const onReset = () => {
      setFilterValue(defaultFilterValue);
      onUpdateAdFilter([]);
      setVisibleFilter(false);
    };
    return (
      <div className={cls.popoverContent}>
        <a href="#" onClick={() => setVisibleFilter(false)}>
          收起筛选&nbsp;
          <UpOutlined />
        </a>
        <div>
          <Space size={8}>
            <Button type="text" size="small" onClick={onReset}>
              重置
            </Button>
            <Button
              type="primary"
              size="small"
              onClick={() => {
                onUpdateAdFilter(filterValue);
                setVisibleFilter(false);
              }}>
              确定
            </Button>
          </Space>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className={cls.control}>
        <Space>
          <FormAntd layout="inline" form={formRef}>
            <FormAntd.Item name="period" label="会计日月">
              <DatePicker.RangePicker
                picker="month"
                onChange={(values: any) => {
                  if (Array.isArray(values) && values.length > 1) {
                    const startDate = values[0].format('YYYY-MM');
                    const endDate = values[1].format('YYYY-MM');
                    onUpdatePeriod && onUpdatePeriod([startDate, endDate]);
                  }
                }}
                format="YYYY-MM"
                disabledDate={(current: any) => {
                  return (
                    current &&
                    (current < minDate.startOf('month') ||
                      current > maxDate.endOf('month'))
                  );
                }}
              />
            </FormAntd.Item>
            <FormAntd.Item name="subject" label="选择科目">
              <Cascader
                placeholder="选择科目"
                style={{ width: '200px' }}
                options={subjectTree}
                multiple
                maxTagCount="responsive"
                onChange={(values) => {
                  onUpdateSubject && onUpdateSubject(values);
                }}
              />
            </FormAntd.Item>
          </FormAntd>
          <Popover
            placement="bottom"
            open={visibleFilter}
            title={<PopoverTitle />}
            content={<PopoverContent />}
            trigger="click"
            onOpenChange={(value) => {
              setVisibleFilter(value);
            }}>
            <Button>高级筛选</Button>
          </Popover>
        </Space>

        <Space size={8}>
          <Button
            onClick={() => {
              onExport && onExport();
            }}>
            <UploadOutlined />
            导出
          </Button>
          <Button
            disabled={isReload}
            onClick={() => {
              onReload && onReload();
            }}>
            {isReload ? <LoadingOutlined /> : <ReloadOutlined />}
            刷新
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default memo(FormTools);

import { IForm } from '@/ts/core';
import React, { useEffect, useState } from 'react';
import { Emitter } from '@/ts/base/common';
import { Tabs } from 'antd';
import AttributeConfig from '../../WorkForm/Design/config/attribute';
import FormConfig from '../../WorkForm/Design/config/form';
import FloatRowsConfig from './floatRows';
import { XFloatRowsInfo } from '../types';
import { SimpleItem } from 'devextreme-react/form';
import { ReportTreeNodeTypes } from '@/ts/base/enum';
import { ReportType } from '@/ts/base/enum';

interface IAttributeProps {
  current: IForm;
  index: number;
  rowInfo: XFloatRowsInfo | undefined;
  notifyEmitter: Emitter;
}

const Config: React.FC<IAttributeProps> = (props) => {
  const [activeTabKey, setActiveTabKey] = useState<string>('form');
  useEffect(() => {
    if (props.index > -1) {
      setActiveTabKey('property');
    }
    if (props.rowInfo) {
      setActiveTabKey('rowInfo');
    }
  }, [props]);
  const loadItems = () => {
    const items = [
      {
        key: 'form',
        label: '表单设置',
        forceRender: true,
        children: (
          <FormConfig
            {...props}
            extraFields={[
              <SimpleItem
                dataField="reportType"
                editorType="dxSelectBox"
                isRequired={false}
                label={{ text: '报表类型' }}
                editorOptions={{
                  items: Object.values(ReportType).map((type) => {
                    return ReportTreeNodeTypes[type as keyof typeof ReportTreeNodeTypes];
                  }),
                }}
                key="reportType"
              />,
            ]}
          />
        ),
      },
    ];
    if (props.index > -1) {
      items.unshift({
        key: 'property',
        label: '属性参数',
        forceRender: true,
        children: <AttributeConfig {...props} />,
      });
    }
    if (props.rowInfo) {
      items.unshift({
        key: 'rowInfo',
        label: '浮动行配置',
        forceRender: true,
        children: <FloatRowsConfig {...props} />,
      });
    }
    return items;
  };
  return (
    <Tabs
      items={loadItems()}
      activeKey={activeTabKey}
      onChange={(key) => setActiveTabKey(key)}
    />
  );
};

export default Config;

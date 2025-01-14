import { IReport } from '@/ts/core';
import React, { useEffect, useState } from 'react';
import { Emitter } from '@/ts/base/common';
import { Tabs } from 'antd';
import CellConfig from './cell';
import FormConfig from '../../WorkForm/Design/config/form';
import FloatRowsConfig from './floatRows';
import { SimpleItem } from 'devextreme-react/form';
import { ReportTreeNodeTypes } from '@/ts/base/enum';
import { ReportType } from '@/ts/base/enum';
import { XCells, XFloatRowsInfo } from '@/ts/base/schema';

interface IAttributeProps {
  current: IReport;
  cell: XCells | undefined;
  rowInfo: XFloatRowsInfo | undefined;
  notifyEmitter: Emitter;
}

const Config: React.FC<IAttributeProps> = (props) => {
  const [activeTabKey, setActiveTabKey] = useState<string>('report');
  useEffect(() => {
    if (props.cell) {
      setActiveTabKey('property');
    }
    if (props.rowInfo) {
      setActiveTabKey('rowInfo');
    }
  }, [props]);
  const loadItems = () => {
    const items = [
      {
        key: 'report',
        label: '表格设置',
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
    if (props.cell) {
      items.unshift({
        key: 'property',
        label: '属性参数',
        forceRender: true,
        children: (
          <CellConfig
            current={props.current}
            cell={props.cell}
            notifyEmitter={props.notifyEmitter}
          />
        ),
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

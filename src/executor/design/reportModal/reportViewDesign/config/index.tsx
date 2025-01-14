import { IView } from '@/ts/core';
import React, { useState } from 'react';
import { Emitter } from '@/ts/base/common';
import { Tabs } from 'antd';
import ReportViewConfig from './reportViewConfig';

interface IAttributeProps {
  current: IView;
  index: number;
  notifyEmitter: Emitter;
}

const Config: React.FC<IAttributeProps> = (props) => {
  const [activeTabKey, setActiveTabKey] = useState<string>('view');
  const loadItems = () => {
    const items = [
      {
        key: 'view',
        label: '视图设置',
        forceRender: true,
        children: <ReportViewConfig {...props} />,
      },
    ];
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

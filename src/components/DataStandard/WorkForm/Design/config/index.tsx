import { IForm } from '@/ts/core';
import React, { useCallback, useEffect, useState } from 'react';
import FormConfig from './form';
import AttributeConfig from './attribute';
import PrintConfig from './print';
import FormPrint from './formPrint';
import { Emitter } from '@/ts/base/common';
import { Tabs } from 'antd';
import ViewConfig from './view';
import DocumentConfig from '@/components/Common/FlowDesign/Config/Components/Document';

interface IAttributeProps {
  current: IForm;
  index: number;
  notifyEmitter: Emitter;
}

const Config: React.FC<IAttributeProps> = (props) => {
  const [activeTabKey, setActiveTabKey] = useState<string>('form');
  useEffect(() => {
    if (props.index > -1) {
      setActiveTabKey('property');
    }
  }, [props.index]);
  const pickConfig = () => {
    switch (props.current.typeName) {
      case '视图':
        return <ViewConfig {...props} />;
      default:
        return <FormConfig {...props} />;
    }
  };
  // 切换tab时，通知父组件
  const loadItems = useCallback(() => {
    const typeName = props.current.typeName;
    const items = [
      {
        key: 'form',
        label: `${typeName}设置`,
        forceRender: true,
        children: pickConfig(),
      },
      {
        key: 'print',
        label: '标签设置',
        forceRender: true,
        children: <PrintConfig {...props} />,
      },
      {
        key: 'formPrint',
        label: '打印模板设置',
        forceRender: true,
        children: <FormPrint {...props} />,
      },
      {
        key: 'doc',
        label: '文档模板设置',
        forceRender: true,
        children: <DocumentConfig formHost={props.current} current={props.current.metadata} />,
      },
      // {
      //   key: 'rule',
      //   label: '规则参数',
      //   forceRender: true,
      //   children: <FormRuleConfig {...props} />,
      // },
    ];
    if (props.index > -1) {
      items.unshift({
        key: 'property',
        label: '属性参数',
        forceRender: true,
        children: <AttributeConfig {...props} />,
      });
    }
    return items;
  }, [pickConfig, props.current.typeName, props.index]);
  return (
    <Tabs
      items={loadItems()}
      activeKey={activeTabKey}
      onChange={(key) => setActiveTabKey(key)}
    />
  );
};

export default Config;

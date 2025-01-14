import { Card, Tabs, message } from 'antd';
import React, { useState, useEffect } from 'react';
import { IForm } from '@/ts/core';
import { schema, model } from '@/ts/base';
import { ImUndo2 } from 'react-icons/im';
import CardView from './CardView';
import MatterView from './MatterView';
import FormView from './FormView';

interface IProps {
  form: IForm;
  thingData: schema.XThing;
  onBack: () => void;
}

/**
 * 物-查看
 * @returns
 */
const ThingView: React.FC<IProps> = (props) => {
  const ThingActive = localStorage.getItem('activeView');
  const [activeTabKey, setActiveTabKey] = useState(ThingActive ? ThingActive : 'card');
  const [thingDatas, setThingDatas] = useState<schema.XThing>(props.thingData);

  useEffect(() => {
    const loadOptions: model.LoadOptions = {
      options: {
        match: {
          isDeleted: false,
          id: { $in: [props.thingData.id] },
        },
      },
    };
    const loadData = async () => {
      try {
        const result = await props.form.loadArchives(loadOptions);
        const updatedThingData = {
          ...props.thingData,
          archives: result.data[0].archives,
        };
        setThingDatas(updatedThingData);
      } catch (error) {
        message.error('加载数据失败');
      }
    };
    loadData();
  }, [props.thingData, props.form]);

  const onTabsChange = (e: string) => {
    setActiveTabKey(e);
    localStorage.setItem('activeView', e);
  };

  /** 加载每一项 */
  const loadItems = () => {
    const items = [
      {
        key: 'card',
        label: '卡片视图',
        children: <CardView form={props.form} thingData={thingDatas} />,
      },
      {
        key: 'matter',
        label: '事项视图',
        children: <MatterView form={props.form} thingData={thingDatas} />,
      },
      {
        key: 'form',
        label: '归档痕迹视图',
        children: <FormView form={props.form} thingData={thingDatas} />,
      },
    ];
    return items;
  };

  return (
    <Card>
      <Tabs
        activeKey={activeTabKey}
        onChange={onTabsChange}
        items={loadItems()}
        tabBarExtraContent={
          <div
            style={{ display: 'flex', cursor: 'pointer' }}
            onClick={() => {
              props.onBack();
            }}>
            <a style={{ paddingTop: '2px' }}>
              <ImUndo2 />
            </a>
            <a style={{ paddingLeft: '6px' }}>返回</a>
          </div>
        }
      />
    </Card>
  );
};

export default ThingView;

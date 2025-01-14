import { Card, Tabs } from 'antd';
import React from 'react';
import { IForm } from '@/ts/core';
import { schema } from '@/ts/base';
import ThingArchive from '../archive';
interface IProps {
  form: IForm;
  thingData: schema.XThing;
}

/**
 * 归档痕迹视图
 * @returns
 */
const FormView: React.FC<IProps> = (props) => {
  if (!props.thingData?.archives) {
    return <p>暂无归档信息</p>;
  }
  const doneTasks = Object.values(props.thingData.archives);

  /** 加载每一项 */
  const loadItems = () => {
    const items = [];
    for (const task of doneTasks) {
      items.push({
        key: task.id,
        label: task.title,
        forceRender: true,
        children: <ThingArchive instances={[task]} />,
      });
    }
    return items;
  };

  return (
    <Card>
      <Tabs items={loadItems()} />
    </Card>
  );
};

export default FormView;

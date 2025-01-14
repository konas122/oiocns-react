import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { ExistTypeMeta } from '@/ts/element/ElementMeta';
import { SEntity } from '@/ts/element/standard';
import { Context } from '../../../render/PageContext';
import { defineElement } from '../../defineElement';
import orgCtrl from '@/ts/controller';
import { Divider, Space } from 'antd';
import { FaChevronRight } from 'react-icons/fa6';
import { formatSize } from '@/ts/base/common';

interface IProps {
  height: number;
  url?: SEntity;
  props: any;
  ctx: Context;
}

const renderDataItem = (
  title: string,
  number: string | number,
  size?: number,
  info?: string,
) => {
  return (
    <div className="dataItem">
      <div className="dataItemTitle">{title}</div>
      <div className="dataItemNumber">{number}</div>
      {size && size > 0 && <div className="dataItemTitle">大小:{formatSize(size)}</div>}
      {info && info.length > 0 && <div className="dataItemTitle">{info}</div>}
    </div>
  );
};
const View: React.FC<IProps> = () => {
  const history = useHistory();
  // 渲染沟通信息
  const [todoCount, setTodoCount] = useState(0);
  const [ApplyCount, setApplyCount] = useState(0);
  const [CopysCount, setCopysCount] = useState(0);
  const [CompletedCount, setCompletedCount] = useState(0);
  useEffect(() => {
    const id = orgCtrl.work.notity.subscribe(() => {
      setTodoCount(orgCtrl.work.todos.length);
      orgCtrl.work.loadTaskCount('已发起').then((v) => {
        setApplyCount(v);
      });
      orgCtrl.work.loadTaskCount('抄送').then((v) => {
        setCopysCount(v);
      });
      orgCtrl.work.loadTaskCount('已办').then((v) => {
        setCompletedCount(v);
      });
    });
    return () => {
      orgCtrl.unsubscribe(id);
    };
  }, []);
  return (
    <div className="workbench-wrap">
      <div className="cardGroup">
        <div
          className="cardItem"
          onClick={() => history.push('work')}
          style={{ minHeight: '80px' }}>
          <div className="cardItem-header">
            <span className="title">办事</span>
            <span className="extraBtn">
              <span>
                待办<b>{todoCount}</b>件
              </span>
              <FaChevronRight />
            </span>
          </div>
          <div className="cardItem-viewer">
            <Space wrap split={<Divider type="vertical" />} size={2}>
              {renderDataItem('待办', todoCount)}
              {renderDataItem('已办', CompletedCount)}
              {renderDataItem('抄送', CopysCount)}
              {renderDataItem('已发起', ApplyCount)}
            </Space>
          </div>
        </div>
      </div>
    </div>
  );
};
export default defineElement({
  render(props, ctx) {
    return <View {...props} ctx={ctx} />;
  },
  displayName: 'Work',
  meta: {
    props: {
      height: {
        type: 'number',
        default: 200,
      },
      url: {
        type: 'type',
        label: '关联图片',
        typeName: 'picFile',
      } as ExistTypeMeta<SEntity | undefined>,
    },
    label: '办事概览',
    type: 'Element',
  },
});

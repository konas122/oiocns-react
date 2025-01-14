import React from 'react';
import { ExistTypeMeta } from '@/ts/element/ElementMeta';
import { SEntity } from '@/ts/element/standard';
import { Context } from '../../../render/PageContext';
import { defineElement } from '../../defineElement';
import { Calendar } from 'antd';

interface IProps {
  height: number;
  url?: SEntity;
  props: any;
  ctx: Context;
}

const View: React.FC<IProps> = (props) => {
  return (
    <div className="cardItem">
      <div className="cardItem-header">
        <span className="title">日历</span>
        {/* <span className={cls.extraBtn}>
        <Button type="text" size="small">
          <ImPlus /> <span>创建日程</span>
        </Button>
      </span> */}
      </div>
      <Calendar />
    </div>
  );
};

export default defineElement({
  render(props, ctx) {
    return <View {...props} ctx={ctx} />;
  },
  displayName: 'Calendar',
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
    label: '日历',
    type: 'Element',
  },
});

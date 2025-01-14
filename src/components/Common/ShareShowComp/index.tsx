import { AiOutlineCloseCircle } from 'react-icons/ai';
import React, { ReactNode } from 'react';
import cls from './index.module.less';
import { Typography } from 'antd';

type ShareShowRecentProps = {
  departData: { name: string; id: string; type?: string }[];
  deleteFuc: (id: string) => void;
  onClick?: Function;
  tags?: (id: string) => ReactNode;
}; 

const ShareShowRecent: React.FC<ShareShowRecentProps> = (props) => {
  const data = props.departData || [];
  return (
    <div className={cls.layout}>
      <div className={cls.title}>已选{data.length}条数据</div>
      <div className={cls.content}>
        {data.map((el: any, idx: number) => {
          return (
            <div
              style={{
                background:
                  el?.type == 'del' ? '#ffb4c4' : el?.type == 'add' ? '#beffd0' : '',
              }}
              key={el.id}
              className={`${cls.row} ${
                data.length > 1 && idx !== data.length - 1 ? cls.mgt6 : ''
              }`}>
              <div
                style={{ marginRight: 8 }}
                onClick={() => {
                  props.onClick?.call(this, el);
                }}>
                <Typography.Text
                  style={{ fontSize: 14, lineHeight: '24px', color: '#888' }}
                  title={el.name}
                  ellipsis>
                  {props.onClick ? <a>{el.name}</a> : el.name}
                </Typography.Text>
              </div>
              {props.tags?.(el.id)}
              <div
                className={cls.closeIconWarpper}
                onClick={() => {
                  props?.deleteFuc.apply(this, [el.id]);
                }}>
                <AiOutlineCloseCircle />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShareShowRecent;

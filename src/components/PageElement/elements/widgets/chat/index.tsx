import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { ExistTypeMeta } from '@/ts/element/ElementMeta';
import { SEntity } from '@/ts/element/standard';
import { Context } from '../../../render/PageContext';
import { defineElement } from '../../defineElement';
import orgCtrl from '@/ts/controller';
import { useFlagCmdEmitter } from '@/hooks/useCtrlUpdate';
import { Divider, Space, Spin } from 'antd';
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
  // 渲染沟通信息
  const history = useHistory();
  const [msgCount, setMsgCount] = useState(0);
  const [loaded] = useFlagCmdEmitter('session', () => {
    setMsgCount(
      orgCtrl.chats
        .map((i) => {
          return i.isMyChat ? i.badgeCount : 0;
        })
        .reduce((total, count) => total + count, 0),
    );
  });
  return (
    <div className="workbench-wrap">
      <div className="cardGroup">
        <div className="cardItem" onClick={() => history.push('chat')}>
          <div className="cardItem-header">
            <span className="title">沟通</span>
            <span className="extraBtn">
              <span>
                未读<>{msgCount}</>条
              </span>
              <FaChevronRight />
            </span>
          </div>
          <div className="cardItem-viewer">
            <Spin spinning={!loaded}>
              <Space wrap split={<Divider type="vertical" />} size={2}>
                {renderDataItem('好友(人)', orgCtrl.user.members.length)}
                {renderDataItem(
                  '同事(个)',
                  orgCtrl.user.companys
                    .map((i) => i.members.map((i) => i.id))
                    .reduce(
                      (ids, current) => [
                        ...ids,
                        ...current.filter((i) => !ids.includes(i)),
                      ],
                      [],
                    ).length,
                )}
                {renderDataItem(
                  '群聊(个)',
                  orgCtrl.chats.filter((i) => i.isMyChat && i.isGroup).length,
                )}
                {renderDataItem('单位(家)', orgCtrl.user.companys.length)}
              </Space>
            </Spin>
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
  displayName: 'Chat',
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
    label: '沟通概览',
    type: 'Element',
  },
});

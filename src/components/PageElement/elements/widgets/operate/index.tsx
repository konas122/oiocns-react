import { Button } from 'antd';
import React from 'react';
import { ExistTypeMeta } from '@/ts/element/ElementMeta';
import { SEntity } from '@/ts/element/standard';
import { Context } from '../../../render/PageContext';
import { defineElement } from '../../defineElement';
import orgCtrl from '@/ts/controller';
import { Divider, Space } from 'antd';
import { useHistory } from 'react-router-dom';
import { command } from '@/ts/base';
import { ImStack } from 'react-icons/im';
import TypeIcon from '@/components/Common/GlobalComps/typeIcon';

interface IProps {
  height: number;
  url?: SEntity;
  props: any;
  ctx: Context;
}

const View: React.FC<IProps> = () => {
  // 操作组件
  const history = useHistory();
  // 发送快捷命令
  const renderCmdBtn = (cmd: string, title: string) => {
    return (
      <Button
        className="linkBtn"
        type="text"
        icon={
          <div className="svg-container">
            <TypeIcon iconType={cmd} size={26} />
          </div>
        }
        onClick={() => {
          command.emitter('executor', cmd, orgCtrl.user);
        }}>
        {title}
      </Button>
    );
  };
  return (
    <div className="workbench-wrap">
      <div className="cardGroup">
        <div style={{ minHeight: 80 }} className="cardItem">
          <div className="cardItem-header">
            <span className="title">快捷操作</span>
            <span className="extraBtn" onClick={() => history.push('relation')}>
              <ImStack size={15} /> <span>更多操作</span>
            </span>
          </div>
          <div style={{ width: '100%', minHeight: 60 }} className="cardItem-viewer">
            <Space wrap split={<Divider type="vertical" />} size={6}>
              {renderCmdBtn('joinFriend', '添加好友')}
              {renderCmdBtn('joinStorage', '申请存储')}
              {renderCmdBtn('newCohort', '创建群聊')}
              {renderCmdBtn('joinCohort', '加入群聊')}
              {renderCmdBtn('newCompany', '设立单位')}
              {renderCmdBtn('joinCompany', '加入单位')}
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
  displayName: 'Operate',
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
    label: '快捷操作',
    type: 'Element',
  },
});

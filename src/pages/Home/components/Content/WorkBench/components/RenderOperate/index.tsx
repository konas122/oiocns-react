import React, { useMemo } from 'react';
import { Button, Divider, Space } from 'antd';
import { useHistory } from 'react-router-dom';
import { command } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { ImStack } from 'react-icons/im';
import TypeIcon from '@/components/Common/GlobalComps/typeIcon';
import { PersonQuickOperate, CompanyQuickOperate } from '@/ts/core/public/consts';

const RenderOperate: React.FC = () => {
  // 发送快捷命令
  const history = useHistory();
  const renderCmdBtn = (cmd: string, title: string) => {
    return (
      <Button
        className="linkBtn"
        type="text"
        key={cmd}
        icon={
          <div className="svg-container">
            <TypeIcon iconType={cmd} size={26} />
          </div>
        }
        onClick={() => {
          command.emitter('executor', cmd, orgCtrl.home.current);
        }}>
        {title}
      </Button>
    );
  };
  const operates = useMemo(() => {
    return orgCtrl.home.current.typeName === '单位'
      ? CompanyQuickOperate
      : PersonQuickOperate;
  }, [orgCtrl.home.current.typeName]);
  return (
    <>
      <div className="cardGroup">
        <div className="cardItem" style={{ minHeight: 80 }}>
          <div className="cardItem-header">
            <span className="title">快捷操作</span>
            <span className="extraBtn" onClick={() => history.push('relation')}>
              <ImStack size={15} /> <span>更多操作</span>
            </span>
          </div>
          <div style={{ width: '100%', minHeight: 60 }} className="cardItem-viewer">
            <Space wrap split={<Divider type="vertical" />} size={6}>
              {operates.map((item) => {
                return renderCmdBtn(item.cmd, item.label);
              })}
            </Space>
          </div>
        </div>
      </div>
    </>
  );
};
export default RenderOperate;

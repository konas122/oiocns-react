import React, { useState, useRef } from 'react';
import { ISession, ITarget } from '@/ts/core';
import AccoutSetting from '../info/accoutSetting';
import { Card, Button, Modal, Space, Tag } from 'antd';
import { AiFillWarning } from 'react-icons/ai';
import DynamicCode from '@/components/Common/DynamicCode';
import HomeSetting from './common/homeSetting';
const PersonSetting: React.FC<{ target: ITarget; session: ISession }> = ({
  target,
  session,
}) => {
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);
  const DynamicRef = useRef<any>();
  return (
    <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
      <AccoutSetting {...target} />
      <HomeSetting session={session} target={target} />
      <Card title="注销信息">
        <Button danger onClick={() => setOpenConfirm(true)}>
          注销账户
        </Button>
      </Card>
      <Modal
        title="账号注销"
        open={openConfirm}
        onOk={async () => {
          if (DynamicRef.current && DynamicRef.current.verifyCode()) {
            if (await target.delete()) {
              setOpenConfirm(false);
              sessionStorage.clear();
              window.location.href = '/#/auth';
            }
          }
        }}
        onCancel={() => setOpenConfirm(false)}>
        <Space direction="vertical" size={[10, 4]}>
          <Tag color="error" style={{ fontSize: '20px' }}>
            <AiFillWarning /> 您正在进行高危操作: 账号注销( {target.name})
          </Tag>
          <div style={{ fontSize: '18px' }}>账号注销后,所有信息将会销毁且无法找回</div>
          <div style={{ fontSize: '18px' }}>请谨慎操作</div>
        </Space>
        <DynamicCode showPhone editPhone={false} account={target.code} ref={DynamicRef} />
      </Modal>
    </Space>
  );
};
export default PersonSetting;

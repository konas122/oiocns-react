import React, { useCallback } from 'react';
import { Space, Card, Button, Modal, message } from 'antd';
import { ISession, ITarget } from '@/ts/core';
import PublicInfo from './publicInfo';
import { ProFormLayoutType } from '@ant-design/pro-components';
import HomeSetting from '../common/homeSetting';
import orgCtrl from '@/ts/controller';
import { orgAuth } from '@/ts/core/public/consts';

interface IProps {
  target: ITarget;
  session: ISession;
  layoutType?: ProFormLayoutType;
}

const UnitSetting: React.FC<IProps> = ({ target, session, ...other }: IProps) => {
  const openConfirm = useCallback(() => {
    Modal.confirm({
      okText: '确认',
      cancelText: '取消',
      title: '删除询问框',
      content: (
        <div style={{ fontSize: 16 }}>
          确认要彻底删除{target.typeName}[{target.name}]吗?
        </div>
      ),
      onOk: async () => {
        try {
          const success = await target.hardDelete();
          if (success) {
            orgCtrl.changCallback();
          }
        } catch (error) {
          message.error(error instanceof Error ? error.message : String(error));
        }
      },
    });
  }, []);
  return (
    <div>
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        {/* 公开信息 */}
        <PublicInfo target={target} {...other} readonly={true} />
        {/* 门户设置*/}
        <HomeSetting session={session} target={target.space} {...other} />
        {target.hasAuthoritys([orgAuth.SuperAuthId]) && (
          <Card title="注销信息">
            <Button danger onClick={openConfirm}>
              删除{target.typeName}
            </Button>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default UnitSetting;

import React from 'react';
import orgCtrl from '@/ts/controller';
import { ISession, ITarget } from '@/ts/core';
import { ProFormLayoutType } from '@ant-design/pro-components';
import PersonSetting from './personSetting';
import UnitSetting from './unitSetting';
interface IProps {
  target: ITarget;
  session: ISession;
  layoutType?: ProFormLayoutType;
}

const SettingInfo: React.FC<IProps> = ({ target, session, ...other }: IProps) => {
  const isSelf = session.id === orgCtrl.user.id;
  if (~['单位', '群组', '组织群', '部门'].indexOf(session.typeName)) {
    return <UnitSetting target={target} session={session} {...other} />;
  }
  if (isSelf) {
    return <PersonSetting target={session.target} session={session} />;
  }
  return <div></div>;
};

export default SettingInfo;

import React from 'react';
import RenderOperate from './components/RenderOperate';
import DataInfo from './components/DataInfo';
import Banner from './components/Banner';
import cls from './index.module.less';
import ContentCard from '../components/card';
import orgCtrl from '@/ts/controller';
import MatterInfo from './components/MatterInfo';
import { ICompany } from '@/ts/core';

// 工作台
const WorkBenchView: React.FC = () => {
  return (
    <div className="workbench-content">
      <Banner space={orgCtrl.home.current}></Banner>
      <RenderOperate />
      {!orgCtrl.home.isUser && <MatterInfo company={orgCtrl.home.current as ICompany} />}
      <ContentCard space={orgCtrl.home.current} />
      {orgCtrl.home.current.hasDataAuth() && <DataInfo space={orgCtrl.home.current} />}
      <div className="cardGroup">
        <div className={cls['flex-space']}></div>
      </div>
    </div>
  );
};

export default WorkBenchView;

import React from 'react';
import orgCtrl from '@/ts/controller';
import { GroupActivity } from '@/ts/core';
import GroupActivityItem from './group';

const ActivityIndex: React.FC = () => {
  const groupActivity = new GroupActivity(
    orgCtrl.user,
    orgCtrl.home.current.activitys,
    true,
  );
  return <GroupActivityItem activity={groupActivity} />;
};

export default ActivityIndex;

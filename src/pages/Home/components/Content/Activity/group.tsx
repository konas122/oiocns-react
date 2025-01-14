import React, { useState } from 'react';
import TargetActivity from '@/components/TargetActivity';
import ActivityMessage from '@/components/TargetActivity/ActivityMessage';
import { IActivity } from '@/ts/core';
import { Resizable } from 'devextreme-react';
import useCtrlUpdate from '@/hooks/useCtrlUpdate';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { Spin, Button } from 'antd';
import { useMedia } from 'react-use';
import { command } from '@/ts/base';
import BannerImg from '../../Common/BannerImg';
import { LoadBanner } from '../../Common/bannerDefaultConfig';
import orgCtrl from '@/ts/controller';
import './index.less';

const GroupActivityItem: React.FC<{ activity: IActivity }> = ({ activity }) => {
  const [key] = useCtrlUpdate(activity);
  const isWide = useMedia('(min-width: 1000px)');
  const [loaded] = useAsyncLoad(() => activity.load(10), [activity]);
  const [current, setCurrent] = useState<IActivity>(activity);

  const loadMenus = React.useCallback(() => {
    if (!loaded || !isWide) return <></>;
    return (
      <div className="groupContainer">
        <Resizable handles={'right'}>
          <div className="publish">
            <span style={{ fontSize: 16, lineHeight: '24px', fontWeight: 600 }}>
              动态列表
            </span>
            <Button
              type="link"
              onClick={() => {
                command.emitter(
                  'executor',
                  'pubActivity',
                  orgCtrl.home.current.session.activity,
                );
              }}>
              发动态
            </Button>
          </div>
          <div className={'groupList'}>
            {activity.activitys
              .filter((a) => a.activityList.length > 0)
              .sort(
                (a, b) =>
                  new Date(b.activityList[0].metadata.createTime).getTime() -
                  new Date(a.activityList[0].metadata.createTime).getTime(),
              )
              .map((item) => {
                if (item.activityList.length > 0) {
                  const _name = item.id === current.id ? 'selected' : 'item';
                  return (
                    <div
                      className={`groupList-${_name}`}
                      key={item.key}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrent(item);
                      }}>
                      <ActivityMessage
                        key={item.key}
                        item={item.activityList[0]}
                        activity={item}
                        hideResource
                      />
                    </div>
                  );
                }
              })}
          </div>
        </Resizable>
      </div>
    );
  }, [loaded, current, activity, key, isWide]);

  const loadContext = React.useCallback(() => {
    if (!loaded) return <></>;
    return (
      <div className={'loadContext'}>
        <TargetActivity
          height={'calc(100vh - 110px)'}
          activity={current}
          title={current.name + '动态'}></TargetActivity>
      </div>
    );
  }, [loaded, current]);

  return (
    <div className={'activityContent'}>
      <Spin tip="加载中,请稍后..." size="large" spinning={!loaded} delay={100}>
        <div style={{ width: '100%', padding: '0px 12px' }}>
          <BannerImg
            bannerImg={LoadBanner('activity')}
            bannerkey="activity"
            target={orgCtrl.home.current}></BannerImg>
        </div>
        <div className="groupCtx">
          {loadMenus()}
          {loadContext()}
        </div>
      </Spin>
    </div>
  );
};

export default GroupActivityItem;

import React, { useState, useEffect } from 'react';
import { Tag, Space } from 'antd';
import orgCtrl from '@/ts/controller';
import { getResouces } from '@/config/location';
import cls from './index.module.less';
import { NavigationItem } from '../types';
import { IMallTemplate } from '@/ts/core/thing/standard/page/mallTemplate';
import { MallTemplate } from '@/executor/open/mallTemplate/pages';
import AssetModule from '../Content/AssetModule/index';
import FormView from '@/executor/open/view/form/formView';
import { model } from '@/ts/base';
import { TotalView } from '@/ts/core/thing/standard/view/totalView';
import LedgerForm from '@/executor/open/view/ledger/LedgerForm';
import { IView } from '@/ts/core';
import Directory from '@/components/Directory';
import { DashboardTemplateHomeView } from '@/executor/open/dashboardTemplate';

const resource = getResouces();

const allPages: NavigationItem[] = [
  {
    key: 'workbench',
    name: '工作台',
    type: 'inner',
    backgroundImageUrl: `/img/${resource.location}/banner/workbench.png`,
    component: React.lazy(() => import('../Content/WorkBench/index')),
    readonly: true,
  },
  {
    key: 'activity',
    name: '动态',
    type: 'inner',
    backgroundImageUrl: `/img/${resource.location}/banner/groupactivity.png`,
    component: React.lazy(() => import('../Content/Activity/index')),
    readonly: true,
  },
];
const HomeNavTemplate: React.FC = () => {
  const [headData, setHeadData] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [activeNav, setActiveNav] = useState<any>();
  useEffect(() => {
    initPage();
    orgCtrl.home.current.cacheObj.subscribe('homeConfig', async (res) => {
      initPage(res);
    });
  }, []);

  const initPage = async (_homeConfig?: model.HomeConfig) => {
    let res: any[] = [];
    if (_homeConfig) {
      res = await orgCtrl.home.getTops(_homeConfig);
    }
    setHeadData([...getTabItems(allPages), ...res]);
    setLoading(true);
  };
  const getTabItems = (page: any = headData) => {
    return page.map((it: any) => {
      return {
        ...it,
        children:
          it.type == '5' || it.type == '6'
            ? it.component
            : React.createElement(it.component, {
                onChange: () => {
                  initPage();
                },
              }),
      };
    });
  };
  const renderApp = (entity: any) => {
    const typeName = entity.metadata?.typeName;
    let data = <></>;
    switch (typeName) {
      case '应用':
        data = <AssetModule key={entity.key} selectXApp={entity}></AssetModule>;
        break;
      case '商城模板':
        data = <MallTemplate current={entity as IMallTemplate} />;
        break;
      case '视图':
        if (entity.groupTags.includes('图表视图')) {
          data = <DashboardTemplateHomeView current={entity as any} />;
          break;
        } else if (entity instanceof TotalView) {
          data = (
            <LedgerForm
              isFull={false}
              current={entity as IView}
              form={entity.metadata as any}
              directory={entity.directory}
            />
          );
        } else {
          data = (
            <FormView
              form={entity.metadata}
              directory={entity.directory}
              isMemberView={false}
            />
          );
        }
        break;
      case '目录':
        data = <Directory root={entity} />;
        break;
    }
    return data;
  };

  const onTagClick = (item: any, index: number) => {
    const typeName = item.metadata?.typeName;
    if (typeName) {
      let data = renderApp(item);
      headData[index] = item;
      setHeadData(headData);
      setActiveNav({
        name: item.name,
        children: data,
        id: item.metadata.id,
      });
    } else {
      setActiveNav(item);
    }
  };

  return loading ? (
    <div className={cls.homeNavTemplate}>
      <Space size={8} className={cls.homeNavTag}>
        {headData.map((item: NavigationItem, index: number) => {
          const props =
            (!activeNav && index === 0) || item.name === activeNav?.name
              ? { color: '#366EF4' }
              : {};
          return (
            <Tag key={item.name} {...props} onClick={onTagClick.bind(this, item, index)}>
              {item.name}
            </Tag>
          );
        })}
      </Space>
      <div>{activeNav?.children || headData[0]?.children}</div>
    </div>
  ) : (
    <></>
  );
};

export default HomeNavTemplate;

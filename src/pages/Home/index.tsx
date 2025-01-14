import { Spin, Tabs } from 'antd';
import React, { useState } from 'react';
import HomeNavTemplate from './components/HomeNavTemplate/index';
import cls from './index.module.less';
import orgCtrl from '@/ts/controller';
import { useFlagCmdEmitter } from '@/hooks/useCtrlUpdate';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import LoadingView from '@/components/Common/Loading';

const Home: React.FC = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [loaded, key, forceRefresh] = useFlagCmdEmitter('', () => {
    setPages([
      ...orgCtrl.home.spaces.map((item) => {
        return {
          key: item.id,
          label: item.name,
          belong: item,
          type: 'inner',
        };
      }),
    ]);
  });
  const onChange = (key: string) => {
    const belong = pages.find((item) => item.key === key).belong;
    orgCtrl.home.switchSpace(belong);
    forceRefresh();
  };
  if (!loaded) {
    return (
      <div className="loading-page">
        <LoadingView text="信息加载中..." />
      </div>
    );
  }

  return (
    <div className={cls.homepage}>
      <Tabs
        type="card"
        items={pages.map((item) => {
          return {
            label: (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {orgCtrl.home.current.id === item.key && (
                  <>
                    <EntityIcon entityId={orgCtrl.home.current.id} size={20} />
                    &nbsp;&nbsp;
                  </>
                )}
                <div
                  style={{
                    color: orgCtrl.home.current.id === item.key ? '#15181D' : '#424A57',
                  }}>
                  {item.label}
                </div>
              </div>
            ),
            key: item.key,
          };
        })}
        activeKey={orgCtrl.home.current.id}
        onChange={onChange}
      />
      <HomeNavTemplate key={key} />
    </div>
  );
};
export default Home;

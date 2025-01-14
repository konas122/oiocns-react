import { useEffect, useState } from 'react';
import { Badge, Layout, Space } from 'antd';
import React from 'react';
import { useFlagCmdEmitter } from '@/hooks/useCtrlUpdate';
import orgCtrl from '@/ts/controller';
import styles from './index.module.less';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import OrgIcons from '@/components/Common/GlobalComps/orgIcons';
import { useHistory } from 'react-router-dom';
import OnlineInfo from './online';

const Navbar: React.FC = () => {
  const history = useHistory();
  const [workCount, setWorkCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [onlineVisible, setOnlineVisible] = useState(false);
  useFlagCmdEmitter('session', () => {
    setMsgCount(
      orgCtrl.chats
        .filter((i) => i.isMyChat)
        .reduce((sum, i) => sum + i.chatdata.noReadCount, 0),
    );
  });
  useEffect(() => {
    const workId = orgCtrl.work.notity.subscribe(async () => {
      var todos = await orgCtrl.work.loadTodos();
      setWorkCount(todos.length);
    });
    return () => {
      orgCtrl.work.notity.unsubscribe(workId);
    };
  }, []);
  const actions = [
    {
      text: '门户',
      icon: 'navbar/home',
      path: '/home',
      count: 0,
    },
    {
      text: '沟通',
      icon: 'navbar/chat',
      path: '/chat',
      count: msgCount,
    },
    {
      text: '办事',
      icon: 'navbar/work',
      path: '/work',
      count: workCount,
    },
    {
      text: '数据',
      icon: 'navbar/store',
      path: '/store',
      count: 0,
    },
    {
      text: '关系',
      icon: 'navbar/relation',
      path: '/relation',
      count: 0,
    },
  ];

  const NavItem = (item: any) => {
    const selected = location.hash.startsWith('#' + item.path);
    let content = <OrgIcons size={28} type={item.icon} notAvatar selected={selected} />;
    if (item.count > 0) {
      content = (
        <Badge count={item.count} size="small">
          {content}
        </Badge>
      );
    }
    return (
      <a
        key={item.path}
        className={`${styles['navbar-item']} ${selected ? styles['navbar-item_selected'] : ''
          }`}
        onClick={() => {
          history.push(item.path);
          orgCtrl.currentKey = '';
          orgCtrl.changCallback();
        }}>
        {content}
        <div className={`${styles.title} ${selected ? styles.title_selected : ''}`}>
          {item.text}
        </div>
      </a>
    );
  };
  return (
    <Layout.Sider className={styles.header} width={65}>
      <div onClick={() => setOnlineVisible(!onlineVisible)}>
        <EntityIcon disableInfo entity={orgCtrl.user.metadata} size={42} />
      </div>
      <Space direction="vertical" wrap align="center" size={6} className={styles.navbar}>
        {actions.map((item) => NavItem(item))}
        {onlineVisible && <OnlineInfo onClose={() => setOnlineVisible(false)} />}
      </Space>
      <Space direction="vertical" wrap align="center" size={6}>
        {NavItem({
          text: '贡献',
          icon: 'navbar/developers',
          path: '/developers',
          count: 0,
        })}
        <a
          onClick={() => {
            orgCtrl.exit();
            window.location.reload();
          }}>
          <OrgIcons size={26} type="navbar/exit" />
          <div
            className={styles['navbar-exit']}
            onClick={() => {
              localStorage.removeItem('assetmoduleId');
            }}>
            退出
          </div>
        </a>
      </Space>
    </Layout.Sider>
  );
};

export default Navbar;

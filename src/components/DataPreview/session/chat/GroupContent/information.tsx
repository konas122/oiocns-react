import { IMessage, IMessageLabel } from '@/ts/core';
import { Drawer, List, Tabs } from 'antd';
import React, { useState } from 'react';
import orgCtrl from '@/ts/controller';
import TeamIcon from '@/components/Common/GlobalComps/entityIcon';
import ScrollList from '@/components/Common/ScrollList';
import { showChatTime } from '@/utils/tools';
import type { TabsProps } from 'antd';
import { schema } from '@/ts/base';

const Information = ({ msg, onClose }: { msg: IMessage; onClose: Function }) => {
  const [tabsKey, setTabsKey] = useState<string>();
  const [unreadInfo, setUnreadInfo] = useState(msg.unreadInfo);
  // 标签过滤
  const filterLables = (labels: IMessageLabel[], filter: string) => {
    if (filter === "") return labels;
    return labels.filter((i) => {
      if (i.label.includes(filter)) return true;
      var entity = orgCtrl.user.findMetadata<schema.XTarget>(i.userId);
      return entity && (entity.name.includes(filter) || entity.code.includes(filter));
    });
  }
  // 展示已读的
  const readList = () => {
    const [filter, setFilter] = useState('');
    return (
      <ScrollList loaded
        searchValue={filter}
        height="calc(100vh - 220px)"
        setSearchValue={(v) => setFilter(v)}
        data={filterLables(msg.labels.filter((a) => a.designateId != msg.metadata.designateId), filter)}
        renderItem={loadLabelItem}
      />
    );
  };

  // 展示未读
  const unRead = () => {
    const [filter, setFilter] = useState('');
    return (
      <ScrollList loaded
        data={filterLables(unreadInfo, filter)}
        searchValue={filter}
        height="calc(100vh - 220px)"
        setSearchValue={(v) => setFilter(v)}
        renderItem={loadLabelItem}
        onLoadMore={() => {
          msg.chat.target.loadMembers().then(() => {
            setUnreadInfo(msg.unreadInfo);
          })
        }}
      />
    );
  };

  const loadLabelItem = (item: IMessageLabel) => {
    return (
      <List.Item
        style={{ cursor: 'pointer', padding: 6 }}
        actions={
          item.time.length > 0
            ? [<div key={item.time}>{showChatTime(item.time)}</div>]
            : []
        }>
        <List.Item.Meta
          avatar={<TeamIcon entityId={item.designateId} size={42} />}
          title={<strong>{item.labeler.name}</strong>}
          description={
            <div style={{ lineHeight: '16px' }}>
              <div className="ellipsis1">{item.label}</div>
            </div>
          }
        />
      </List.Item>
    );
  };

  const items: TabsProps['items'] = [
    {
      key: 'unRead',
      label: `未读(${msg.chat.memberCount - 1 - msg.readedIds.length})`,
      children: unRead(),
    },
    { key: 'read', label: `已读(${msg.readedIds.length})`, children: readList() },
  ];

  return (
    <Drawer width={480} title={'消息接收人列表'} onClose={() => onClose()} closable open>
      <Tabs
        centered
        items={items}
        defaultActiveKey={'unRead'}
        activeKey={tabsKey}
        onChange={(e) => setTabsKey(e)}
      />
    </Drawer>
  );
};
export default Information;

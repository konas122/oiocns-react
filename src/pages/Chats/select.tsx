import React, { useEffect, useState } from 'react';
import orgCtrl from '@/ts/controller';
import { ISession } from '@/ts/core';
import DirectoryViewer from '@/components/Directory/views';
import { command } from '@/ts/base';
import { cleanMenus } from '@/utils/tools';
import { loadFileMenus } from '@/executor/fileOperate';
import { TargetType } from '@/ts/core/public';

/** 沟通-通讯录-选择 */
const ChatSelect: React.FC<{ onSelected: (chat: ISession) => void }> = ({
  onSelected,
}) => {
  const [chats, setChats] = useState<ISession[]>([]);
  const [currentTag, setCurrentTag] = useState('全部');

  useEffect(() => {
    setChats(filterChats(currentTag));
  }, [currentTag]);

  const specialDispose = (tag: string, groupTags: string[]) => {
    const { companys } = orgCtrl.user;
    let res1 = companys.filter((item) => groupTags.includes(item.name));
    let newTag = res1.length > 0 ? res1[0].name : TargetType.Company;
    switch (tag) {
      case TargetType.Cohort:
        return res1.length > 0 ? false : groupTags.includes(tag);
      case TargetType.Company:
        if (groupTags.includes(TargetType.Colleague)) {
          return false;
        }
        return groupTags.includes(newTag);
      default:
        return groupTags.includes(tag);
    }
  };

  const filterChats = (tag: string) => {
    const temps = orgCtrl.chats.filter((i) => i.isMyChat);
    return temps
      .filter((a) => tag === '全部' || specialDispose(tag, a.groupTags))
      .filter((i) => !(i.chatdata.lastMessage || i.chatdata.recently))
      .sort((a, b) => {
        var num = (b.chatdata.isToping ? 10 : 0) - (a.chatdata.isToping ? 10 : 0);
        if (num === 0) {
          if (b.chatdata.lastMsgTime == a.chatdata.lastMsgTime) {
            num = b.isBelongPerson ? 1 : -1;
          } else {
            num = b.chatdata.lastMsgTime > a.chatdata.lastMsgTime ? 5 : -5;
          }
        }
        return num;
      });
  };

  const contextMenu = (session: ISession | undefined) => {
    return {
      items: cleanMenus(loadFileMenus(session)) || [],
      onClick: ({ key }: { key: string }) => {
        command.emitter('executor', key, session);
      },
    };
  };

  const sessionOpen = (session: ISession | undefined) => {
    if (session) {
      session.chatdata.recently = true;
      session.cacheChatData().then((res) => {
        if (res) {
          onSelected(session);
        }
      });
    }
  };

  return (
    <DirectoryViewer
      extraTags={false}
      height={'calc(100% - 90px)'}
      initTags={['全部', '好友', '群组', '同事', '单位']}
      selectFiles={[]}
      content={chats}
      badgeCount={(tag) =>
        filterChats(tag)
          .map((i) => i.badgeCount ?? 0)
          .reduce((total, count) => total + count, 0)
      }
      currentTag={currentTag}
      tagChanged={(t) => setCurrentTag(t)}
      fileOpen={(entity) => sessionOpen(entity as ISession)}
      contextMenu={(entity) => contextMenu(entity as ISession)}
    />
  );
};
export default ChatSelect;

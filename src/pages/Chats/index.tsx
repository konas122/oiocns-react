import { Button, Dropdown, Spin, Image } from 'antd';
import React, { useEffect, useState, useRef } from 'react';
import orgCtrl from '@/ts/controller';
import { ISession } from '@/ts/core';
import DirectoryViewer from '@/components/Directory/views';
import { command } from '@/ts/base';
import { useFlagCmdEmitter } from '@/hooks/useCtrlUpdate';
import { cleanMenus } from '@/utils/tools';
import { loadFileMenus, operatesToMenus } from '@/executor/fileOperate';
import AppLayout from '@/components/MainLayout/appLayout';
import { personJoins } from '@/ts/core/public';
import SelectChat from './select';
import FullScreenModal from '@/components/Common/fullScreen';
import { TargetType } from '@/ts/core/public';

/** 沟通-通讯录 */
const ChatContent: React.FC = () => {
  const ref = useRef<string>('最近');
  const [selectOpen, setSelectOpen] = useState(false);
  const [chats, setChats] = useState<ISession[]>([]);
  const [focusFile, setFocusFile] = useState<ISession>();
  const [currentTag, setCurrentTag] = useState('最近');
  const [initLoad, setInitLoad] = useState(false);
  const [loaded] = useFlagCmdEmitter('session', () => {
    setChats(filterChats(ref.current));
  });
  useEffect(() => {
    const id = command.subscribe((type, cmd, ...args: any[]) => {
      if (type != 'session' || args.length < 1) return;
      switch (cmd) {
        case 'open':
          sessionOpen(args[0]);
          break;
      }
    });
    return () => {
      command.unsubscribe(id);
    };
  }, []);

  useEffect(() => {
    loadChats();
    ref.current = currentTag;
  }, [currentTag]);

  useEffect(() => {
    if (initLoad) {
      return;
    }
    if (chats.length) {
      sessionOpen(chats[0]);
      setInitLoad(true);
    }
  }, [chats]);

  const loadChats = () => {
    setChats(filterChats(currentTag));
  };
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
    return orgCtrl.chats
      .filter((a) => tag === '最近' || specialDispose(tag, a.groupTags))
      .filter((i) => i.chatdata.lastMessage || i.chatdata.recently)
      .sort((a, b) => {
        if (b.chatdata.lastMsgTime == a.chatdata.lastMsgTime) {
          return b.isBelongPerson ? 1 : -1;
        } else {
          return b.chatdata.lastMsgTime > a.chatdata.lastMsgTime ? 5 : -5;
        }
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
    if (session?.key !== focusFile?.key) {
      setFocusFile(session);
      command.emitter('preview', 'chat', session);
    }
  };

  const renderMore = () => {
    return (
      <Dropdown
        menu={{
          items: operatesToMenus(
            [
              ...personJoins.menus,
              {
                sort: 37,
                cmd: 'selectChat',
                label: '选择会话',
                iconType: 'selectChat',
              },
            ],
            orgCtrl.user,
          ),
          onClick: ({ key }: { key: string }) => {
            if (key === 'selectChat') {
              setSelectOpen(true);
            } else {
              command.emitter('executor', key, orgCtrl.user);
            }
          },
        }}
        dropdownRender={(menu) => (
          <div>{menu && <Button type="link">{menu}</Button>}</div>
        )}
        placement="bottom"
        trigger={['click', 'contextMenu']}>
        <div className="chat-leftBar-search_more">
          <Image
            preview={false}
            height={24}
            width={24}
            src={`/svg/operate/chatMore.svg?v=1.0.1`}
          />
        </div>
      </Dropdown>
    );
  };
  return (
    <AppLayout previewFlag={'chat'}>
      <Spin spinning={!loaded} tip={'加载中...'}>
        <div style={{ marginLeft: 10, padding: 2, fontSize: 18 }}>
          <span style={{ paddingLeft: 10 }}>沟通</span>
        </div>
        <DirectoryViewer
          isMenu
          extraTags={false}
          height={'calc(100% - 110px)'}
          initTags={['最近', '常用', '@我', '好友', '群组', '同事', '单位']}
          selectFiles={[]}
          focusFile={focusFile}
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
          rightBars={renderMore()}
        />
        {selectOpen && (
          <FullScreenModal
            open
            title={'选择会话'}
            onCancel={() => {
              setSelectOpen(false);
            }}
            destroyOnClose
            width={1000}
            bodyHeight={'75vh'}>
            <SelectChat
              onSelected={(chat: ISession) => {
                setCurrentTag('最近');
                setChats(filterChats(currentTag));
                setSelectOpen(false);
                sessionOpen(chat);
              }}
            />
          </FullScreenModal>
        )}
      </Spin>
    </AppLayout>
  );
};
export default ChatContent;

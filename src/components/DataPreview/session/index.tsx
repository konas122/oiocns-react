import React, { useEffect, useState } from 'react';
import { IFile, ISession, ITarget, TargetType } from '@/ts/core';
import { command } from '@/ts/base';
import Directory from '@/components/Directory';
import DirectoryViewer from '@/components/Directory/views';
import TargetActivity from '@/components/TargetActivity';
import { loadFileMenus } from '@/executor/fileOperate';
import ChatBody from './chat';
import PreviewLayout from '../layout';
import { cleanMenus } from '@/utils/tools';
import Setting from './setting';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { Spin } from 'antd';
const SessionBody = ({
  session,
  relation,
  height,
}: {
  height?: string;
  session: ISession;
  relation?: boolean;
}) => {
  const [actions, setActions] = useState<{ key: string; label: string }[]>([]);
  const [bodyType, setBodyType] = useState('');
  const [loaded] = useAsyncLoad(async () => {
    if (session.target.members.length < 30) {
      await session.target.loadMembers(false);
    }
  },[session]);
  useEffect(() => {
    const newActions = [
      {
        key: 'activity',
        label: '动态',
      },
    ];
    if (session.id === session.target.id) {
      newActions.push({
        key: 'store',
        label: '数据',
      });
      if (
        session.target.hasRelationAuth() ||
        session.target.typeName !== TargetType.Storage
      ) {
        newActions.push({
          key: 'relation',
          label: '关系',
        });
        if (relation) {
          setBodyType('relation');
        }
      }
    }
    if (
      session.isMyChat &&
      (session.target.typeName !== TargetType.Storage || session.target.hasRelationAuth())
    ) {
      newActions.unshift({
        key: 'chat',
        label: '沟通',
      });
      const hasHomeInPath = location.href.includes('home');
      if (hasHomeInPath || relation !== true) {
        setBodyType('chat');
      }
    }
    newActions.push({
      key: 'setting',
      label: '设置',
    });
    setBodyType((pre) => (pre === '' ? 'activity' : pre));
    setActions(newActions);
  }, [session]);

  const RenderMemberDirectory: React.FC<{ target: ITarget }> = ({ target }) => {
    const [filter, setFilter] = useState('');
    const [content, setContent] = useState<IFile[]>(target.memberDirectory.content());
    useEffect(() => {
      target.subscribe(() => setContent(target.memberDirectory.content()))
      return () => {
        if (filter && filter.length > 0) {
          target.loadMembers(false);
        }
      }
    }, [target, filter]);
    return (
      <Spin spinning={!loaded}>{loaded &&
        <DirectoryViewer
          extraTags={false}
          currentTag={'成员'}
          initTags={['成员']}
          selectFiles={[]}
          content={content}
          fileOpen={() => { }}
          contextMenu={(entity) => {
            const file = (entity as IFile) || target.memberDirectory;
            return {
              items: cleanMenus(loadFileMenus(file)) || [],
              onClick: ({ key }: { key: string }) => {
                if (key === 'joinFriend') {
                  command.emitter('executor', key, target);
                } else {
                  command.emitter('executor', key, file);
                }
              },
            };
          }}
          onScrollEnd={async () => {
            if (target.memberFilterCount > target.members.length) {
              await target.loadMembers(false, filter);
              setContent([...target.memberDirectory.content()])
            }
          }}
          onFilter={async (value) => {
            setFilter(value);
            await target.loadMembers(false, value);
            setContent([...target.memberDirectory.content()])
          }}
        />}</Spin>
    );
  };

  const loadContext = () => {
    switch (bodyType) {
      case 'chat':
        return <ChatBody key={session.target.key} chat={session} filter={''} />;
      case 'activity':
        return <TargetActivity height={760} activity={session.activity} />;
      case 'store':
        return <Directory key={session.target.key} root={session.target.directory} />;
      case 'relation':
        return <RenderMemberDirectory target={session.target} />;
      case 'setting': {
        return <Setting target={session.target} session={session} />;
      }
      default:
        return <></>;
    }
  };

  return (
    <PreviewLayout
      height={height}
      entity={session}
      actions={actions}
      selectKey={bodyType}
      onActionChanged={(key: string) => {
        setBodyType(key);
      }}
      number={session.target.memberCount}>
      {loadContext()}
    </PreviewLayout>
  );
};
export default SessionBody;

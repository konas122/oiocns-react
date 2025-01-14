import { schema } from '@/ts/base';
import { useEffect, useState } from 'react';
import ScrollList from '../ScrollList';
import React from 'react';
import { ITarget } from '@/ts/core';
import EntityIcon from '../GlobalComps/entityIcon';

interface IProps {
  target: ITarget;
  onClick: (item: schema.XTarget) => void;
  iconSize?: number;
  fontSize?: number;
}

export const MemberList: React.FC<IProps> = ({ target, onClick, fontSize, iconSize }) => {
  const [filter, setFilter] = useState('');
  const [members, setMembers] = useState<schema.XTarget[]>(
    target.members.filter((i) => i.id != target.userId),
  );
  useEffect(() => {
    loadMembers().then((res) => setMembers(res));
  }, [filter]);
  const loadMembers = async () => {
    if (target.memberCount === target.members.length) {
      return target.members
        .filter((i) => i.id != target.userId)
        .filter((i) => i.name.includes(filter) || i.code.includes(filter));
    } else {
      await target.loadMembers(false, filter);
      return target.members.filter((i) => i.id != target.userId);
    }
  };
  return (
    <div className="chat-at-list">
      <ScrollList
        loaded={true}
        height={'390px'}
        searchValue={filter}
        setSearchValue={(v) => setFilter(v)}
        data={members}
        onLoadMore={() => loadMembers().then((res) => setMembers(res))}
        renderItem={(item) => {
          return (
            <div
              key={item.id}
              className="chat-at-list-item"
              style={{ fontSize: `${fontSize ?? 16}px` }}
              onClick={() => onClick(item)}>
              <EntityIcon disableInfo entity={item} size={iconSize ?? 35} />
              <span>{item.name}</span>
            </div>
          );
        }}
      />
    </div>
  );
};

import { useState } from 'react';
import { List, Spin } from 'antd';
import SearchBar from '@/components/Directory/searchBar';
import React from 'react';

interface IProps<T> {
  data: T[];
  loaded: boolean;
  searchValue: string;
  height?: string;
  setSearchValue: (newValue: string) => void;
  renderItem: (item: T) => React.ReactNode;
  onLoadMore?: () => void;
}

const ScrollList = <T extends any>(props: IProps<T>) => {
  const [take, setTake] = useState(30);
  return (
    <div style={{ width: '100%' }}>
      <SearchBar
        value={props.searchValue}
        onValueChanged={(v) => props.setSearchValue(v)}
        menus={{}}
      />
      <div
        style={{ height: props.height ?? '100vh', overflow: 'auto', padding: 10 }}
        onScroll={(e) => {
          const target = e.currentTarget;
          if (target.scrollHeight - target.clientHeight <= target.scrollTop) {
            if (take + 30 > props.data.length && props.onLoadMore) {
              props.onLoadMore();
            }
            setTake((pre) => pre + 30);
          }
        }}>
        <Spin spinning={!props.loaded}>
          <List
            itemLayout="horizontal"
            dataSource={props.data.slice(0, take)}
            renderItem={props.renderItem}></List>
        </Spin>
      </div>
    </div>
  );
};

export default ScrollList;

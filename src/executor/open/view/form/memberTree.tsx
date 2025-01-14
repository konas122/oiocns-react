import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ITarget, IView } from '@/ts/core';
import { Input, Popover, Switch, Tree } from 'antd';
import cls from './index.module.less';
import { DeptItemType, getTreeDatas } from './treeDataUtils';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { MemberList } from '@/components/Common/SelectMember/memberSelector';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { CaretDownOutlined } from '@ant-design/icons';
interface MemberTreeType<T> {
  target: ITarget;
  searchType: 'tree' | 'members';
  form: IView;
  onSelectChanged(items: T[]): void;
}

const { Search } = Input;

const MemberTree = <T extends DeptItemType>({
  target,
  searchType,
  form,
  onSelectChanged,
}: MemberTreeType<T>) => {
  const [selectedTarget, setSelectedTarget] = useState<T>();
  const [isLinkChildren, setIsLinkChildren] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  if (
    (target.typeName === '单位' && form.viewType === 'work') ||
    searchType !== 'members'
  ) {
    return <div className={cls['page-title']}>{target.belong.name}</div>;
  }
  const [_loaded, dataSource] = useAsyncLoad(async () => {
    return await getTreeDatas<T>(target, form);
  });

  useEffect(() => {
    //默认选中
    if (dataSource && dataSource.length > 0) {
      setSelectedTarget(dataSource[0]);
      onSelectChanged([dataSource[0]]);
    }
  }, [dataSource]);

  const handleItemSelected = useCallback(
    (item: any) => {
      const { node, selected } = item;
      if (selected && node.key !== selectedTarget?.key) {
        const result: T[] = [node];
        if (isLinkChildren && node.hasItems) getSelectedNodes(node, result);
        setSelectedTarget(node);
        onSelectChanged(result);
      }
    },
    [isLinkChildren, onSelectChanged, selectedTarget],
  );

  const getSelectedNodes = useCallback((item: T, result: T[]) => {
    item.children.forEach((child: any) => {
      if (!child.disabled) result.push(child);
      if (child.hasItems) getSelectedNodes(child, result);
    });
  }, []);

  const titleRender = useCallback(
    (node: T) => (
      <div className={cls['tree-title-wrapper']}>
        <div className={cls['tree-title']}>
          <EntityIcon disableInfo entity={node.item} size={18} />
          {node.label}
        </div>
      </div>
    ),
    [],
  );
  const treeData = useMemo(() => {
    if (!searchValue) return dataSource ?? [];
    const result: T[] = [];
    const loop = (items: T[]) => {
      items.forEach((item) => {
        if (item.label.includes(searchValue)) result.push(item);
        if (item.children) loop(item.children as T[]);
      });
    };
    loop(dataSource as T[]);
    return result;
  }, [dataSource, searchValue]);

  const departList = () => (
    <div className={cls['tree-box']}>
      <div className="flex justify-between" style={{ paddingBottom: '10px' }}>
        <div className="flex-auto">关联子级:</div>
        <Switch size="small" onChange={setIsLinkChildren} />
      </div>
      <Search
        onSearch={setSearchValue}
        onChange={(e) => !e.target.value && setSearchValue('')}
        placeholder="请输入"
        enterButton
      />
      <Tree<T>
        fieldNames={{ title: 'label', key: 'key', children: 'children' }}
        treeData={treeData as any}
        titleRender={titleRender}
        expandedKeys={expandedKeys}
        height={400}
        onExpand={setExpandedKeys}
        selectedKeys={selectedKeys}
        onSelect={(keys, info) => {
          setSelectedKeys(keys);
          handleItemSelected(info);
        }}
      />
    </div>
  );
  const membersList = () => (
    <MemberList
      target={target}
      iconSize={25}
      fontSize={14}
      onClick={(item) => {
        if (item.id !== selectedTarget?.id) {
          onSelectChanged([item as any]);
          setSelectedTarget({
            id: item.id,
            key: item.id,
            name: item.name,
            label: item.name,
            item,
            typeName: '单位',
          } as any);
        }
      }}
    />
  );

  return (
    <Popover
      trigger="click"
      content={target.typeName === '组织群' ? membersList() : departList()}
      overlayStyle={{ paddingTop: 0 }}>
      <div className={cls['page-title']}>
        {selectedTarget?.item && (
          <EntityIcon disableInfo entity={selectedTarget.item} size={20} />
        )}
        {selectedTarget?.label}
        <CaretDownOutlined />
      </div>
    </Popover>
  );
};

export default React.memo(MemberTree);

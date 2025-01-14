import React, { useEffect, useState, useCallback } from 'react';
import { IDirectory } from '@/ts/core';
import { Spin, Tree } from 'antd';
import type { TreeProps } from 'antd';
import { IFormView } from '@/ts/core/thing/standard/view/formView';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { uniqBy } from 'lodash-es';
import { areArraysEqual } from './tools';
import { HeatMapOutlined } from '@ant-design/icons';
import { schema } from '@/ts/base';

interface SpeciesMenuProps {
  metaForm: IFormView;
  directory: IDirectory;
  searchType: string;
  isMemberView: boolean;
  setSelectSpecies: React.Dispatch<React.SetStateAction<SpeciesNode[]>>;
}

interface SpeciesNode {
  id: string;
  key: string;
  name: string;
  typeName: string;
  rootCode: string;
  children?: SpeciesNode[];
}

type SelectedNodesMap = Map<string, SpeciesNode | SpeciesNode[] | React.Key[]>;
const SpeciesMap: SelectedNodesMap = new Map<string, any>();
const SpeciesMenu: React.FC<SpeciesMenuProps> = ({
  metaForm,
  isMemberView,
  setSelectSpecies,
}) => {
  const [treeData, setTreeData] = useState<SpeciesNode[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<React.Key[]>([]);
  useEffect(() => {
    SpeciesMap.clear();
    const handleSubscription = (
      _key: string,
      flag: string,
      cmd: string,
      ...args: any[]
    ) => {
      if (flag !== 'view') return;
      if (cmd === 'treeLoading') {
        setLoading(args[0]);
      }
    };
    const subscriptionId = metaForm.subscribe(handleSubscription);
    loadInitialData();
    return () => metaForm.unsubscribe(subscriptionId);
  }, []);

  const loadInitialData = async () => {
    const data = await metaForm.loadSpeciesMenu();
    setTreeData(data);

    if (
      metaForm.organizationTree.length &&
      !metaForm.organizationTree[0].children.length
    ) {
      //TODO:仅一个单位时 默认选中
      const defaultItem = metaForm.organizationTree[0];
      SpeciesMap.set(defaultItem.rootCode, defaultItem);
      SpeciesMap.set('selectedKeys', [defaultItem.id]);
      setSelectedKeys([defaultItem.id]);
      handleSelectionChange();
    }
    //默认展开第一级
    if (
      metaForm.organizationTree.length &&
      metaForm.organizationTree[0].children.length
    ) {
      const defaultItem = metaForm.organizationTree[0];
      setDefaultExpandedKeys([defaultItem.id]);
    }
  };

  const treeTitleRender = useCallback(
    (node: SpeciesNode) => (
      <div className="flex">
        <EntityIcon
          entity={
            {
              ...node,
              typeName: node.typeName === '组织树' ? '单位' : node.typeName,
            } as unknown as schema.XEntity
          }
          size={13}
        />
        <span className="mgl4">{node.name}</span>
      </div>
    ),
    [],
  );

  const handleSelectionChange = () => {
    const allNodes: SpeciesNode[] = [];
    const _selectedKeys: React.Key[] =
      (SpeciesMap.get('selectedKeys') as React.Key[]) ?? [];
    SpeciesMap.forEach((value, _key) => {
      if (!Array.isArray(value)) {
        allNodes.push(value);
      } else if (_key == 'checkedNodes') {
        allNodes.push(...(value as SpeciesNode[]));
      }
    });
    const uniqueNodes = uniqBy(allNodes, 'id');
    // 排除重复code的选项--多分类支持功能（相同分类仅能选中一个）
    const filteredKeys = _selectedKeys.filter((key) =>
      uniqueNodes.some((node) => node.key === key),
    );
    setSelectedKeys(filteredKeys);

    //判断是否弹出变更
    const beforeNodes = (SpeciesMap.get('before') as SpeciesNode[]) || [];
    const hasChanges = !areArraysEqual(uniqueNodes, beforeNodes, {
      sortFn: (a: SpeciesNode, b: SpeciesNode) => Number(a.id) - Number(b.id),
      isEqual: (a: SpeciesNode, b: SpeciesNode) => a.id === b.id,
    });

    if (hasChanges) {
      SpeciesMap.set('before', uniqueNodes);
      setSelectSpecies(uniqueNodes);
    }
  };

  const handleSelect: TreeProps<any>['onSelect'] = (_selectedKeys, info) => {
    if (info.selected) {
      SpeciesMap.set(info.node.rootCode, info.node);
    } else {
      SpeciesMap.delete(info.node.rootCode);
    }
    SpeciesMap.set('selectedKeys', _selectedKeys);
    handleSelectionChange();
  };

  const handleCheck: TreeProps<any>['onCheck'] = (_checkedKeys, info) => {
    SpeciesMap.set('checkedNodes', info.checkedNodes);
    handleSelectionChange();
  };

  return (
    <Spin indicator={<HeatMapOutlined spin />} tip="数据加载中..." spinning={loading}>
      <div style={{ height: 'calc(100vh - 150px)', overflowY: 'auto' }}>
        {treeData.length > 0 && (
          <Tree<SpeciesNode>
            checkable={!isMemberView}
            multiple
            treeData={treeData}
            selectedKeys={selectedKeys}
            defaultExpandedKeys={defaultExpandedKeys}
            onSelect={handleSelect}
            titleRender={treeTitleRender}
            onCheck={handleCheck}
            style={{ backgroundColor: '#f3f3f3' }}
            fieldNames={{ title: 'name', key: 'id', children: 'children' }}
          />
        )}
      </div>
    </Spin>
  );
};

export default React.memo(
  SpeciesMenu,
  (prev, next) => prev.metaForm.id === next.metaForm.id,
);

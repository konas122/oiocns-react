import React, { ReactNode, useCallback, useReducer, useEffect, useMemo } from 'react';
import { AiOutlineAppstore, AiOutlineBorder } from 'react-icons/ai';
import cls from './ReportTree.module.less';
import { NodeType } from '@/ts/base/enum';
import { schema } from '@/utils/excel';
import { Tree } from 'antd';
import { ReportTaskTreeNodeView } from '@/ts/base/model';
import { getStatus, ReceptionStatus } from '@/ts/core/work/assign/reception/status';
import _ from 'lodash';
interface IProps<T extends schema.XReportTreeNode> {
  nodes: T[];
  onCheck?: (
    checked: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] },
    info: any,
  ) => void;
  onSelect?: (selectedKeys: React.Key[], info: any) => void;
  onExpand?: (expandedKeys: React.Key[]) => void;
  expandedKeys?: React.Key[];
  selectedKeys?: React.Key[];
  checkable?: boolean;
  renderNode?: (node: T) => ReactNode;
  loadChildren?: (parentNodeId: string) => Promise<T[]>;
  currentTag?: string;
  searchText?: string;
}

interface TreeState<T> {
  selectedKeys: React.Key[];
  expandedKeys: React.Key[];
  treeData: T[];
  filterTreeData: T[];
}

const initialState: TreeState<schema.XReportTreeNode> = {
  selectedKeys: [],
  expandedKeys: [],
  treeData: [],
  filterTreeData: [],
};

const treeReducer = <T extends schema.XReportTreeNode>(
  state: TreeState<T>,
  action: any,
): TreeState<T> => {
  switch (action.type) {
    case 'SET_SELECTED_KEYS':
      return { ...state, selectedKeys: action.payload };
    case 'SET_EXPANDED_KEYS':
      return { ...state, expandedKeys: action.payload };
    case 'SET_TREE_DATA':
      return { ...state, treeData: action.payload };
    case 'SET_FILTER_TREE_DATA':
      return { ...state, filterTreeData: action.payload };
    default:
      return state;
  }
};

function isMatchStatus(s: ReceptionStatus, currentTag: string | undefined) {
  if (currentTag === 'total') {
    return true;
  } else {
    if (currentTag == 'approving') {
      return s == 'submitted' || s == 'changed';
    } else if (currentTag == 'approved') {
      return s == 'finished' || s == 'rejected';
    } else {
      return s == currentTag;
    }
  }
}

const ReportTree = <T extends schema.XReportTreeNode = schema.XReportTreeNode>(
  props: IProps<T>,
) => {
  const [state, dispatch] = useReducer(treeReducer, initialState);
  const { selectedKeys, expandedKeys, treeData, filterTreeData } = state;

  const loopFilterTree = (data: ReportTaskTreeNodeView[], ids: string[]) => {
    const result: ReportTaskTreeNodeView[] = [];
    for (const item of data) {
      const newItem = { ...item };
      let s = getStatus(item.reception);

      let exsit = isMatchStatus(s, props.currentTag);
      if (exsit && item.reception?.instanceId) {
        ids.push(item.reception.instanceId);
      }
      if (!item.isLeaf) {
        const find = loopFilterTree(newItem.children ?? [], ids);
        if (props.searchText != null) {
          exsit = exsit && newItem.name.includes(props.searchText);
        }
        exsit = exsit || find.length > 0;
        newItem.children = find;
      } else {
        newItem.children = [];
        if (props.searchText != null) {
          exsit = exsit && newItem.name.includes(props.searchText);
        }
      }

      if (exsit) {
        result.push(newItem);
      }
    }
    return result;
  };

  useMemo(() => {
    const ids: string[] = [];
    // 分发树筛选
    // @ts-ignore
    dispatch({ type: 'SET_FILTER_TREE_DATA', payload: loopFilterTree(treeData, ids) });
  }, [props.currentTag, props.searchText, treeData]);

  // 更新树数据，避免树形结构被覆盖
  const updateTreeData = (nodes: T[], parentId: string, children: T[]): T[] => {
    return nodes.map((node) => {
      if (node.id === parentId) {
        return { ...node, children: children.length > 0 ? children : undefined };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeData(node.children as T[], parentId, children),
        };
      }
      return node;
    });
  };

  // 处理加载子节点的数据
  const loadTreeData = useCallback(
    async (node: T) => {
      if (props.loadChildren) {
        const children = await props.loadChildren(node.id);
        children.forEach((child) => {
          child.isLeaf = child.nodeType === NodeType.Normal;
        });
        // 更新树数据
        dispatch({
          type: 'SET_TREE_DATA',
          payload: updateTreeData(treeData as T[], node.id, children),
        });
      }
    },
    [props.loadChildren, treeData],
  );

  // 渲染节点图标
  const renderNodeIcon = (node: T) => {
    switch (node.nodeType) {
      case NodeType.Normal:
        return <AiOutlineBorder title={node.nodeTypeName} className={cls.nodeIcon} />;
      case NodeType.Summary:
      case NodeType.Balance:
        return <AiOutlineAppstore title={node.nodeTypeName} className={cls.nodeIcon} />;
      default:
        return <div />;
    }
  };

  // 处理树节点的展开
  const handleExpand = useCallback(
    (keys: React.Key[]) => {
      dispatch({ type: 'SET_EXPANDED_KEYS', payload: keys });
      props?.onExpand?.(keys);
    },
    [props.onExpand],
  );

  // 处理树节点的选择
  const handleSelect = (keys: React.Key[], info: any) => {
    dispatch({ type: 'SET_SELECTED_KEYS', payload: keys });
    props?.onSelect?.(keys, info);
    const node = info.node as T;
    if (props.loadChildren && node) {
      loadTreeData(node);
    }
  };

  // 渲染树节点的标题
  const treeTitleRender = (node: T) => (
    <div className={cls['tree-title-wrapper']}>
      <div className={cls['tree-title-icon']}>{renderNodeIcon(node)}</div>
      <div className={cls['tree-title']}>{props.renderNode?.(node) ?? node.name}</div>
    </div>
  );

  // 更新树数据
  useEffect(() => {
    dispatch({ type: 'SET_TREE_DATA', payload: props.nodes });
  }, [props.nodes]);

  return (
    <Tree<T>
      fieldNames={{ title: 'name', key: 'id', children: 'children' }}
      treeData={
        (props.currentTag || props.searchText) &&
        (props.currentTag != 'total' || props.searchText != '')
          ? (filterTreeData as T[])
          : (treeData as T[])
      }
      titleRender={treeTitleRender}
      expandedKeys={expandedKeys}
      onExpand={handleExpand}
      selectedKeys={selectedKeys}
      onSelect={handleSelect}
      loadData={loadTreeData}
      className={cls['tree-container']}
      checkable={props.checkable ? props.checkable : false}
      onCheck={props.onCheck}
    />
  );
};

export default ReportTree;

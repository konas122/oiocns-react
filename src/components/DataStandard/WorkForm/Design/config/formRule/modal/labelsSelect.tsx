import FullScreenModal from '@/components/Common/fullScreen';
import { FieldModel, FiledLookup, TreeNodeType } from '@/ts/base/model';
import { IBelong } from '@/ts/core';
import React, { useEffect, useState, useMemo } from 'react';
import { Tabs, Tree, Table, Input, Spin } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import { ClassifyTree } from '@/ts/core/thing/classifyTree';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import './index.less';
const { Search } = Input;

interface IProps {
  current: IBelong;
  extendTags?: string[];
  tagsValue: FiledLookup[];
  speciesFields: FieldModel[];
  onOk: (value: FiledLookup[]) => void;
  onCancel: () => void;
}

interface ILabelsTreeProps {
  typeName?: string;
  treeData: any[];
  tabKey: string;
  selected: any[];
  onSelectionChanged: Function;
}

export const LabelsTree = (props: ILabelsTreeProps) => {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [selected, setSelected] = useState(props.selected ?? []);
  const [defaultData, setDefaultData] = useState<DataNode[]>(props.treeData ?? []);
  const dataList: { key: React.Key; title: string }[] = [];
  let treeTimer: any = null;

  useEffect(() => {
    setSelected(props.selected);
  }, [props.selected]);

  const generateList = (data: DataNode[]) => {
    for (let i = 0; i < data?.length; i++) {
      const node: DataNode = data[i];
      dataList.push(node);
      if (node.children) {
        generateList(node.children);
      }
    }
  };
  generateList(props.treeData);

  const onExpand = (newExpandedKeys: React.Key[]) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };
  const onCheck: TreeProps['onCheck'] = (_checkedKeys, e: any) => {
    props.onSelectionChanged(
      props.tabKey,
      e.checkedNodes.map((it: { text: string }) => {
        return { ...it, title: it.text };
      }),
    );
  };

  const getParentKey = (key: React.Key, tree: DataNode[]): React.Key => {
    let parentKey: React.Key;
    for (let i = 0; i < tree.length; i++) {
      const node = tree[i];
      if (node.children) {
        if (node.children.some((item) => item.key === key)) {
          parentKey = node.key;
        } else if (getParentKey(key, node.children)) {
          parentKey = getParentKey(key, node.children);
        }
      }
    }
    return parentKey!;
  };

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (treeTimer) clearTimeout(treeTimer);
    treeTimer = setTimeout(() => {
      const newExpandedKeys = dataList
        .map((item) => {
          if (item.title.indexOf(value) > -1) {
            return getParentKey(item.key, defaultData);
          }
          return null;
        })
        .filter((item, i, self) => item && self.indexOf(item) === i);
      setExpandedKeys(newExpandedKeys as React.Key[]);
      setSearchValue(value);
      setAutoExpandParent(true);
    }, 300);
  };

  const treeData = useMemo(() => {
    const loop = (data: DataNode[]): DataNode[] =>
      data.map((item) => {
        const strTitle = item.title as string;
        const index = strTitle.indexOf(searchValue);
        const beforeStr = strTitle.substring(0, index);
        const afterStr = strTitle.slice(index + searchValue.length);
        const title =
          index > -1 ? (
            <span>
              {beforeStr}
              <span className="site-tree-search-value">{searchValue}</span>
              {afterStr}
            </span>
          ) : (
            <span>{strTitle}</span>
          );
        if (item.children) {
          return { ...item, title, key: item.key, children: loop(item.children) };
        }
        return { ...item, title, key: item.key };
      });

    return loop(defaultData);
  }, [searchValue]);
  return (
    <>
      {props.treeData.length === 0 && (
        <div style={{ color: '#696969', fontSize: '14px', textAlign: 'center' }}>
          暂无数据
        </div>
      )}
      {props.treeData.length > 0 && (
        <>
          <Search
            style={{ marginBottom: 8 }}
            placeholder="搜索"
            onChange={onSearchChange}
          />
          <div style={{ height: 'calc(72vh - 140px)', overflow: 'scroll' }}>
            <Tree
              checkable
              onExpand={onExpand}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
              checkedKeys={selected.map((i) => i.id)}
              checkStrictly={true}
              onCheck={onCheck}
              treeData={treeData}
            />
          </div>
        </>
      )}
    </>
  );
};

/** 标签选择器 */
const LabelsSelect: React.FC<IProps> = (props) => {
  const classify = new ClassifyTree(props.current);
  const [selected, setSelected] = useState<TreeNodeType[]>([]);
  const [loaded, formTree] = useAsyncLoad(async () => {
    return classify.createFormTree(props.extendTags ?? [], 'tab2');
  });
  useEffect(() => {
    const arr = JSON.parse(JSON.stringify(props.tagsValue ?? []));
    props.speciesFields.forEach((it) => {
      (it.lookups ?? []).forEach((item) => {
        const inx = arr.findIndex((i: { id: string }) => i.id == item.id);
        if (inx != -1) {
          arr[inx] = { ...arr[inx], key: item.id, title: item.text, tabKey: it.id };
        }
      });
    });
    setSelected(arr);
  }, [props.tagsValue]);

  const getTabItems = () => {
    let tabsItems = [];
    const speciesTree = classify.createSpeciesTree(
      JSON.parse(JSON.stringify(props.speciesFields)),
    );
    speciesTree.forEach((it) => {
      tabsItems.push({
        label: it.label,
        key: it.key,
        disabled: false,
        children: (
          <LabelsTree
            tabKey={it.key}
            typeName="分类"
            treeData={it.data}
            selected={selected}
            onSelectionChanged={onSelectionChanged}
          />
        ),
      });
    });
    // const formTree = classify.createFormTree(props.extendTags ?? [], 'tab2');
    if (
      props.extendTags?.includes('表单') ||
      props.extendTags?.includes('报表') ||
      props.extendTags?.includes('字典')
    ) {
      tabsItems.push({
        label:
          (props.extendTags?.includes('表单') ? '表单' : '') +
          (props.extendTags?.includes('报表') ? '报表' : '') +
          (props.extendTags?.includes('字典') ? '字典' : ''),
        key: 'tab2',
        disabled: false,
        children: (
          <>
            {loaded ? (
              <LabelsTree
                tabKey="tab2"
                treeData={formTree || []}
                selected={selected}
                onSelectionChanged={onSelectionChanged}
              />
            ) : (
              <Spin />
            )}
          </>
        ),
      });
    }

    const persons = classify.createDepartmentPersonsTree(props.extendTags ?? [], 'tab3');
    if (props.extendTags?.includes('部门') || props.extendTags?.includes('人员')) {
      tabsItems.push({
        label:
          (props.extendTags?.includes('部门') ? '部门' : '') +
          (props.extendTags?.includes('人员') ? '人员' : ''),
        key: 'tab3',
        disabled: false,
        children: (
          <LabelsTree
            tabKey="tab3"
            treeData={persons}
            selected={selected}
            onSelectionChanged={onSelectionChanged}
          />
        ),
      });
    }
    return tabsItems;
  };

  const onSelectionChanged = (key: string, checkedNodes: any[]) => {
    setSelected((before: any[]) => {
      var after = before.filter((i) => i.tabKey !== key);
      after.push(...checkedNodes);
      return after;
    });
  };

  const columns = [
    { title: '名称', dataIndex: 'title', key: 'title' },
    { title: 'ID', dataIndex: 'key', key: 'key' },
    {
      title: '操作',
      dataIndex: '',
      key: 'x',
      render: (e: { id: any }) => (
        <a
          onClick={() => {
            setSelected((before: any[]) => {
              var after = before.filter((i: { id: any }) => i.id !== e.id);
              return after;
            });
          }}>
          删除
        </a>
      ),
    },
  ];

  const loadVaildSelect = () => {
    return selected
      .filter((i: TreeNodeType) =>
        selected.every((v: TreeNodeType) => v.id != i.parentId),
      )
      .map((i: any) => {
        let obj = { ...i };
        if (obj.children) {
          delete obj['children'];
        }
        return obj;
      });
  };

  return (
    <FullScreenModal
      open
      hideMaxed
      title={'请选择分类标签'}
      onCancel={props.onCancel}
      destroyOnClose
      width={1200}
      onSave={() => {
        props.onOk(loadVaildSelect());
      }}
      bodyHeight={'72vh'}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          padding: 9,
          gap: 10,
        }}>
        <div style={{ width: 0, flex: 1, overflow: 'auto' }}>
          <Tabs defaultActiveKey="1" tabPosition="top" items={getTabItems()} />
        </div>
        <div style={{ width: 0, flex: 1, overflow: 'auto' }}>
          <Table dataSource={loadVaildSelect()} columns={columns} />
        </div>
      </div>
    </FullScreenModal>
  );
};

export default LabelsSelect;

import { schema } from '@/ts/base';
import { generateUuid } from '@/ts/base/common';
import { SelectBox, DropDownBox, Button } from 'devextreme-react';
import TreeView, { TreeViewTypes } from 'devextreme-react/tree-view';
import { ISelectBoxOptions } from 'devextreme-react/select-box';
import React, { useEffect, useState, createRef } from 'react';
import FullScreenModal from '@/components/Common/fullScreen';
import { DisplayType } from '@/utils/work';
import { Button as AntButton } from 'antd';
import { ClassifyTree } from '@/ts/core/thing/classifyTree';
import { IBelong } from '@/ts/core';

interface TreeSelectItemProps extends ISelectBoxOptions {
  speciesItems: schema.XSpeciesItem[];
  displayType?: number | undefined;
  isSelectLastLevel?: boolean;
  isNoNeedFilterData?: boolean;
  bindNode?: string;
}

const TreeSelectItem: React.FC<TreeSelectItemProps> = (props) => {
  const [selectValues, setSelectValues] = useState<string[]>([]);
  const [dataSourceArray, setDataSourceArray] = useState<schema.XSpeciesItem[][]>([]);
  const [treeBoxValue, setTreeBoxValue] = useState([]);
  const [textBoxValue, setTextBoxValue] = useState([]);
  const treeViewRef = createRef<TreeView<any>>();
  const [modalFlag, setModalFlag] = useState(false);
  const filterChildrenItems = (id?: string) => {
    return props.speciesItems.filter((i) => id === i.parentId);
  };
  useEffect(() => {
    const newItems = [filterChildrenItems()];
    for (const item of selectValues) {
      newItems.push(filterChildrenItems(item));
    }
    setDataSourceArray(newItems.filter((i) => i.length > 0));
  }, [props, selectValues]);
  const loopTreeViewSelectKes: any = (node: TreeViewTypes.Item, keys: string[]) => {
    if (node.parent === null) {
      keys.unshift(node.itemData.id);
      return keys;
    } else {
      return loopTreeViewSelectKes(node.parent, [node.itemData.id, ...keys]);
    }
  };
  useEffect(() => {
    setTextBoxValue([]);
    setTreeBoxValue([]);
    setSelectValues([]);
  }, [props.displayType]);
  const customTreeView = () => {
    const classify = new ClassifyTree({} as IBelong)
    const arr = classify.resetSpeciesData(props.speciesItems ?? []);

    const childrenMap: Dictionary<string[]> = {};
    for (const item of arr) {
      if (!childrenMap[item.parentId]) {
        childrenMap[item.parentId] = [];
      }
      childrenMap[item.parentId].push(item.id);
    }

    const allSpecies = arr.map(it => {
      let item: any = {
        ...it,
        // hasItems: arr.findIndex(item => item.parentId === it.id) != -1
        hasItems: childrenMap[it.id]?.length > 0
      };
      if(!props.isSelectLastLevel){
        item['disabledClick'] = item.hasItems;
      }
      return item;
    });

    const getTreeData = () => {
      if(!props.isNoNeedFilterData && props.bindNode){
        const targetNodeList = classify.filterDataByIdOrValue('value', props.bindNode, allSpecies);
        const result = (targetNodeList ?? []).map(it => {
          const _item = { ...it };
          if(_item.value === props.bindNode) _item['parentId'] = null;
          return _item;
        })
        return result;
      }
      return allSpecies ?? [];
    }
    const speciesItems = getTreeData();
    const createChildren = (node: TreeViewTypes.Node) => {
      return new Promise((resolve, reject) => {
        let result = [];
        if(node){
          result = speciesItems.filter(it => it.parentId == node.key);
        } else {
          result = speciesItems.filter(it => !it.parentId);
        }
        resolve(result)
      });
    }

    const itemRenderFn = (item: schema.XSpeciesItem & { disabledClick: boolean; valueList: [] }) => {
      let disabled = false;
      if(!props.isSelectLastLevel){
        disabled = item.disabledClick;
      }
      return (
        <AntButton type="text" style={{'width': '100%', 'textAlign': 'left'}}  disabled={disabled} onClick={() => {
            if (!disabled) {
              setTreeBoxValue(item.valueList);
            }
          }}>
          {item.name}
        </AntButton>
      )
    }

    return (
      <>
        <TreeView
          ref={treeViewRef}
          dataStructure="plain"
          dataSource={speciesItems.filter(it => !it.parentId)}
          createChildren={createChildren}
          expandNodesRecursive={false}
          keyExpr="id"
          parentIdExpr="parentId"
          selectionMode="single"
          selectNodesRecursive={false}
          displayExpr="name"
          selectByClick={true}
          searchEnabled
          itemRender={itemRenderFn}
          
        />
      </>
    );
  };
  const onFocunInHandle = () => {
    setModalFlag(props.readOnly ? false : true);
  };
  const handleSaveSelectData = () => {
    setTextBoxValue(treeBoxValue);
    setModalFlag(false);
  };
  const closeModal = () => {
    treeViewRef.current?.instance.unselectAll();
    setModalFlag(false);
  };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        gap: 10,
      }}>
      {props.displayType === DisplayType.CASCADE &&
        dataSourceArray.map((items, index) => {
          return (
            <SelectBox
              key={generateUuid()}
              {...props}
              searchEnabled
              searchMode="contains"
              searchExpr={'name'}
              dataSource={items}
              displayExpr={'name'}
              valueExpr={'id'}
              onValueChanged={(e) => {
                if (e.value === null && selectValues[index]) {
                  setSelectValues([...selectValues.slice(0, index)]);
                }
              }}
              value={selectValues[index]}
              label={`${props.label}-第${index + 1}级`}
              onItemClick={(item) => {
                setSelectValues([...selectValues.slice(0, index), item.itemData.id]);
              }}
            />
          );
        })}
      {(props.displayType === DisplayType.TREE || !props.displayType) && (
        <DropDownBox
          {...props}
          value={treeBoxValue}
          displayExpr={'name'}
          valueExpr={'value'}
          dataSource={props.speciesItems}
          displayValueFormatter={(value: any) => {
            return Array.isArray(value) ? value.join('/') : value;
          }}
          onValueChanged={(e) => {
            if (e.value === null) {
              setTreeBoxValue([]);
              treeViewRef.current?.instance.unselectAll();
            }
          }}
          contentRender={() => customTreeView()}
        />
      )}
      {props.displayType === DisplayType.POPUP && (
        <DropDownBox
          {...props}
          value={textBoxValue}
          displayExpr={'name'}
          valueExpr={'value'}
          dataSource={props.speciesItems}
          onFocusIn={() => onFocunInHandle()}
          disabled={modalFlag}
          opened={false}
          showDropDownButton={false}
          onOpened={() => {
            return <></>;
          }}
          displayValueFormatter={(value: any) => {
            return Array.isArray(value) ? value.join('/') : value;
          }}
          onValueChanged={(e) => {
            if (e.value === null) {
              setTextBoxValue([]);
              treeViewRef.current?.instance.unselectAll();
            }
          }}
        />
      )}
      <FullScreenModal
        open={modalFlag}
        title={'请选择'}
        width={'40vw'}
        bodyHeight={'70vh'}
        onCancel={closeModal}
        footer={
          <Button type="default" onClick={handleSaveSelectData}>
            确认保存
          </Button>
        }>
        {customTreeView()}
      </FullScreenModal>
    </div>
  );
};

export default TreeSelectItem;

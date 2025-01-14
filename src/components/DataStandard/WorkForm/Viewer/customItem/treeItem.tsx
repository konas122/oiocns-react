import { model } from '@/ts/base';
import { generateUuid } from '@/ts/base/common';
import { SelectBox, DropDownBox } from 'devextreme-react';
import { ISelectBoxOptions } from 'devextreme-react/select-box';
import React, { useEffect, useState, createRef, useCallback } from 'react';
import TreeView from 'devextreme-react/tree-view';
import { DropDownBoxTypes } from 'devextreme-react/drop-down-box';
import { DisplayType } from '@/utils/work';
import { Button as AntButton } from 'antd';
import { ClassifyTree } from '@/ts/core/thing/classifyTree';
import { IBelong } from '@/ts/core';

interface TreeSelectItemProps extends ISelectBoxOptions {
  flexWrap: 'nowrap' | 'wrap';
  speciesItems: model.FiledLookup[];
  displayType?: number | undefined;
  isSelectLastLevel?: boolean;
  isNoNeedFilterData?: boolean;
  bindNode?: string;
  isDefaultValue?: boolean;
}

const TreeSelectItem: React.FC<TreeSelectItemProps> = (props) => {
  const [selectValues, setSelectValues] = useState<string[]>([]);
  const [loadValue, setLoadValue] = useState<boolean>(false);
  const [dataSourceArray, setDataSourceArray] = useState<model.FiledLookup[][]>([]);
  const treeViewRef = createRef<TreeView<any>>();
  const [treeBoxValue, setTreeBoxValue] = useState<string[]>([]);
  const [textBoxValue, setTextBoxValue] = useState<string[]>([]);
  const [isTreeBoxOpened, setIsTreeBoxOpened] = useState(false);
  const filterChildrenItems = (id?: string) => {
    return props.speciesItems.filter((i) => id === i.parentId);
  };
  const loopFullValues = (initValues: string[], id?: string) => {
    if (id && id.length > 0) {
      const item = props.speciesItems.find((i) => i.id === id);
      if (item) {
        initValues.splice(0, 0, item.value);
        loopFullValues(initValues, item.parentId);
      }
    }
  };
  useEffect(() => {
    const initValues: string[] = [];
    if (props.value && props.value.length > 0) {
      const item = props.speciesItems.find((i) => i.value === props.value);
      if (item) {
        initValues.push(item.value);
        loopFullValues(initValues, item.parentId);
      }
    } else {
      if (props.isDefaultValue && props.defaultValue) {
        const item = props.speciesItems.find((i) => i.value === props.defaultValue);
        if (item) {
          initValues.push(item.value);
          loopFullValues(initValues, item.parentId);
        }
      }
    }
    setSelectValues(initValues);
    setTreeBoxValue(initValues);
    if (initValues.length > 0) {
      setTextBoxValue(initValues);
    }
    setLoadValue(true);
  }, [props.value]);

  useEffect(() => {
    if (props.displayType === DisplayType.CASCADE) {
      if (loadValue) {
        const newItems = [filterChildrenItems()];
        for (const item of selectValues) {
          const id = props.speciesItems.find((i) => i.value === item)?.id ?? item;
          newItems.push(filterChildrenItems(id));
        }
        setDataSourceArray(newItems.filter((i) => i.length > 0));
        !props.readOnly &&
          props.onValueChanged?.apply(this, [{ value: selectValues.at(-1) } as any]);
      }
    }
  }, [props, selectValues]);

  const customTreeView = useCallback(() => {
    const classify = new ClassifyTree({} as IBelong);
    const arr = classify.resetSpeciesData(props.speciesItems ?? []);
    const childrenMap: Dictionary<string[]> = {};
    for (const item of arr) {
      if (!childrenMap[item.parentId]) {
        childrenMap[item.parentId] = [];
      }
      childrenMap[item.parentId].push(item.id);
    }

    const allSpecies = arr.map((it) => {
      let item: any = {
        ...it,
        // hasItems: arr.findIndex(item => item.parentId === it.id) != -1
        hasItems: childrenMap[it.id]?.length > 0,
      };
      if (!props.isSelectLastLevel) {
        item['disabledClick'] = item.hasItems;
      }
      return item;
    });
    const getTreeData = () => {
      if (!props.isNoNeedFilterData && props.bindNode) {
        const targetNodeList = classify.filterDataByIdOrValue(
          'value',
          props.bindNode,
          allSpecies,
        );
        const result = (targetNodeList ?? []).map((it) => {
          const _item = { ...it };
          if (_item.value === props.bindNode) _item['parentId'] = null;
          return _item;
        });
        return result;
      }
      return allSpecies ?? [];
    };
    const speciesItems = getTreeData();

    const itemRenderFn = (
      item: model.FiledLookup & { disabledClick: boolean; valueList: [] },
    ) => {
      let disabled = false;
      if (!props.isSelectLastLevel) {
        disabled = item.disabledClick;
      }
      return (
        <AntButton
          style={{ width: '100%', textAlign: 'left' }}
          type="text"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setTreeBoxValue(item.valueList);
              !props.readOnly &&
                props.speciesItems.length &&
                props.onValueChange?.apply(this, [
                  { value: item.valueList.at(-1) ?? '' },
                ]);
              if (props.displayType === DisplayType.TREE || !props.displayType) {
                setIsTreeBoxOpened(false);
              }
            }
          }}>
          {item.text}
        </AntButton>
      );
    };

    return (
      <TreeView
        ref={treeViewRef}
        dataStructure="plain"
        dataSource={speciesItems}
        expandNodesRecursive={false}
        keyExpr="id"
        parentIdExpr="parentId"
        searchExpr="text"
        searchMode="contains"
        selectionMode="single"
        displayExpr="text"
        selectByClick={true}
        searchEnabled={true}
        itemRender={itemRenderFn}
      />
    );
  }, [props.speciesItems]);
  const onTreeBoxOpened = useCallback((e: DropDownBoxTypes.OptionChangedEvent) => {
    if (e.name === 'opened') {
      setIsTreeBoxOpened(e.value);
    }
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: props.flexWrap,
        gap: 10,
        width: (props.displayType === DisplayType.CASCADE
          ? '100%'
          : props.width) as string,
      }}>
      {props.displayType === DisplayType.CASCADE &&
        dataSourceArray.map((items, index) => {
          return (
            <SelectBox
              key={generateUuid()}
              {...props}
              width={'100%'}
              searchEnabled
              searchMode="contains"
              searchExpr={'text'}
              dataSource={items}
              displayExpr={'text'}
              valueExpr={'value'}
              onValueChanged={(e) => {
                if (e.value === null && selectValues[index]) {
                  setSelectValues([...selectValues.slice(0, index)]);
                }
              }}
              value={selectValues[index]}
              label={`${props.label}-第${index + 1}级`}
              onItemClick={(item) => {
                setSelectValues([...selectValues.slice(0, index), item.itemData.value]);
              }}
            />
          );
        })}
      {(props.displayType === DisplayType.TREE || !props.displayType) && (
        <DropDownBox
          {...props}
          width={'100%'}
          value={treeBoxValue}
          displayExpr={'text'}
          displayValueFormatter={(value: any) => {
            return Array.isArray(value) ? value.join('/') : value;
          }}
          valueExpr={'value'}
          dataSource={props.speciesItems}
          opened={isTreeBoxOpened}
          onValueChanged={(e) => {
            const value_ = e.value;
            const newValue = value_ && value_.length ? value_.at(-1) : undefined;
            props.onValueChanged?.apply(this, [
              {
                ...e,
                value: newValue,
              },
            ]);
            if (e.value === null) {
              setTreeBoxValue([]);
              treeViewRef.current?.instance.unselectAll();
              props.onValueChange?.apply(this, [
                {
                  ...e,
                  value: newValue,
                },
              ]);
            }
          }}
          onOptionChanged={onTreeBoxOpened}
          contentRender={() => {
            return isTreeBoxOpened ? customTreeView() : <></>;
          }}
        />
      )}
    </div>
  );
};

export default TreeSelectItem;

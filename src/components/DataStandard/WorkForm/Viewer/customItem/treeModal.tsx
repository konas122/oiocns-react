import { schema } from '@/ts/base';
import { TextBox, TreeView, Button } from 'devextreme-react';
import { ISelectBoxOptions } from 'devextreme-react/select-box';
import React, { createRef, useEffect, useState } from 'react';
import FullScreenModal from '@/components/Common/fullScreen';
import { TreeViewTypes } from 'devextreme-react/cjs/tree-view';
import { IDirectory, IForm } from '@/ts/core';
import { Form } from '@/ts/core/thing/standard/form';
import { Button as AntButton } from 'antd';
import cls from './index.module.less';

interface TreeModalProps extends ISelectBoxOptions {
  flexWrap: 'nowrap' | 'wrap';
  displayType?: number | undefined;
  isSelectLastLevel?: boolean;
  isNoNeedFilterData?: boolean;
  bindNode?: string;
  isDefaultValue?: boolean;
  metadata: schema.XForm;
  directory: IDirectory;
  attribute: schema.XAttribute;
  onValuesChange?: (field: string, value: any) => void;
}

const TreeModal: React.FC<TreeModalProps> = (props) => {
  const [modalFlag, setModalFlag] = useState<boolean>(false);
  const [textBoxValue, setTextBoxValue] = useState<string>('');
  const [treeBoxValue, setTreeBoxValue] = useState<string>('');
  const [bindNodeValue, setBindNodeValue] = useState<string[]>([]);
  const treeViewRef = createRef<TreeView<any>>();
  const metaForm: IForm = new Form(props.metadata, props.directory);

  useEffect(() => {
    let value = props.value;
    if (value && value.charAt(0) === 'S') {
      value = value.slice(1);
      getAllParentsByValue(value, 'value');
    }
    let bindNode = props.bindNode;
    if (bindNode && bindNode.charAt(0) === 'S') {
      bindNode = bindNode.slice(1);
      getAllParentsByValue(bindNode, 'node');
    }
  }, [props.value, props.bindNode]);

  const getWidthValue = () => {
    return typeof props.width === 'number' ? `${props.width}px` : String(props.width);
  };

  const handleSaveSelectData = () => {
    getAllParentsByValue(treeBoxValue, 'value');
    props.onValuesChange?.apply(this, [props.attribute.id, 'S' + treeBoxValue]);
    setModalFlag(false);
  };

  const getAllParentsByValue = async (value: string, type: string) => {
    const data = await metaForm.loadAllParents([props.attribute.speciesId as any], value);
    if (type === 'value') {
      let result = data.map((item) => {
        return item.name;
      });
      setTextBoxValue(result.join('/'));
    } else {
      const ids = data.map((item) => {
        return 'S' + item.id;
      });
      setBindNodeValue(ids);
    }
  };

  const areArraysConsistent = (arr1: string[], bindNode: any[]) => {
    if (bindNode) {
      if (arr1.length > bindNode.length) {
        [arr1, bindNode] = [bindNode, arr1];
      }
      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== bindNode[i]) {
          return false;
        }
      }
      return true;
    } else {
      return true;
    }
  };

  const customTreeView = () => {
    const getItem = async (fileds: any) => {
      const arr = fileds.map((filed: any) => {
        return filed.id;
      });
      const items = await metaForm.loadItemsByParentId(
        [props.attribute.speciesId as any],
        arr,
      );
      return items;
    };

    const getChildren = async (node: TreeViewTypes.Node) => {
      let result: any[] = [],
        children: any[] = [],
        items: any[] = [];
      if (node) {
        children = await metaForm.loadItemsByParentId(
          [node.itemData?.item.speciesId],
          [node.key],
        );
        items = await getItem(children);
      } else {
        children = await metaForm.loadItemsByParentId(
          [props.attribute.speciesId as string],
          [undefined],
        );
        children.forEach((item) => {
          item.valueList = ['S' + item.id];
        });
        items = await getItem(children);
      }
      for (const filed of children) {
        let arr: any[] = [];
        items.forEach((item: any) => {
          if (item.parentId === filed.id) {
            const newFiled: any = item;
            newFiled.value = 'S' + newFiled.id;
            arr.push({
              key: item.id,
              item: newFiled,
              label: item.name,
              parentId: item.parentId,
              hasItems: false,
              disabledClick: false,
              children: [],
            });
          }
        });
        let newFiled = filed;
        newFiled.value = 'S' + newFiled.id;
        if (node) {
          const valueList = node.itemData?.item?.valueList;
          newFiled.valueList = [...valueList, 'S' + newFiled.id];
        }
        if (areArraysConsistent(filed.valueList, bindNodeValue)) {
          result.push({
            key: filed.id,
            item: newFiled,
            label: filed.name,
            parentId: node ? node.key : undefined,
            hasItems: arr.length > 0 ? true : false,
            disabledClick: arr.length > 0 ? true : false,
            children: arr,
          });
        }
      }
      return result;
    };

    const createChildren = async (node: TreeViewTypes.Node) => {
      let result: any[] = [];
      result = await getChildren(node);
      return result;
    };

    const itemRenderFn = (item: any) => {
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
              setTreeBoxValue(item?.key);
            }
          }}>
          {item.label}
        </AntButton>
      );
    };

    return (
      <div style={{ height: '100%', overflow: 'auto' }}>
        <TreeView
          className={cls.treeView}
          ref={treeViewRef}
          dataStructure="plain"
          expandNodesRecursive={false}
          createChildren={createChildren}
          keyExpr="key"
          parentIdExpr="parentId"
          selectionMode="single"
          selectNodesRecursive={false}
          displayExpr="label"
          selectByClick={true}
          searchEnabled
          itemRender={itemRenderFn}
          // onItemClick={(item) => {
          //   setTreeBoxValue(item.node?.key);
          // }}
        />
      </div>
    );
  };

  return (
    <>
      <div
        onClick={() => {
          !props.readOnly ? setModalFlag(true) : '';
        }}
        style={{ width: getWidthValue() }}>
        <TextBox
          value={textBoxValue}
          width={'100%'}
          height={props.height}
          label={props.label}
          labelMode={props.labelMode}
          readOnly={props.readOnly}
          isValid={props.isValid}
        />
      </div>
      <FullScreenModal
        open={modalFlag}
        title={'请选择'}
        width={'40vw'}
        bodyHeight={'70vh'}
        onCancel={() => setModalFlag(false)}
        footer={
          <Button type="default" onClick={handleSaveSelectData}>
            确认保存
          </Button>
        }>
        {customTreeView()}
      </FullScreenModal>
    </>
  );
};

export default TreeModal;

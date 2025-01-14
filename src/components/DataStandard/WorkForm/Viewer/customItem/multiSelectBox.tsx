import { model } from '@/ts/base';
import { TreeView } from 'devextreme-react';
import DropDownBox, {
  DropDownBoxTypes,
  IDropDownBoxOptions,
} from 'devextreme-react/drop-down-box';
import React, { createRef, useCallback } from 'react';

interface MultiSelectProps extends IDropDownBoxOptions {
  field: model.FieldModel;
}

export const MultiSelectBox: React.FC<MultiSelectProps> = (props) => {
  const treeViewRef = createRef<TreeView<any>>();
  const syncTreeViewSelection = useCallback(
    (e: DropDownBoxTypes.ValueChangedEvent | any) => {
      const treeView =
        (e.component.selectItem && e.component) ||
        (treeViewRef.current && treeViewRef.current.instance);
      if (treeView) {
        if (e.value === null) {
          treeView.unselectAll();
        } else {
          const values = e.value || props.value;
          values &&
            values.forEach((value: any) => {
              treeView.selectItem(value);
            });
        }
      }
      if (e.value !== undefined) {
        props.onValueChanged?.({ value: e.value } as any);
      }
    },
    [props.value],
  );
  return (
    <DropDownBox
      {...props}
      displayExpr={'text'}
      valueExpr={'value'}
      dataSource={props.field.lookups}
      onValueChanged={(e) => {
        props.onValueChanged?.apply(this, [
          {
            ...e,
            value: e.value,
          },
        ]);
        if (e.value === null) {
          treeViewRef.current?.instance.unselectAll();
        }
      }}
      contentRender={() => {
        return (
          <TreeView
            ref={treeViewRef}
            dataSource={props.field.lookups}
            dataStructure="plain"
            keyExpr="value"
            selectionMode="multiple"
            showCheckBoxesMode="normal"
            selectNodesRecursive={false}
            displayExpr="text"
            selectByClick={true}
            onContentReady={syncTreeViewSelection}
            onItemSelectionChanged={(e) => {
              const nodes = e.component.getSelectedNodes();
              props.onValueChanged?.({ value: nodes.map((node) => node.key) } as any);
            }}
          />
        );
      }}
    />
  );
};

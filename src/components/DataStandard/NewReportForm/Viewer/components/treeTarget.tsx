import { model } from '@/ts/base';
import React, { useEffect, useState, createRef } from 'react';
import { ISelectBoxOptions } from 'devextreme-react/select-box';
import { organizeData } from './utils';
import { TreeView } from 'devextreme-react';

interface TreeSelectItemProps extends ISelectBoxOptions {
  speciesItems: model.FiledLookup[];
  selectValue: string;
}

const TreeTargetItem: React.FC<TreeSelectItemProps> = (props) => {
  const [dataSourceArray, setDataSourceArray] = useState<model.FiledLookup[][] | any>([]);
  const treeViewRef = createRef<TreeView<any>>();

  useEffect(() => {
    const newData = organizeData(props.speciesItems);
    setDataSourceArray(newData);
  }, [props.speciesItems]);

  return (
    <div>
      <TreeView
        ref={treeViewRef}
        dataSource={dataSourceArray}
        keyExpr="value"
        selectionMode="single"
        displayExpr="text"
        itemsExpr="children"
        searchEnabled
        expandAllEnabled={false}
        onItemClick={(e) => {
          const value = e.itemData?.value;
          const title = e.itemData?.text;
          props.onValueChanged?.apply(this, [{ value, title } as any]);
        }}
      />
    </div>
  );
};

export default TreeTargetItem;

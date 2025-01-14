import { TreeSelect } from 'antd';
import React, { useState } from 'react';
import { DefaultOptionType } from 'rc-select/lib/Select';
import { IAuthority, IBelong } from '@/ts/core';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { schema } from '@/ts/base';
interface IProps {
  value?: string;
  space: IBelong;
  excludeAll?: boolean;
  disableExp?: (authority: IAuthority) => boolean;
  onChange: (newValue: string, label: string, item: schema.XAuthority) => void;
}
const SelectAuth: React.FC<IProps> = (props: IProps) => {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [loaded] = useAsyncLoad(async () => {
    const getTreeData = (targets: IAuthority[]): DefaultOptionType[] => {
      return targets.map((item: IAuthority) => {
        return {
          label: item.name,
          value: item.id,
          disabled: props.disableExp && props.disableExp(item),
          item: item.metadata,
          children:
            item.children && item.children.length > 0 ? getTreeData(item.children) : [],
        };
      });
    };
    let tree = await props.space.loadSuperAuth(false);
    if (tree) {
      var data = getTreeData([tree]);
      if (!props.excludeAll) {
        data.unshift({
          label: '全员',
          value: '0',
          children: [],
          item: { id: 0, name: '全员' },
        });
      }
      setTreeData(data);
    }
  }, [props.space]);
  if (!loaded) return <></>;

  return (
    <TreeSelect
      showSearch
      style={{ width: '100%' }}
      value={props.value}
      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
      placeholder="请选择权限"
      treeDefaultExpandAll
      onSelect={(_, options) =>
        props.onChange?.apply(this, [options.value, options.label, options.item])
      }
      onClick={(e) => {
        e.stopPropagation();
      }}
      treeData={treeData}
    />
  );
};

export default SelectAuth;

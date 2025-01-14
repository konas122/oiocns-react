import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import SearchTarget from '@/components/Common/SearchTarget';
import { schema } from '@/ts/base';
import { TargetType } from '@/ts/core';
import { DropDownBox, TextBox } from 'devextreme-react';
import { IDropDownBoxOptions } from 'devextreme-react/drop-down-box';
import React, { useEffect, useState } from 'react';
import orgCtrl from '@/ts/controller';

interface SearchTargetItemProps extends IDropDownBoxOptions {
  typeName: TargetType;
}

const SearchTargetItem: React.FC<SearchTargetItemProps> = (props) => {
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [selectTarget, setSelectTarget] = useState<schema.XTarget>();
  const [value, setValue] = useState(props.value);
  useEffect(() => {
    if (value) {
      const regex = /^.*[\u4e00-\u9fa5]+.*$/;
      if (regex.test(value)) {
        setSelectTarget({
          id: value,
          name: value,
          code: '',
        } as schema.XTarget);
      } else if (value.length > 5) {
        orgCtrl.user.findEntityAsync(value).then((a) => {
          setSelectTarget(a as schema.XTarget);
        });
      }
    } else {
      setSelectTarget(undefined);
    }
  }, [value]);

  const fieldRender = () => {
    if (selectTarget) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 10,
            paddingTop: 2,
          }}>
          <EntityIcon entity={selectTarget} />
          <TextBox value={`${selectTarget?.name}(${selectTarget?.code})`} />
        </div>
      );
    } else {
      return <TextBox />;
    }
  };

  return (
    <DropDownBox
      {...props}
      opened={searchEnabled}
      value={props.value}
      fieldRender={fieldRender}
      dataSource={[{ ...selectTarget }]}
      displayExpr={'name'}
      valueExpr={'id'}
      onOptionChanged={(e) => {
        if (e.name === 'opened') {
          setSearchEnabled(e.value);
        }
      }}
      contentRender={() => {
        return (
          <SearchTarget
            searchCallback={(persons: schema.XTarget[]) => {
              if (persons.length > 0) {
                setValue(persons[0].id);
                props.onValueChanged?.({ value: persons[0].id } as any);
              }
              setSearchEnabled(false);
            }}
            searchType={props.typeName}
          />
        );
      }}
    />
  );
};

export default SearchTargetItem;

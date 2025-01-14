import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { schema } from '@/ts/base';
import { SelectBox, TextBox } from 'devextreme-react';
import React, { useEffect, useState } from 'react';
import orgCtrl from '@/ts/controller';
import { ISelectBoxOptions } from 'devextreme-react/select-box';

interface CurrentTargetItemProps extends ISelectBoxOptions {
  target: schema.XTarget;
  isCreate?: boolean;
}

const CurrentTargetItem: React.FC<CurrentTargetItemProps> = (props) => {
  const [selectTarget, setSelectTarget] = useState<schema.XTarget | undefined>(
    props.target,
  );
  useEffect(() => {
    if (!props.isCreate && !props.value) {
      setSelectTarget(undefined);
    } else if (props.value && props.value.length > 5) {
      orgCtrl.user.findEntityAsync(props.value).then((value) => {
        setSelectTarget(value as schema.XTarget);
      });
    }
  }, [props]);
  return (
    <SelectBox
      key={selectTarget?.id}
      {...props}
      readOnly
      items={selectTarget ? [selectTarget] : []}
      value={selectTarget?.id}
      showClearButton={false}
      onValueChange={undefined}
      valueExpr={'id'}
      displayExpr={'name'}
      fieldRender={() => {
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
            <TextBox
              value={selectTarget ? `${selectTarget?.name}(${selectTarget?.code})` : ''}
            />
          </div>
        );
      }}
    />
  );
};

export default CurrentTargetItem;

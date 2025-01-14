import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { schema } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { MemberFilter } from '@/ts/core/public/consts';
import { ITarget } from '@/ts/core';
import { TextBox, DropDownBox } from 'devextreme-react';
import { ISelectBoxOptions } from 'devextreme-react/select-box';
import React, { useEffect, useState } from 'react';
import * as dev from 'devextreme-react';
import CustomStore from 'devextreme/data/custom_store';

interface MemberBoxProps extends ISelectBoxOptions {
  teamId?: string;
  isOperator?: boolean;
  target: schema.XTarget;
  searchEnabled?: boolean;
}
let readOnly = false;
const MemberBox: React.FC<MemberBoxProps> = (props) => {
  const [team, setTeam] = useState<ITarget>();
  const [targets, setTargets] = useState<schema.XTarget[]>();
  const [selectTarget, setSelectTarget] = useState<schema.XTarget>();
  const [searchEnabled1, setSearchEnabled] = useState(false);
  useEffect(() => {
    if (props.value && props.value.length > 5) {
      orgCtrl.user.findEntityAsync(props.value).then((value) => {
        setSelectTarget(value as schema.XTarget);
      });
    }
    if (!props.readOnly) {
      if (props.isOperator) {
        setTargets([props.target]);
        setSelectTarget(props.target);
      } else if (props.teamId) {
        let target: ITarget | undefined = undefined;
        if (props.teamId === MemberFilter.id) {
          target = orgCtrl.targets.find((i) => i.id === props.target.id);
        } else {
          target = orgCtrl.targets.find((i) => i.id === props.teamId);
        }
        if (target) {
          setSelectTarget(undefined);
          setTeam(target);
          target.loadMembers().then((members) => {
            if (!readOnly) {
              setTargets(members);
            }
          });
        }
      }
    } else {
      readOnly = true;
      setTargets(selectTarget ? [selectTarget] : []);
    }
  }, [props]);
  const itemRender = (target?: schema.XTarget, textBox?: boolean) => {
    const value = target ? `${target.name}(${target.code})` : '';
    readOnly = true;
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 10,
          paddingTop: textBox ? 2 : 8,
          paddingBottom: textBox ? 0 : 8,
          background: target?.id === selectTarget?.id && !textBox ? '#d1d1d1' : undefined,
        }}>
        {target && <EntityIcon entity={target} />}
        {textBox ? (
          <TextBox value={value} />
        ) : (
          <span style={{ paddingLeft: 8 }}>{value}</span>
        )}
      </div>
    );
  };
  return (
    <DropDownBox
      {...props}
      readOnly={props.readOnly}
      showClearButton={true}
      value={selectTarget?.id}
      displayExpr={'name'}
      valueExpr={'id'}
      deferRendering={true}
      dataSource={targets}
      fieldRender={() => {
        return itemRender(selectTarget, true);
      }}
      opened={searchEnabled1}
      onOptionChanged={(e) => {
        if (e.name === 'opened') {
          setSearchEnabled(e.value);
        }
      }}
      contentComponent={() => {
        return (
          <>
            {team && (
              <dev.List
                dataSource={
                  new CustomStore({
                    key: 'id',
                    async load(options) {
                      let searchValue = options.searchValue;
                      await team?.loadMembers(false, searchValue);
                      if (searchValue) {
                        return team?.members.filter((i) => {
                          return (
                            i.name.includes(searchValue) ||
                            i.code.includes(searchValue) ||
                            i.remark.includes(searchValue)
                          );
                        });
                      }
                      return { data: team?.members ?? [] };
                    },
                  })
                }
                height={'100%'}
                width={'100%'}
                pageLoadMode="scrollBottom"
                searchExpr={['name', 'code']}
                searchEnabled={true}
                searchTimeout={200}
                onItemClick={(e) => {
                  setSearchEnabled(false);
                  setSelectTarget(e.itemData);
                }}
                noDataText=""
                itemRender={(data) => itemRender(data)}></dev.List>
            )}
          </>
        );
      }}
    />
  );
};

export default MemberBox;

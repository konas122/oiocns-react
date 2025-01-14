import { List, Tag } from 'antd';
import React from 'react';
import css from './index.module.less';
import OrgIcons from '@/components/Common/GlobalComps/orgIcons';
import { IDEntity, ISession } from '@/ts/core';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';

interface IProps {
  height?: string;
  entity: IDEntity | ISession;
  actions?: {
    key: string;
    label: string;
  }[];
  selectKey?: string;
  number?: number;
  children?: React.ReactNode; // 子组件
  onActionChanged?: (key: string) => void;
}

const PreviewLayout: React.FC<IProps> = (props) => {
  const nameNumber = props.number ?? 0;
  const extraName = ['办事', '集群模板'].includes(props.entity.typeName)
    ? `v${props.entity.metadata.version}`
    : '';
  return (
    <>
      <div style={{ height: props.height || '100%' }} className={css.groupDetail}>
        <List.Item
          className={css.header}
          actions={props.actions?.map((action) => {
            const selected = action.key === props.selectKey;
            return (
              <a
                key={action.key}
                title={action.label}
                onClick={() => {
                  if (props.onActionChanged) {
                    props.onActionChanged(action.key);
                  }
                }}>
                <OrgIcons
                  type={`/topbar/${action.key}`}
                  selected={selected}
                  size={26}
                  css={{ backgroundColor: selected ? '#F2F3FF' : '' }}
                />
              </a>
            );
          })}>
          <List.Item.Meta
            title={
              <>
                <span style={{ marginRight: 10 }}>
                  {props.entity.name} {extraName}
                </span>
                {nameNumber > 0 && <span className={css.number}>({nameNumber})</span>}
              </>
            }
            avatar={<EntityIcon entity={props.entity.metadata} size={42} />}
            description={props.entity.groupTags
              .filter((i) => i?.length > 0)
              .map((label) => {
                return (
                  <Tag key={label} color="processing">
                    {label}
                  </Tag>
                );
              })}
          />
        </List.Item>
        <div
          style={{
            height: '100%',
            overflowY: 'scroll',
          }}
          className={css.groupDetailContent}>
          {props.children && props.children}
        </div>
      </div>
    </>
  );
};

export default PreviewLayout;

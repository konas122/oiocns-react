import React, { useState } from 'react';
import cls from './index.module.less';
import { List, SelectBox } from 'devextreme-react';
import { WorkNodeDisplayModel } from '@/utils/work';
import { IAuthority, IBelong, IWork } from '@/ts/core';
import { schema } from '@/ts/base';
import { Card, Divider } from 'antd';
import { ItemDragging } from 'devextreme-react/list';
import SelectAuth from '@/components/Common/SelectAuth';
interface IProps {
  current: WorkNodeDisplayModel;
  work: IWork;
  belong: IBelong;
  refresh: () => void;
}

/**
 * @description: 成员节点配置信息
 * @return {*}
 */

const ConfluenceNode: React.FC<IProps> = (props) => {
  const [selectAuthority, setSelectAuthority] = useState<schema.XAuthority>();
  const [containCompany, setContainCompany] = useState<boolean>(
    props.current.containCompany,
  );
  const [selectAuthoritys, setSelectAuthoritys] = useState<schema.XAuthority[]>(
    props.current.authoritys ?? [],
  );
  const onReorder = React.useCallback((e: { fromIndex: number; toIndex: number }) => {
    const fromAttr = props.current.authoritys.splice(e.fromIndex, 1);
    props.current.authoritys.splice(e.toIndex, 0, ...fromAttr);
  }, []);
  return (
    <div className={cls[`app-roval-node`]}>
      <div className={cls[`roval-node`]}>
        <Card
          className={cls[`card-info`]}
          type="inner"
          style={{ border: 'none' }}
          headStyle={{
            backgroundColor: '#FCFCFC',
            padding: '0px 12px',
            borderBottom: 'none',
          }}
          title={
            <div>
              <Divider type="vertical" className={cls['divider']} />
              <span>审核配置</span>
            </div>
          }>
          <div style={{ width: '300px', paddingLeft: 10, display: 'inline-block' }}>
            <SelectBox
              label="是否包含单位级审核"
              labelMode="static"
              displayExpr={'label'}
              valueExpr={'value'}
              value={containCompany}
              onSelectionChanged={(e) => {
                props.current.containCompany = e.selectedItem.value;
                setContainCompany(e.selectedItem.value);
              }}
              dataSource={[
                { label: '包含', value: true },
                {
                  label: '不包含',
                  value: false,
                },
              ]}
            />
          </div>
        </Card>
        <Card
          className={cls[`card-info`]}
          type="inner"
          style={{ border: 'none' }}
          headStyle={{
            backgroundColor: '#FCFCFC',
            padding: '0px 12px',
            borderBottom: 'none',
          }}
          title={
            <div>
              <Divider type="vertical" className={cls['divider']} />
              <span>权限配置</span>
            </div>
          }
          extra={
            <>
              <div style={{ width: '300px', paddingLeft: 10, display: 'inline-block' }}>
                <SelectAuth
                  excludeAll
                  disableExp={(auth: IAuthority) => {
                    return selectAuthoritys.some((s) => s.id == auth.id);
                  }}
                  space={props.belong}
                  value={selectAuthority?.id}
                  onChange={(_value, _label, authority) => {
                    setSelectAuthority(authority);
                  }}
                />
              </div>
              <a
                style={{ paddingLeft: 10, display: 'inline-block' }}
                onClick={() => {
                  if (
                    selectAuthority &&
                    props.current.authoritys.every((a) => a.id !== selectAuthority.id)
                  ) {
                    props.current.authoritys.push({ ...selectAuthority, count: 1 });
                    setSelectAuthoritys([...props.current.authoritys]);
                    setSelectAuthority(undefined);
                  }
                }}>
                添加
              </a>
            </>
          }>
          <List<schema.XAuthority, string>
            itemKeyFn={(attr: schema.XAttribute) => attr.id}
            dataSource={props.current.authoritys}
            height={'600px'}
            width={'100%'}
            searchEnabled
            scrollingEnabled
            searchMode="contains"
            focusStateEnabled={false}
            activeStateEnabled={false}
            pageLoadMode="scrollBottom"
            searchExpr={['name', 'remark']}
            scrollByContent={false}
            allowItemDeleting
            onItemReordered={onReorder}
            onItemDeleted={(e) => {
              props.current.authoritys = props.current.authoritys.filter(
                (a) => a.id != e.itemData?.id,
              );
              setSelectAuthoritys([...props.current.authoritys]);
            }}
            itemRender={(auth: schema.XAuthority) => {
              return <span>{auth.name}</span>;
            }}
            itemDeleteMode="static">
            <ItemDragging
              autoScroll
              allowReordering
              dragDirection="both"
              dropFeedbackMode="push"
              bindingOptions={{
                location: 'before',
              }}
              data={props.current.authoritys}
            />
          </List>
        </Card>
      </div>
    </div>
  );
};
export default ConfluenceNode;

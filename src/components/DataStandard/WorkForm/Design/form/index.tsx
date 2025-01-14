import { schema } from '@/ts/base';
import { IForm, IProperty, orgAuth } from '@/ts/core';
import { List } from 'devextreme-react';
import { Button, Divider, Modal, Select } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import OpenFileDialog from '@/components/OpenFileDialog';
import Toolbar, { Item } from 'devextreme-react/toolbar';
import FormItem from './formItem';
import { ItemDragging } from 'devextreme-react/list';
import { Emitter, generateUuid } from '@/ts/base/common';
import useStorage from '@/hooks/useStorage';
import { getItemNums, getItemWidth } from '../../Utils';
import styles from './index.module.less';
import { FullProperties } from '@/config/column';
import { cloneDeep } from 'lodash';

const FormRender: React.FC<{
  current: IForm;
  notityEmitter: Emitter;
  onItemSelected: (index: number) => void;
}> = ({ current, notityEmitter, onItemSelected }) => {
  const [key, setKey] = useState(generateUuid());
  const [openDialog, setDialog] = React.useState(false);
  const [colNum, setColNum] = useStorage('workFormColNum', '一列');
  const [dataSource, setDataSource] = useState<(schema.XGroups | schema.XAttribute)[]>(
    [],
  );
  const [options,setOptions] = useState(['实体商品', '虚拟商品', '报表数据', '办事数据','空间场地数据','空间上架数据']);
  const showDialog = React.useCallback(() => setDialog(true), []);

  const updateAttributes = () => {
    const groups: schema.XGroups[] = [];
    const attributes = dataSource.filter((data, index) => {
      if (data.valueType === '分组型') {
        groups.push({
          name: data.name,
          index,
          valueType: '分组型',
        });
        return;
      }
      return true;
    });
    current.metadata.groups = groups;
    current.metadata.attributes = attributes as schema.XAttribute[];
  };

  const onReorder = React.useCallback(
    (e: { fromIndex: number; toIndex: number }) => {
      const fromAttr = dataSource.splice(e.fromIndex, 1);
      dataSource.splice(e.toIndex, 0, ...fromAttr);
      updateAttributes();
    },
    [dataSource],
  );
  const myRef = useRef(null);

  useEffect(() => {
    if (!current.metadata.attributes) return;
    const attributes: (schema.XGroups | schema.XAttribute)[] = cloneDeep(
      current.metadata.attributes,
    );
    if (current.metadata.groups?.length) {
      current.metadata.groups.forEach((group) => {
        attributes.splice(group.index, 0, group);
      });
    }
    setDataSource(attributes);
    if (current.metadata.typeName == '视图') {
      setOptions([...options, '虚拟列']);
    }
  }, []);
  return (
    <div style={{ padding: 16 }}>
      <Toolbar height={60}>
        <Item
          location="center"
          locateInMenu="never"
          render={() => (
            <div className="toolbar-label">
              <b style={{ fontSize: 20 }}>{current.name}</b>
            </div>
          )}
        />
        <Item
          location="after"
          locateInMenu="never"
          render={() => (
            <Button
              type="primary"
              onClick={() => {
                let value: string;
                const modal = Modal.confirm({
                  icon: <></>,
                  title: '添加分组',
                  okText: '确认',
                  cancelText: '取消',
                  maskClosable: true,
                  content: (
                    <input
                      style={{ width: '100%' }}
                      onChange={(e) => {
                        value = e.target.value;
                      }}
                    />
                  ),
                  onOk: () => {
                    if (value) {
                      const data: schema.XGroups = {
                        name: value,
                        valueType: '分组型',
                        index: dataSource.length,
                      };
                      dataSource.push(data);
                      updateAttributes();
                      setKey(generateUuid());
                    }
                    modal.destroy();
                  },
                  onCancel: () => modal.destroy(),
                });
              }}>
              + 添加分组
            </Button>
          )}
        />
        <Item
          location="after"
          locateInMenu="never"
          render={() => (
            <Button
              type="primary"
              onClick={() => {
                let value: string;
                const modal = Modal.confirm({
                  icon: <></>,
                  title: '加入内置属性',
                  okText: '确认',
                  cancelText: '取消',
                  maskClosable: true,
                  content: (
                    <Select<string>
                      style={{ width: '100%' }}
                      options={options.map(
                        (i) => {
                          return {
                            value: i,
                            label: i,
                          };
                        },
                      )}
                      onChange={(e) => {
                        value = e;
                      }}
                    />
                  ),
                  onOk: () => {
                    if (value) {
                      FullProperties(value)
                        .filter((item) => {
                          return !current.attributes
                            .map((item) => item.propId)
                            .includes(item.id);
                        })
                        .forEach((item) => {
                          dataSource.push({
                            propId: item.id,
                            property: item,
                            ...item,
                            rule: '{}',
                            options: {
                              isNative: true,
                              visible: true,
                              isRequired: true,
                            },
                            formId: current.id,
                            authId: orgAuth.SuperAuthId,
                          });
                        });
                      setKey(generateUuid());
                      updateAttributes()
                    }
                    modal.destroy();
                  },
                  onCancel: () => modal.destroy(),
                });
              }}>
              + 添加内置属性
            </Button>
          )}
        />
        <Item
          location="after"
          locateInMenu="never"
          render={() => (
            <Button type="primary" onClick={showDialog}>
              + 添加属性
            </Button>
          )}
        />
        <Item
          location="after"
          locateInMenu="never"
          widget="dxSelectBox"
          options={{
            text: '项排列',
            value: colNum,
            items: getItemNums(),
            onItemClick: (e: { itemData: string }) => {
              setColNum(e.itemData);
            },
          }}
        />
      </Toolbar>
      <div className={styles.dragList} ref={myRef}>
        <style>{`:root {
        --primary-dragList: ${getItemWidth(colNum)}
        }`}</style>
        <List<schema.XAttribute | schema.XGroups, string>
          key={key}
          itemKeyFn={(attr: schema.XAttribute) => attr.id}
          dataSource={dataSource}
          height={'calc(100vh - 175px)'}
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
          onItemClick={(e) => {
            e.event?.stopPropagation();
            if (e.itemData?.valueType === '分组型') return;
            if (e.itemData) {
              const index = current.metadata.attributes.findIndex(
                (i) => i.id === e.itemData?.id,
              );
              if (index > -1) {
                onItemSelected(index);
                return;
              }
            }
            onItemSelected(e.itemIndex as number);
          }}
          onItemReordered={onReorder}
          onItemDeleted={() => {
            updateAttributes()
            onItemSelected(-1);
          }}
          itemRender={(attr: schema.XAttribute, index) => {
            if (attr.valueType === '分组型') {
              document.querySelectorAll(`.${styles.dragList} .dx-list-item`)[
                index
              ].style.width = '100%';
              return (
                <div className={styles['groups']}>
                  <Divider type="vertical" className={styles['divider']} />
                  <span>{attr.name}</span>
                </div>
              );
            } else {
              return (
                <FormItem attr={attr} current={current} notityEmitter={notityEmitter} />
              );
            }
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
            data={dataSource}
          />
        </List>
      </div>
      {openDialog && (
        <OpenFileDialog
          multiple
          title={`选择属性`}
          accepts={['属性']}
          rootKey={current.spaceKey}
          excludeIds={current.attributes.filter((i) => i.propId).map((a) => a.propId)}
          onCancel={() => setDialog(false)}
          onOk={(files) => {
            (files as IProperty[]).forEach((item) => {
              dataSource.push({
                propId: item.id,
                property: item.metadata,
                ...item.metadata,
                id: 'snowId()',
                rule: '{}',
                options: {
                  visible: true,
                  isRequired: true,
                },
                formId: current.id,
                authId: orgAuth.SuperAuthId,
              });
            });
            updateAttributes()
            setDialog(false);
          }}
        />
      )}
    </div>
  );
};

export default FormRender;

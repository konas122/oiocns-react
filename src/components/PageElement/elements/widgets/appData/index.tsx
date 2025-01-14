import React, { useState, useEffect } from 'react';
import { ExistTypeMeta } from '@/ts/element/ElementMeta';
import { SEntity } from '@/ts/element/standard';
import { Context } from '../../../render/PageContext';
import { defineElement } from '../../defineElement';
import { Dropdown, Spin, Space, Badge, Divider } from 'antd';
import { command } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { IFile } from '@/ts/core';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { loadFileMenus } from '@/executor/fileOperate';
import { cleanMenus } from '@/utils/tools';
import { useFlagCmdEmitter } from '@/hooks/useCtrlUpdate';
import CommonGroups from '@/pages/Home/components/Content/WorkBench/group';
import { Sortable } from 'devextreme-react';

interface IProps {
  height: number;
  url?: SEntity;
  props: any;
  ctx: Context;
}

const View: React.FC<IProps> = (props) => {
  const [editMode, setEditMode] = useState<boolean>(false);
  const [commonFiles, setCommonFiles] = useState<IFile[]>([]);
  const [groups, setGroups] = useState<any>({});
  const [loaded] = useFlagCmdEmitter('commons', async () => {
    setCommonFiles(await orgCtrl.loadCommons());
  });
  const loadGroups = () => {
    const letGroups: any = { 其它: [] };
    for (const item of orgCtrl.user.commons) {
      const file = commonFiles.find(
        (i) => i.id === item.id && i.spaceId === item.spaceId,
      );
      if (file) {
        const groupName = item.groupName ?? '其它';
        letGroups[groupName] = letGroups[groupName] || [];
        letGroups[groupName].push({
          file,
          common: item,
        });
      }
    }

    return letGroups;
  };
  useEffect(() => {
    if (loaded) {
      const groups = loadGroups();
      setGroups(groups);
    }
  }, [loaded, commonFiles, orgCtrl.user.commons]);

  const contextMenu = (file: IFile) => {
    return {
      items: cleanMenus(loadFileMenus(file)) || [],
      onClick: ({ key }: { key: string }) => {
        command.emitter('executor', key, file);
      },
    };
  };
  // 加载常用
  const loadCommonCard = (item: IFile, index: number) => {
    if (index < 3) {
      return (
        <Dropdown key={item.key} menu={contextMenu(item)} trigger={['contextMenu']}>
          <div
            className="appCard"
            onClick={() => {
              command.emitter('executor', 'open', item);
            }}>
            {item.cache.tags?.includes('常用') ? (
              <Badge dot>
                <EntityIcon entity={item.metadata} size={35} />
              </Badge>
            ) : (
              <EntityIcon entity={item.metadata} size={35} />
            )}
            <div className="appName">{item.name}</div>
            <div className="teamName">{item.directory.target.name}</div>
            <div className="teamName">{item.directory.target.space.name}</div>
          </div>
        </Dropdown>
      );
    }
  };

  const loadGroupItem = (title: string, data: any[], index: number) => {
    if (data.length < 1) return <div key={index}></div>;
    if (index > 2) return <div key={index}></div>;
    return (
      <div className="commonItem" key={index} style={{ width: 'auto', minWidth: 100 }}>
        <div className="common-header">
          <span className="title">{title}</span>
        </div>
        <div className="cardItem-viewer">
          <Space wrap split={<Divider type="vertical" />} size={2}>
            <Sortable
              group="commons"
              data={title}
              className="cardItem-sortable"
              dragDirection="both"
              itemOrientation="horizontal"
              onAdd={(e) => {
                setGroups((pre: any) => {
                  const data = pre[e.fromData].splice(e.fromIndex, 1);
                  data.forEach((item: any) => {
                    item.common.groupName = e.toData;
                    if (item.common.groupName === '其它') {
                      delete item.common.groupName;
                    }
                    pre[e.toData].push(item);
                  });
                  return { ...pre };
                });
              }}>
              {data.map((subapp, index) => {
                return loadCommonCard(subapp.file, index);
              })}
            </Sortable>
          </Space>
        </div>
      </div>
    );
  };
  return (
    <div className="workbench-wrap">
      <div className="cardGroup">
        <div className="cardItem">
          <div className="cardItem-header">
            <span className="title">常用</span>
            <span className="extraBtn" onClick={() => setEditMode((pre) => !pre)}>
              <div className="svg-container">
                <img src={`/svg/home-app.svg`} />
              </div>
              <span>编辑分组</span>
            </span>
          </div>
          <Spin spinning={!loaded} tip={'加载中...'}>
            <div className="cardItem-viewer">
              <div className="cardGroup" style={{ flexWrap: 'wrap' }}>
                {Object.keys(groups).map((groupName, index) => {
                  return loadGroupItem(groupName, groups[groupName], index);
                })}
              </div>
            </div>
          </Spin>
          {editMode && (
            <CommonGroups
              preGroups={groups}
              commons={orgCtrl.user.commons}
              onClose={(commons) => {
                // orgCtrl.user.updateCommons(commons);
                setEditMode(false);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default defineElement({
  render(props, ctx) {
    return <View {...props} ctx={ctx} />;
  },
  displayName: 'AppData',
  meta: {
    props: {
      height: {
        type: 'number',
        default: 200,
      },
      url: {
        type: 'type',
        label: '关联图片',
        typeName: 'picFile',
      } as ExistTypeMeta<SEntity | undefined>,
    },
    label: '常用应用',
    type: 'Element',
  },
});

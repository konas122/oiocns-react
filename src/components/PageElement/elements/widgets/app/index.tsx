import React, { useState, useEffect } from 'react';
import { ExistTypeMeta } from '@/ts/element/ElementMeta';
import { SEntity } from '@/ts/element/standard';
import { Context } from '../../../render/PageContext';
import { defineElement } from '../../defineElement';
import { Dropdown, Spin } from 'antd';
import { command } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { IFile, IApplication } from '@/ts/core';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { loadFileMenus } from '@/executor/fileOperate';
import { cleanMenus } from '@/utils/tools';
import FullScreenModal from '@/components/Common/fullScreen';
import Applications from '@/pages/Home/components/Content/WorkBench/apps';

interface IProps {
  height: number;
  url?: SEntity;
  props: any;
  ctx: Context;
}
const View: React.FC<IProps> = () => {
  const [editMode, setEditMode] = useState<boolean>(false);
  const [appData, setappData] = useState<IApplication[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  useEffect(() => {
    orgCtrl.loadApplications().then((res) => {
      setappData(res);
      setLoaded(true);
    });
  }, [editMode]);
  const contextMenu = (file: IFile) => {
    return {
      items: cleanMenus(loadFileMenus(file)) || [],
      onClick: ({ key }: { key: string }) => {
        command.emitter('executor', key, file);
      },
    };
  };
  // 加载前8个应用
  const loadCommonCard = (item: IFile) => (
    <Dropdown key={item.key} menu={contextMenu(item)} trigger={['contextMenu']}>
      <div
        className="appCard"
        onClick={() => {
          command.emitter('executor', 'open', item);
        }}>
        <EntityIcon entity={item.metadata} size={35} />
        <div className="appName">{item.name}</div>
        <div className="teamName">{item.directory.target.name}</div>
        <div className="teamName">{item.directory.target.space.name}</div>
      </div>
    </Dropdown>
  );

  return (
    <div className="workbench-wrap">
      <div className="cardGroup">
        <div className="cardItem">
          <div className="cardItem-header">
            <span className="title">最近应用</span>
            <span className="extraBtn" onClick={() => setEditMode((pre) => !pre)}>
              <div className="svg-container">
                <img src={`/svg/home-app.svg?v=1.0.0`} />
              </div>
              <span>全部应用</span>
            </span>
          </div>
          <Spin spinning={!loaded} tip={'加载中...'}>
            <div className="cardItem-viewer">
              <div className="cardGroup" style={{ flexWrap: 'wrap' }}>
                {appData
                  .filter((i) => i.cache.tags?.includes('常用'))
                  .map((app) => {
                    return loadCommonCard(app);
                  })}
              </div>
            </div>
          </Spin>
          {editMode && (
            <FullScreenModal
              open
              title={'全部应用'}
              width={'80vw'}
              bodyHeight={'70vh'}
              onCancel={() => setEditMode((pre) => !pre)}>
              <Applications
                apps={appData}
                onSelected={(app: IApplication) => {
                  command.emitter('executor', 'open', app);
                }}
              />
            </FullScreenModal>
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
  displayName: 'AppInfo',
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
    label: '最近应用',
    type: 'Element',
  },
});

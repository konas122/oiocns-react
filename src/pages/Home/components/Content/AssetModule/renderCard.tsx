import React, { useEffect, useState } from 'react';
import { Space, Empty, Dropdown, Spin, Radio } from 'antd';
import { IApplication, IDEntity, IFileInfo, IForm, IWork } from '@/ts/core';
import { cleanMenus } from '@/utils/tools';
import { loadFileMenus } from '@/executor/fileOperate';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { command, schema } from '@/ts/base';
import cls from './index.module.less';
import useAsyncLoad from '@/hooks/useAsyncLoad';

const RenderCard: React.FC<{
  app: IApplication;
}> = ({ app }) => {
  const IsAppSelf = app.typeName == '应用';
  const [activeKey, setActiveKey] = useState<string>('work');
  const [contents, setContents] = useState<IDEntity[]>([]);
  const [allWorks, setAllWorks] = useState<IWork[]>([]);
  const [allForms, setAllForms] = useState<IForm[]>([]);
  const [filter, setfilter] = useState<string>(app.id);
  const [loaded] = useAsyncLoad(async () => {
    let aworks = [];
    let aforms = [];
    if (IsAppSelf) {
      aworks = await app.loadWorks();
      aforms = await app.loadForms();
    } else {
      aworks = await app.loadAllWorks();
      aforms = await app.loadAllForms();
    }

    setAllWorks(aworks);
    setAllForms(aforms);
  });

  useEffect(() => {
    if (loaded) {
      let content: IFileInfo<schema.XEntity>[] = [];
      switch (activeKey) {
        case 'all':
          content = [...allWorks, ...allForms];
          break;
        case 'form':
          content = allForms;
          break;
        case 'work':
        default:
          content = allWorks;
          break;
      }
      content = content.filter((file: any) => file.isAuth);
      if (filter == app.id) {
        setContents(content);
      } else {
        setContents(content.filter((a: any) => a.metadata.applicationId == filter));
      }
    }
  }, [loaded, filter, activeKey]);
  /** 右键 */
  const contextMenu = (file: IDEntity) => {
    return {
      items: cleanMenus(loadFileMenus(file)) || [],
      onClick: ({ key }: { key: string }) => {
        command.emitter('executor', key, file);
      },
    };
  };

  const loadCommonCard = (file: IDEntity) => {
    return (
      <Dropdown key={file.key} menu={contextMenu(file)} trigger={['contextMenu']}>
        <div
          className="appCard assetCard"
          onClick={() => {
            command.emitter('executor', 'open', file);
          }}>
          <EntityIcon entity={file.metadata} size={35} />
          <div className="appNames">{file.name}</div>
        </div>
      </Dropdown>
    );
  };
  // 若应用下无办事和表单 不展示
  if (IsAppSelf && allForms.length == 0 && allWorks.length == 0) {
    return <></>;
  }
  const renderExtraBtns = () => {
    if (IsAppSelf) {
      return <></>;
    }
    return (
      <span className="extraBtn">
        <div className={cls.tags_bar}>
          <Space style={{ paddingTop: '2px' }} className={cls.tags_bar_content} size={10}>
            <div
              className={filter === app.id ? cls.tags_item_active : cls.tags_item}
              onClick={() => {
                setfilter(app.id);
              }}>
              全部
            </div>
            {app.children.map((module) => {
              return (
                <div
                  key={module.id}
                  className={module.id === filter ? cls.tags_item_active : cls.tags_item}
                  onClick={() => {
                    setfilter(module.id);
                  }}>
                  {module.name}
                </div>
              );
            })}
          </Space>
        </div>
      </span>
    );
  };
  return (
    <div className="cardGroup">
      <div className="cardItem">
        <Spin spinning={!loaded} tip={'加载中...'}>
          <div className="cardItem-header">
            <span className="title">{app.name}</span>
            <Radio.Group
              size={'small'}
              style={{ padding: 10 }}
              value={activeKey}
              onChange={(e) => {
                setActiveKey(e.target.value);
              }}>
              <Radio.Button value="work">办事</Radio.Button>
              <Radio.Button value="form">表单</Radio.Button>
              <Radio.Button value="all">全部</Radio.Button>
            </Radio.Group>
            {renderExtraBtns()}
          </div>
          <div className="cardItem-viewer">
            {contents.length > 0 ? (
              <div className="cardGroup" style={{ flexWrap: 'wrap' }}>
                {contents.map((a) => loadCommonCard(a))}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="该模块暂无办事" />
            )}
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default React.memo(RenderCard);

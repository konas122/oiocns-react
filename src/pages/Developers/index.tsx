import React, { useEffect, useState } from 'react';
import { Button, Spin } from 'antd';
import orgCtrl from '@/ts/controller';
import DirectoryViewer from '@/components/Directory/views';
import AppLayout from '@/components/MainLayout/appLayout';
import OrgIcons from '@/components/Common/GlobalComps/orgIcons';
import { IDEntity } from '@/ts/core';
import { command } from '@/ts/base';
import { cleanMenus } from '@/utils/tools';
import { loadFileMenus } from '@/executor/fileOperate';
import useTimeoutHanlder from '@/hooks/useTimeoutHanlder';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { ImUndo2 } from 'react-icons/im';
import { IDevCompany, loadDevCompanys } from '@/ts/core/target/developers/company';
import useAsyncLoad from '@/hooks/useAsyncLoad';

/**
 * 办事-事项清单
 */
const WorkContent: React.FC = () => {
  const [currentTag, setCurrentTag] = useState('全部');
  const [current, setCurrent] = useState<IDevCompany | 'disk'>('disk');
  const [focusFile, setFocusFile] = useState<IDEntity>();
  const [content, setContent] = useState<IDEntity[]>([]);
  const [submitHanlder, clearHanlder] = useTimeoutHanlder();
  const [loaded] = useAsyncLoad(async () => {
    const contents = await getContent();
    if (contents.length) {
      setFocusFile(contents[0]);
    }
    setContent(contents);
  });
  useEffect(() => {
    command.emitter('preview', 'developers', focusFile);
  }, [focusFile]);
  useEffect(() => {
    setCurrentTag('全部');
  }, [current]);
  const contextMenu = (file: IDEntity | undefined) => {
    return {
      items: cleanMenus(loadFileMenus(file)) || [],
      onClick: ({ key }: { key: string }) => {
        command.emitter('executor', key, file);
      },
    };
  };

  const focusHanlder = (file: IDEntity | undefined) => {
    const focused = file && focusFile && file.key === focusFile.key;
    if (focused) {
      setFocusFile(undefined);
    } else {
      setFocusFile(file);
    }
  };

  const clickHanlder = (file: IDEntity | undefined, dblclick: boolean) => {
    if (dblclick) {
      clearHanlder();
      if (file && 'members' in file) {
        setCurrent(file as IDevCompany);
        setFocusFile(undefined);
      }
    } else {
      submitHanlder(() => focusHanlder(file), 300);
    }
  };
  const getContent = async () => {
    const contents: IDEntity[] = [];
    if (current === 'disk') {
      var devCompanys = await loadDevCompanys(orgCtrl.user);
      contents.push(...devCompanys.sort((a, b) => b.score - a.score));
    } else {
      contents.push(...current.members);
    }
    return contents;
  };

  const renderHeader = () => {
    return (
      <div style={{ marginLeft: 10, padding: 2, fontSize: 16, height: 28 }}>
        {current != 'disk' && (
          <Button
            type="link"
            title="返回"
            icon={<ImUndo2 />}
            onClick={() => setCurrent('disk')}
          />
        )}
        {current != 'disk' ? (
          <>
            <EntityIcon entity={current.metadata} disableInfo size={22} />
            <span style={{ paddingLeft: 6 }}>{current.name}</span>
          </>
        ) : (
          <>
            <OrgIcons type="navbar/developers" />
            <span style={{ paddingLeft: 6 }}>开发者中心</span>
          </>
        )}
      </div>
    );
  };
  return (
    <AppLayout previewFlag={'developers'}>
      <Spin spinning={!loaded} tip={'加载中...'}>
        {renderHeader()}
        <DirectoryViewer
          initTags={['全部']}
          selectFiles={[]}
          extraTags={true}
          content={content}
          focusFile={focusFile}
          currentTag={currentTag}
          tagChanged={(t) => setCurrentTag(t)}
          fileOpen={(entity, dblclick) => clickHanlder(entity, dblclick)}
          contextMenu={(entity) => contextMenu(entity)}
        />
      </Spin>
    </AppLayout>
  );
};
export default WorkContent;

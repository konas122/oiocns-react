import React, { useEffect, useState } from 'react';
import { IApplication } from '@/ts/core';
import DirectoryViewer from '@/components/Directory/views';
import { command } from '@/ts/base';
import { cleanMenus } from '@/utils/tools';
import { loadFileMenus } from '@/executor/fileOperate';

/** 工作台-全部应用-选择 */
const AppSelect: React.FC<{
  apps: IApplication[];
  onSelected: (app: IApplication) => void;
}> = ({ apps, onSelected }) => {
  const [files, setFiles] = useState<IApplication[]>(apps);
  const [currentTag, setCurrentTag] = useState('全部');

  useEffect(() => {
    setFiles(filterFiles(currentTag));
  }, [currentTag]);

  const filterFiles = (tag: string) => {
    return apps
      .filter((a) => tag === '全部' || a.groupTags.includes(tag))
      .sort((a, b) => {
        if (b.updateTime == a.updateTime) {
          return b.cache.tags?.includes('常用') ? 1 : -1;
        } else {
          return b.updateTime > a.updateTime ? 5 : -5;
        }
      });
  };

  const contextMenu = (app: IApplication | undefined) => {
    return {
      items: cleanMenus(loadFileMenus(app)) || [],
      onClick: ({ key }: { key: string }) => {
        command.emitter('executor', key, app);
      },
    };
  };

  const FileOpen = (app: IApplication | undefined) => {
    if (app) {
      if (app.cache.tags?.includes('常用')) {
        onSelected(app);
      } else {
        app.toggleCommon().then((res) => {
          if (res) {
            onSelected(app);
          }
        });
      }
    }
  };

  return (
    <DirectoryViewer
      extraTags
      height={'calc(100% - 90px)'}
      initTags={['全部']}
      selectFiles={[]}
      content={files}
      badgeCount={(tag) =>
        filterFiles(tag)
          .map((i) => i.badgeCount ?? 0)
          .reduce((total, count) => total + count, 0)
      }
      excludeTags={['已删除']}
      currentTag={currentTag}
      tagChanged={(t) => setCurrentTag(t)}
      fileOpen={(entity) => FileOpen(entity as IApplication)}
      contextMenu={(entity) => contextMenu(entity as IApplication)}
    />
  );
};
export default AppSelect;

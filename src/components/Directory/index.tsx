import React, { useEffect, useState } from 'react';
import { IApplication, IContainer, IDirectory, IFile } from '@/ts/core';
import { command } from '@/ts/base';
import DirectoryViewer from '@/components/Directory/views';
import { loadFileMenus } from '@/executor/fileOperate';
import { Spin } from 'antd';
import { cleanMenus } from '@/utils/tools';
import { AuthApps } from '@/ts/core/public/consts';

interface IProps {
  root: IContainer;
}

/**
 * @description: 默认目录
 * @return {*}
 */
const Directory: React.FC<IProps> = ({ root }) => {
  const [currentTag, setCurrentTag] = useState('全部');
  const [preDirectory, setPreDirectory] = useState<IFile>();
  const [directory, setDirectory] = useState<IContainer>(root);
  const [content, setContent] = useState(directory.content());
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setCurrentTag('全部');
    const id = directory.subscribe(() => {
      loadContent(directory, directory, false);
    });
    if (directory != root) {
      setPreDirectory(directory.superior);
    } else {
      setPreDirectory(undefined);
    }
    return () => {
      directory.unsubscribe(id);
    };
  }, [directory]);
  useEffect(() => {
    const id = command.subscribe((type, cmd) => {
      if (type == 'container' && cmd == 'sort') {
        setContent(directory.content());
      }
    });
    return () => {
      command.unsubscribe(id);
    };
  }, [directory]);
  /** 加载目录内容 */
  const loadContent = (file: IFile, directory: IFile, reload: boolean) => {
    setLoaded(false);
    file.loadContent(reload).then(async () => {
      const data = directory.content().filter((item) => {
        if (AuthApps.includes(item.typeName)) {
          return (item as IDirectory | IApplication).isAuth ?? true;
        }
        return true;
      });
      if (file.key === directory.key) {
        setLoaded(true);
        setContent(data);
      }
    });
  };
  return (
    <Spin spinning={!loaded} tip={'加载中...'}>
      <DirectoryViewer
        extraTags
        initTags={['全部']}
        selectFiles={[]}
        content={content}
        currentTag={currentTag}
        directory={directory}
        tagChanged={(t) => setCurrentTag(t)}
        fileOpen={(file) => {
          if (file && 'isContainer' in file && file.isContainer) {
            setDirectory(file as IContainer);
          } else {
            command.emitter('executor', 'open', file);
          }
        }}
        preDirectory={preDirectory}
        contextMenu={(entity) => {
          const file = (entity as IFile) || directory;
          return {
            items: cleanMenus(loadFileMenus(file)) ?? [],
            onClick: ({ key }: { key: string }) => {
              const dirRefresh = ['refresh', 'reload'].includes(key);
              if (dirRefresh) {
                loadContent(file, directory, key === 'reload');
              } else {
                command.emitter('executor', key, file);
              }
            },
          };
        }}
      />
    </Spin>
  );
};
export default Directory;

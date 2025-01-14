import React, { useEffect, useState } from 'react';
import { IDEntity } from '@/ts/core';
import DirectoryViewer from '@/components/Directory/views';
import { cleanMenus } from '@/utils/tools';
import { loadFileMenus } from '@/executor/fileOperate';
import { IVersion } from '@/ts/core/thing/standard/version';
import { command } from '@/ts/base';
import VersionLayout from './versionLayout';
import useTimeoutHanlder from '@/hooks/useTimeoutHanlder';
import FullScreenModal from '@/components/Common/fullScreen';
import useStorage from '@/hooks/useStorage';
import LoadingView from '@/components/Common/Loading';

interface IVersionBrower {
  current: IVersion;
  finished: () => void;
}
const VersionBrower: React.FC<IVersionBrower> = ({ current, finished }) => {
  if (!('loadAllVersion' in current)) return <></>;
  const [showList, setShowList] = useStorage('showVersionList', 'false');
  const [submitHanlder] = useTimeoutHanlder();
  const [loaded, setLoaded] = useState<boolean>(true);
  const [versionData, setVersionData] = useState<IDEntity[]>([]);
  const [focusFile, setFocusFile] = useState<IDEntity>();

  useEffect(() => {
    loadAllVersion(showList === 'true').then(() => setLoaded(true));
    const id = current.directory.subscribe((_key, flag, cmd, ...args) => {
      if (flag === 'versionChange') loadAllVersion();
      if (flag === 'versionlayout' && cmd == 'showList') {
        if (args[0] === 'true') loadAllVersion(true);
        setShowList(args[0]);
      }
    });
    return () => current.directory.unsubscribe(id);
  }, []);
  //  获取版本列表
  const loadAllVersion = async (reload = false) => {
    const res = await current.loadAllVersion(reload);
    setVersionData([...res]);
    if (res.length > 0) setFocusFile(res[0]);
  };
  // 设置选中版本
  const focusHanlder = (file: IDEntity | undefined) => {
    const focused = file && focusFile && file.key === focusFile.key;
    if (!focused) setFocusFile(file);
  };
  // 设置内容区
  useEffect(() => command.emitter('preview', 'version', focusFile), [focusFile]);
  //等待加载完成
  if (!loaded) {
    return (
      <div className="loading-page">
        <LoadingView text="版本信息加载中..." />
      </div>
    );
  }
  return (
    <FullScreenModal
      open
      centered
      fullScreen
      destroyOnClose
      footer={[]}
      width="80vw"
      okText="发布"
      cancelText="取消"
      slot={<div id="modal-save"></div>}
      title={`事项[${current.name}]设计`}
      onCancel={() => finished()}>
      <VersionLayout
        previewFlag={'version'}
        showList={showList === 'true'}
        finished={finished}>
        <DirectoryViewer
          extraTags
          initTags={['全部']}
          selectFiles={[]}
          focusFile={focusFile}
          content={versionData}
          currentTag={'全部'}
          directory={current.directory}
          fileOpen={(entity) => submitHanlder(() => focusHanlder(entity), 300)}
          preDirectory={undefined}
          contextMenu={(file) => {
            return {
              items: cleanMenus(loadFileMenus(file)) ?? [],
              onClick: ({ key }: { key: string }) =>
                command.emitter('executor', key, file),
            };
          }}
        />
      </VersionLayout>
    </FullScreenModal>
  );
};

export default VersionBrower;

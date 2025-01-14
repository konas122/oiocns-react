import React from 'react';
import FullScreenModal from '@/components/Common/fullScreen';
import { SheetViewer, DocxViewer } from 'react-office-viewer';
import { FileItemShare } from '@/ts/base/model';
import ByteMD from './byteMD';
import { shareOpenLink } from '@/utils/tools';
import { IDirectory } from '@/ts/core';

interface IProps {
  share: FileItemShare;
  current: IDirectory;
  finished: () => void;
}

const OfficeView: React.FC<IProps> = ({ share, finished, current }) => {
  let mkHtml = '<p></p>';
  const getHtml = (html: any) => {
    mkHtml = html;
  };
  const mkSave = async () => {
    let type; //给传递的类型
    let content; //给传递的内容
    switch (share.extension) {
      case '.md':
        content = mkHtml;
        type = 'text/markdown';
        break;
      case '.pdf':
        content = ''; //后续office东西放入
        type = 'application/pdf';
        break;
      case '.doc':
        content = ''; //后续office东西放入
        type = 'application/msword';
        break;
      case '.docx':
        content = ''; //后续office东西放入
        type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.xls':
        content = ''; //后续office东西放入
        type = 'application/vnd.ms-excel';
        break;
      case '.xlsx':
        content = ''; //后续office东西放入
        type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      default:
        content = '';
        type = '';
        break;
    }
    let directory = current.directory;
    await current.delete();
    let blob = new Blob([content], { type: type });
    const file = new File([blob], share.name);
    await directory.createFile(share.name, file);
    finished();
  };
  if (share.shareLink) {
    const LoadViewer = () => {
      const config = {
        locale: 'zh',
        timeout: 5000,
        fileName: share.name,
        file: shareOpenLink(share.shareLink),
      };
      switch (share.extension) {
        case '.xls':
        case '.xlsx':
          return <SheetViewer {...config} />;
        case '.docx':
          return <DocxViewer {...config} />;
        case '.pdf':
          return (
            <iframe
              width={'100%'}
              height={'100%'}
              loading="eager"
              name={share.name}
              src={shareOpenLink(share.shareLink)}
            />
          );
        case '.md':
          return <ByteMD share={share} getHtml={getHtml} current={current} />;
      }
      return <></>;
    };
    return (
      <FullScreenModal
        onSave={['.md'].includes(share.extension ?? '') ? mkSave : undefined}
        centered
        open={true}
        fullScreen
        width={'80vw'}
        destroyOnClose
        title={share.name}
        bodyHeight={'80vh'}
        onCancel={() => finished()}>
        <LoadViewer />
      </FullScreenModal>
    );
  }
  finished();
  return <></>;
};

export default OfficeView;

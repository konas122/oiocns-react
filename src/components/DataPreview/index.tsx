import ImageView from './image';
import VideoView from './video';
import {
  IEntity,
  IForm,
  ISession,
  ISysFileInfo,
  ITarget,
  IWork,
  IWorkTask,
} from '@/ts/core';
import { schema, command } from '@/ts/base';
import React, { useEffect, useState } from 'react';
import OfficeView from './office';
import SessionBody from './session';
import TaskBody from '@/executor/tools/task';
import JoinApply from '@/executor/tools/task/joinApply';
import EntityInfo from '@/components/Common/EntityInfo';
import WorkForm from '@/components/DataStandard/WorkForm';
import Directory from '@/components/Directory';
import TaskStart from '@/executor/tools/task/start';
import PreviewLayout from './layout';
import FullScreenModal from '../Common/fullScreen';
import { IDevCompany } from '@/ts/core/target/developers/company';
import ReceptionTask from './task';
import { IReception } from '@/ts/core/work/assign/reception';
import { IWorkDarft } from '@/ts/core/work/draft';
import DraftWork from '@/executor/tools/task/start/draftWork';
import { IReportReception } from '@/ts/core/work/assign/reception/report';
import { TaskContentType } from '@/ts/base/model';
import GuidancePage from './guidance';

const officeExt = ['.md', '.pdf', '.xls', '.xlsx', '.doc', '.docx', '.ppt', '.pptx'];
const videoExt = ['.mp4', '.avi', '.mov', '.mpg', '.swf', '.flv', '.mpeg'];

type EntityType =
  | IEntity<schema.XEntity>
  | ISysFileInfo
  | ISession
  | IWorkTask
  | IDevCompany
  | IForm
  | ITarget
  | IWork
  | IReception
  | IWorkDarft
  | undefined;

type ArgsType = {
  empty: boolean;
  loading?: boolean;
  type: string;
};

/** 文件预览 */
const FilePreview: React.FC<{ file: ISysFileInfo }> = ({ file }) => {
  const data = file.filedata;
  if (data.contentType?.startsWith('image')) {
    return <ImageView share={data} />;
  }
  if (data.contentType?.startsWith('video') || videoExt.includes(data.extension ?? '-')) {
    return <VideoView share={data} />;
  }
  if (officeExt.includes(data.extension ?? '-')) {
    return <OfficeView share={data} />;
  }
  return <EntityInfo entity={file} column={1} />;
};

/** 数据预览 */
const DataPreview: React.FC<{
  entity?: EntityType;
  flag?: string;
  height?: string;
  finished?: () => void;
}> = ({ entity, flag, height, finished }) => {
  const [argsInfo, setArgs] = useState<ArgsType>();

  useEffect(() => {
    const id = command.subscribe((type, flag_, args: ArgsType) => {
      if (type != 'preview' || flag_ != 'guidance') return;
      setArgs(args);
    });
    return () => {
      command.unsubscribe(id);
    };
  }, []);
  const renderEntityBody = (entity: any, children?: React.ReactNode) => {
    return <PreviewLayout entity={entity}>{children && children}</PreviewLayout>;
  };
  if (entity && typeof entity != 'string') {
    if ('filedata' in entity) {
      return renderEntityBody(entity, <FilePreview key={entity.key} file={entity} />);
    }
    if ('activity' in entity) {
      return <SessionBody key={entity.key} session={entity} height={height} />;
    }
    if ('fields' in entity) {
      return renderEntityBody(entity, <WorkForm key={entity.key} form={entity} />);
    }
    if ('taskdata' in entity) {
      switch (entity.taskdata.taskType) {
        case '事项':
          if (['子流程', '起始'].includes(entity.metadata.typeName)) {
            return renderEntityBody(
              entity,
              <TaskStart key={entity.key} current={entity} finished={finished} />,
            );
          }
          return <TaskBody key={entity.key} current={entity} finished={() => {}} />;
        case '加用户':
          return renderEntityBody(
            entity,
            <>
              <JoinApply key={entity.key} current={entity} />
            </>,
          );
        default:
          return <></>;
      }
    }

    if ('node' in entity) {
      return renderEntityBody(entity, <TaskStart key={entity.key} current={entity} />);
    }
    if ('draftData' in entity) {
      return renderEntityBody(
        entity,
        <DraftWork key={entity.key} current={entity} finished={finished} />,
      );
    }
    if ('session' in entity) {
      switch (flag) {
        case 'store':
          return renderEntityBody(
            entity,
            <Directory key={entity.key} root={entity.directory} />,
          );
        case 'relation':
          return (
            <SessionBody
              key={entity.key}
              relation
              session={entity.session}
              height={height}
            />
          );
      }
    }
    if ('score' in entity) {
      return renderEntityBody(entity, <Directory key={entity.key} root={entity} />);
    }
    if ('period' in entity) {
      switch (entity.data.type) {
        case TaskContentType.Report:
          return renderEntityBody(
            entity,
            <ReceptionTask key={entity.key} reception={entity as IReportReception} />,
          );
      }
    }
    return renderEntityBody(entity);
  }
  return argsInfo?.empty ? (
    <GuidancePage type={argsInfo?.type} loading={argsInfo?.loading} />
  ) : (
    <></>
  );
};

/** 预览弹框 */
export const PreviewDialog: React.FC<{ entity?: EntityType; onCancel: () => void }> = ({
  entity,
  onCancel,
}) => {
  return (
    <FullScreenModal
      open
      fullScreen
      title={entity?.name}
      onCancel={onCancel}
      destroyOnClose
      width={'80vw'}
      bodyHeight={'70vh'}>
      <DataPreview entity={entity} flag="relation" height={'calc(100vh - 100px)'} />
    </FullScreenModal>
  );
};

export default DataPreview;

import ImageView from './image';
import VideoView from './video';
import React, { useEffect, useState } from 'react';
import FormView from './form';
import WorkStart from './work';
import TaskContent from './task';
import OfficeView from './office';
import TransferView from './transfer';
import AudioPlayer from './audio';
import EntityPreview from './entity';
import CodeEditor from './codeeditor';
import Directory from './directory';
import EntityForm from '../operate/entityForm';
import { IEntity, ISysFileInfo, TargetType } from '@/ts/core';
import JoinApply from './task/joinApply';
import { model, schema } from '@/ts/base';
import TemplateView from './page';
import MallTemplateView from './mallTemplate';
import ThingPreview from './thing';
import { PreviewDialog } from '@/components/DataPreview';
import PropertyModal from './property';
import SpeciesModal from './species';
import GroupDynamics from './groupdynamics';
import Print from './print';
import DistributionTask from './distributiontask';
import Distribution from './distribution';
import ReportTreeModal from '@/executor/design/reportTreeModal';
import { IDirectory } from '@/ts/core';
import DictFormView from './form/dictFormView';
import ViewView from './view';
import SpaceTemplateView from './spaceTemplate';

const audioExt = ['.mp3', '.wav', '.ogg'];

const officeExt = ['.md', '.pdf', '.xls', '.xlsx', '.doc', '.docx', '.ppt', '.pptx'];
const videoExt = ['.mp4', '.avi', '.mov', '.mpg', '.swf', '.flv', '.mpeg'];
const remarkTypes: any = {
  分类: 'Species',
  字典: 'Dict',
  属性: 'Property',
  目录: 'Dir',
  序列: 'Sequence',
};

interface IOpenProps {
  cmd: string;
  entity:
    | IEntity<schema.XEntity>
    | ISysFileInfo
    | model.FileItemShare
    | schema.XEntity
    | undefined;
  finished: () => void;
}
const ExecutorOpen: React.FC<IOpenProps> = (props: IOpenProps) => {
  const [dictLength, setDictLength] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const getDictLength = async () => {
      try {
        await (props.entity as any)?.load();
        const fields = await (props.entity as any)?.loadFields();
        const species = fields.filter((i: any) => i.options?.species);
        let sumOfLengths = species.reduce((total: number, obj: any) => {
          return total + obj.lookups.length;
        }, 0);
        setDictLength(sumOfLengths);
        setIsLoaded(true);
      } catch (error) {
        setIsLoaded(true);
      }
    };
    if (['表单', '报表', '视图'].includes((props.entity as schema.XEntity)?.typeName)) {
      getDictLength();
    } else {
      setIsLoaded(true);
    }
  }, [props.entity, isLoaded]);

  if (props.entity === undefined) return <></>;
  if (!isLoaded) return <></>;
  if ('size' in props.entity || 'filedata' in props.entity) {
    const data = 'size' in props.entity ? props.entity : props.entity.filedata;
    data.extension = data.extension?.toLowerCase();
    if (data.contentType?.startsWith('image')) {
      return <ImageView share={data} finished={props.finished} />;
    }
    if (
      data.contentType?.startsWith('video') ||
      videoExt.includes(data.extension ?? '-')
    ) {
      return <VideoView share={data} finished={props.finished} />;
    }
    if (officeExt.includes(data.extension ?? '-')) {
      return (
        <OfficeView
          share={data}
          finished={props.finished}
          current={props.entity as unknown as IDirectory}
        />
      );
    }
    if (
      data.contentType?.startsWith('audio') ||
      audioExt.includes(data.extension ?? '-')
    ) {
      const dir = 'filedata' in props.entity ? props.entity.directory : undefined;
      return <AudioPlayer finished={props.finished} directory={dir} share={data} />;
    }
    if (data.contentType?.startsWith('text')) {
      return <CodeEditor share={data} finished={props.finished} />;
    }
  } else if ('key' in props.entity) {
    switch (props.entity.typeName) {
      case '目录':
      case '应用':
      case '模块':
        return <Directory current={props.entity as any} finished={props.finished} />;
      case '表单':
      case '报表':
        if (dictLength && dictLength > 2000) {
          return (
            <DictFormView
              form={(props.entity as any)?.metadata}
              directory={(props.entity as any)?.directory}
              finished={props.finished}
            />
          );
        } else {
          return <FormView form={props.entity as any} finished={props.finished} />;
        }
      case '视图':
        return (
          <ViewView
            current={props.entity as any}
            cmdType={props.cmd}
            finished={props.finished}
          />
        );
      case '迁移配置':
        return <TransferView current={props.entity as any} finished={props.finished} />;
      case '页面模板':
        return <TemplateView current={props.entity as any} finished={props.finished} />;
      case '商城模板':
        return (
          <MallTemplateView current={props.entity as any} finished={props.finished} />
        );
      case '空间模板':
        return (
          <SpaceTemplateView current={props.entity as any} finished={props.finished} />
        );
      case '任务':
        return (
          <DistributionTask current={props.entity as any} finished={props.finished} />
        );
      case '分发任务':
        return <Distribution current={props.entity as any} finished={props.finished} />;
      case '报表树':
        return (
          <ReportTreeModal
            current={props.entity as any}
            readonly
            finished={props.finished}
          />
        );
      case '打印模板':
        return (
          <Print
            formType={'添加'}
            current={props.entity as any}
            finished={props.finished}
          />
        );
      case '办事':
      case '集群模板':
        return (
          <WorkStart
            key={props.entity.key}
            current={props.entity as any}
            finished={() => {
              props.finished();
            }}
          />
        );
      case '加用户':
        return (
          <>
            <JoinApply
              key={props.entity.key}
              current={props.entity as any}
              finished={props.finished}
            />
          </>
        );
      case '子流程':
        if (props.cmd === 'open') {
          return (
            <WorkStart
              key={props.entity.key}
              current={props.entity as any}
              finished={() => {
                props.finished();
              }}
            />
          );
        } else {
          return (
            <TaskContent
              key={props.entity.key}
              current={props.entity as any}
              finished={props.finished}
            />
          );
        }
      case '起始':
      case '事项':
        return (
          <TaskContent
            key={props.entity.key}
            current={props.entity as any}
            finished={props.finished}
          />
        );
      case '物详情':
      case '引用型':
        return (
          <ThingPreview
            key={props.entity.key}
            entity={props.entity as any}
            finished={props.finished}
          />
        );
      case '属性':
        return <PropertyModal current={props.entity as any} finished={props.finished} />;
      case '字典':
      case '分类':
        return <SpeciesModal current={props.entity as any} finished={props.finished} />;
      default:
        if (remarkTypes[props.entity.typeName]) {
          return (
            <EntityForm
              cmd={`remark${remarkTypes[props.entity.typeName]}`}
              entity={props.entity}
              finished={props.finished}
            />
          );
        }
        if (Object.values(TargetType).includes(props.entity.typeName as TargetType)) {
          return <PreviewDialog entity={props.entity} onCancel={props.finished} />;
        }
    }
  } else if ('metadata' in props.entity) {
    return <GroupDynamics share={props.entity} finished={props.finished} />;
  } else {
    return <EntityPreview entity={props.entity} finished={props.finished} />;
  }
  return <></>;
};

export default ExecutorOpen;

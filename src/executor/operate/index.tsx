import { IEntity, TargetType } from '@/ts/core';
import React from 'react';

import EntityForm from './entityForm';
import ActivityPublisher from './pubActivity';
import SettingAuth from './settingModal/settingAuth';
import SettingStation from './settingModal/settingStation';
import SettingIdentity from './settingModal/settingIdentity';
import { schema } from '@/ts/base';
import PullMember from './pullMember';
import JoinTarget from './joinTarget';
import FileTaskList from './fileTaskList';
import ReportTreeForm from './entityForm/ReportTreeForm';

const entityMap: any = {
  目录: 'Dir',
  应用: 'App',
  模块: 'Module',
  属性: 'Property',
  分类: 'Species',
  字典: 'Dict',
  角色: 'Identity',
  岗位: 'Station',
  办事: 'Work',
  集群模板: 'Work',
  迁移配置: 'TransferConfig',
  事项配置: 'WorkConfig',
  实体配置: 'ThingConfig',
  页面模板: 'PageTemplate',
  空间模板: 'PageTemplate',
  商城模板: 'PageTemplate',
  打印模板: 'Print',
  文档模板: 'DocumentTemplate',
  序列: 'Sequence',
  报表树: 'ReportTree',
  任务: 'DistributionTask',
};

interface IProps {
  cmd: string;
  args: any[];
  finished: () => void;
}
const ConfigExecutor: React.FC<IProps> = ({ cmd, args, finished }) => {
  if (Array.isArray(args) && args.length > 0) {
    switch (cmd) {
      case 'pull':
        return <PullMember finished={finished} current={args[0]} />;
      case 'taskList':
        return <FileTaskList directory={args[0]} finished={finished} />;
      case 'settingAuth':
        return <SettingAuth space={args[0].target} finished={finished} />;
      case 'settingIdentity':
        return <SettingIdentity target={args[0].target} finished={finished} />;
      case 'settingStation':
        return <SettingStation company={args[0].target} finished={finished} />;
      case 'pubActivity':
        return <ActivityPublisher activity={args[0]} finish={finished} />;
      case 'generateReportTree':
        return (
          <ReportTreeForm
            current={args[0]}
            formType="generateReportTree"
            finished={finished}
          />
        );
      case 'update':
        {
          const entity: IEntity<schema.XEntity> = args[0];
          if (
            entity.groupTags &&
            entity.groupTags.some((item) =>
              ['视图', '表单', '报表', '表格'].includes(item),
            )
          ) {
            if (entity.typeName === '表格') {
              return (
                <EntityForm cmd={cmd + 'Report'} entity={args[0]} finished={finished} />
              );
            } else {
              return (
                <EntityForm cmd={cmd + 'Form'} entity={args[0]} finished={finished} />
              );
            }
          }
          if (Object.keys(entityMap).includes(args[0].typeName)) {
            return (
              <EntityForm
                cmd={cmd + entityMap[args[0].typeName]}
                entity={args[0]}
                finished={finished}
              />
            );
          }
          if (Object.values(TargetType).includes(args[0].typeName as TargetType)) {
            return <EntityForm cmd={cmd} entity={args[0]} finished={finished} />;
          }
        }
        break;
      default:
        if (cmd.startsWith('join')) {
          return <JoinTarget cmd={cmd} current={args[0]} finished={finished} />;
        }
        return <EntityForm cmd={cmd} entity={args[0]} finished={finished} />;
    }
  }
  return <></>;
};

export default ConfigExecutor;

import { TargetType } from '@/ts/core';
import React from 'react';
import { Theme } from '@/config/theme';
import { Image } from 'antd';
interface TypeIconInfo {
  size?: number;
  iconType: string;
  name?: string;
}

/** 类型图标 */
const TypeIcon = (info: TypeIconInfo) => {
  const iconSize = info.size || 14;
  const config: any = { size: iconSize, color: Theme.FocusColor };
  const renderImage = (name: string, config: any) => {
    return (
      <Image
        width={config.size || 24}
        preview={false}
        src={`/svg/${name}.svg?v=1.0.1`}
        {...config}
      />
    );
  };
  const renderUserByName = (userName: string) => {
    const name =
      userName.length > 2 ? userName.substring(1, 3) : userName.substring(0, 2);
    const randomBg = ['blue', 'green', 'red', 'orange', 'asset', 'purple'].at(
      name.charCodeAt(1) % 6,
    );
    return (
      <div
        style={{
          width: iconSize,
          height: iconSize,
          lineHeight: iconSize + 'px',
          fontSize: iconSize / 3,
        }}
        className={`user-wrap user-wrap-bg_${randomBg}`}>
        {name}
      </div>
    );
  };
  const loadFileIcon = () => {
    switch (info.iconType) {
      case 'application/pdf':
        return renderImage('types/files/pdf', config);
      case 'application/x-zip-compressed':
        return renderImage('types/files/compressed', config);
      case 'application/vnd.ms-powerpoint':
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return renderImage('types/files/powerpoint', config);
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return renderImage('types/files/excel', config);
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return renderImage('types/files/word', config);
    }
    if (info.iconType?.startsWith('application')) {
      return renderImage('types/files/application', config);
    } else if (info.iconType?.startsWith('video')) {
      return renderImage('types/files/video', config);
    } else if (info.iconType?.startsWith('image')) {
      return renderImage('types/files/picture', config);
    } else if (info.iconType?.startsWith('text')) {
      return renderImage('types/files/text', config);
    } else if (info.iconType?.startsWith('audio')) {
      return renderImage('types/files/audio', config);
    }
    return renderImage('types/files/unknown', config);
  };

  const loadIcon = () => {
    switch (info.iconType) {
      case '加用户':
      case '加人员':
        return renderImage('types/joinFriend', config);
      case '加群组':
        return renderImage('types/joinCohort', config);
      case '加单位':
      case '加大学':
      case '加医院':
        return renderImage('types/joinCompany', config);
      case '加存储资源':
        return renderImage('types/joinStorage', config);
      case '加组织群':
        return renderImage('types/joinGroup', config);
      case '动态':
        return renderImage('types/activity', config);
      case '目录':
        return renderImage('types/directory', config);
      case '成员目录':
        return renderImage('types/cohort', config);
      case '字典':
        return renderImage('types/dictionary', config);
      case '分类':
        return renderImage('types/species', config);
      case '分类项':
        return renderImage('types/workSend', config);
      case '属性':
        return renderImage('types/property', config);
      case '应用':
        return renderImage('types/application', config);
      case '模块':
        return renderImage('types/module', config);
      case '序列':
        return renderImage('types/sequence', config);
      case '办事':
      case '集群模板':
        return renderImage('types/work', config);
      case '视图':
        return renderImage('types/view', config);
      case '表单':
        return renderImage('types/form', config);
      case '角色':
        return renderImage('types/identity', config);
      case '权限':
        return renderImage('types/authority', config);
      case '激活':
        return renderImage('operate/setActive', config);
      case '事项':
        return renderImage('types/apply', config);
      case '迁移配置':
        return renderImage('types/transfer', config);
      case '页面模板':
        return renderImage('types/page', config);
      case '空间模板':
        return renderImage('types/mallPhysical', config);
      case '商城模板-数据':
        return renderImage('types/mallData', config);
      case '商城模板-实体':
        return renderImage('types/mallPhysical', config);
      case '打印模板':
      case '文档模板':
        return renderImage('types/print', config);
      case '报表树':
        return renderImage('types/reportTree', config);
      case '任务':
        return renderImage('types/task', config);
      case '子流程':
      case 'setCluster':
        return renderImage('types/workSend', config);
      case TargetType.Group:
        return renderImage('types/group', config);
      case TargetType.Company:
        return renderImage('types/company', config);
      case TargetType.Storage:
        return renderImage('types/storage', config);
      case TargetType.Station:
        return renderImage('types/station', config);
      case TargetType.Cohort:
        return renderImage('types/cohort', config);
      case TargetType.Section:
        return renderImage('types/section', config);
      case TargetType.Department:
        return renderImage('types/department', config);
      case TargetType.College:
        return renderImage('types/college', config);
      case TargetType.Laboratory:
        return renderImage('types/laboratory', config);
      case TargetType.Office:
        return renderImage('types/office', config);
      case TargetType.Research:
        return renderImage('types/research', config);
      case TargetType.Working:
        return renderImage('types/working', config);
      case TargetType.Person:
        if (info.name && info.name.length > 1) {
          return renderUserByName(info.name);
        }
        return renderImage('types/person', config);
      case 'newDir':
        return renderImage('operate/newDir', config);
      case 'refresh':
        return renderImage('operate/refresh', config);
      case 'remark':
        return renderImage('operate/remark', config);
      case 'open':
        return renderImage('operate/open', config);
      case 'design':
        return renderImage('operate/design', config);
      case 'copy':
        return renderImage('operate/copy', config);
      case 'move':
        return renderImage('operate/move', config);
      case 'parse':
        return renderImage('operate/parse', config);
      case 'rename':
        return renderImage('operate/rename', config);
      case 'download':
        return renderImage('operate/download', config);
      case 'delete':
        return renderImage('operate/delete', config);
      case 'hardDelete':
        return renderImage('operate/hardDelete', config);
      case 'shortcut':
        return renderImage('operate/shortcut', config);
      case 'restore':
        return renderImage('operate/restore', config);
      case 'remove':
        return renderImage('operate/removeMember', config);
      case 'update':
        return renderImage('operate/update', config);
      case 'pull':
        return renderImage('operate/pullMember', config);
      case 'joinFriend':
        return renderImage('operate/joinFriend', config);
      case 'joinCohort':
        return renderImage('operate/joinCohort', config);
      case 'joinCompany':
        return renderImage('operate/joinCompany', config);
      case 'joinStorage':
        return renderImage('operate/joinStorage', config);
      case 'joinDepartment':
        return renderImage('operate/joinDepartment', config);
      case 'joinGroup':
        return renderImage('operate/joinGroup', config);
      case 'qrcode':
        return renderImage('operate/qrcode', config);
      case 'newCohort':
        return renderImage('operate/newCohort', config);
      case 'newCompany':
        return renderImage('operate/newCompany', config);
      case 'newStorage':
        return renderImage('operate/newStorage', config);
      case 'newGroup':
        return renderImage('operate/newGroup', config);
      case 'newDepartment':
        return renderImage('operate/newDepartment', config);
      case 'newApp':
        return renderImage('operate/newApplication', config);
      case 'newModule':
        return renderImage('operate/newModule', config);
      case 'newProperty':
        return renderImage('operate/newProperty', config);
      case 'newForm':
      case 'newView':
        return renderImage('operate/newForm', config);
      case 'newWork':
        return renderImage('operate/newWork', config);
      case 'newDict':
        return renderImage('operate/newDict', config);
      case 'newSpecies':
        return renderImage('operate/newSpecies', config);
      case 'newPage':
        return renderImage('operate/newPage', config);
      case 'newTransfer':
        return renderImage('operate/newTransfer', config);
      case 'newFile':
        return renderImage('operate/uploadFile', config);
      case 'copyRevision':
        return renderImage('operate/copyRevision', config);
      case 'lookRevision':
        return renderImage('operate/lookRevision', config);
      case 'lookSubscribe':
        return renderImage('operate/lookSubscribe', config);
      case 'subscribe':
        return renderImage('operate/subscribeUpdate', config);
      case 'subscribeUpdate':
        return renderImage('operate/subscribeUpdate', config);
      case 'settingStation':
        return renderImage('types/station', config);
      case 'taskList':
        return renderImage('operate/taskList', config);
      case 'selectChat':
        return renderImage('operate/selectChat', config);
      case 'openChat':
        return renderImage('operate/openChat', config);
      case 'setReaded':
        return renderImage('operate/setReaded', config);
      case 'setNoReaded':
        return renderImage('operate/setNoReaded', config);
      case 'setPageTab':
      case 'setCommon':
      case 'setToping':
        return renderImage('operate/setCommon', config);
      case 'delPageTab':
      case 'delCommon':
      case 'removeToping':
        return renderImage('operate/delCommon', config);
      case 'distribute':
        return renderImage('operate/distribute', config);
      case 'hslSplit':
        return renderImage('operate/hslSplit', config);
      case 'importStandard':
        return renderImage('operate/importStandard', config);
      case 'importBusiness':
        return renderImage('operate/importBusiness', config);
      case 'fullScreen':
        return renderImage('operate/fullScreen', config);
      case 'centerScreen':
        return renderImage('operate/centerScreen', config);
      case 'check':
        return renderImage('operate/check', config);
      case 'close':
        return renderImage('operate/close', config);
      case 'newReportTree':
        return renderImage('operate/newReportTree', config);
      case 'genSpecies':
        return renderImage('operate/genSpecies', config);
      case 'setHomeTop':
        return renderImage('operate/setHomeTop', config);
      case 'delHomeTop':
        return renderImage('operate/delHomeTop', config);
      default:
        return loadFileIcon();
    }
  };
  return loadIcon();
};

export default TypeIcon;

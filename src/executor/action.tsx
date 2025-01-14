import React, { useEffect, useRef, useState } from 'react';
import {
  IApplication,
  IDirectory,
  IEntity,
  IFile,
  IGroup,
  IMemeber,
  ISession,
  IStorage,
  ISysDirectoryInfo,
  ISysFileInfo,
  ITarget,
  IWork,
  IWorkTask,
} from '@/ts/core';
import orgCtrl from '@/ts/controller';
import QrCode from 'qrcode.react';
import { command, kernel, model, schema } from '@/ts/base';
import { Button, List, Modal, Progress, Space, Upload } from 'antd';
import message from '@/utils/message';
import { uploadBusiness, uploadStandard } from './tools/uploadTemplate';
import TypeIcon from '@/components/Common/GlobalComps/typeIcon';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { shareOpenLink } from '@/utils/tools';
import { XStandard } from '@/ts/base/schema';
import { IStandardFileInfo } from '@/ts/core/thing/fileinfo';
import { Revisions, Subscriptions } from './tools/revision';
import { ActionType } from '@ant-design/pro-components';
import { ISubscription } from '@/ts/core/thing/subscribe';
import { CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import MemberBox from '@/components/DataStandard/WorkForm/Viewer/customItem/memberBox';
import { IVersion } from '@/ts/core/thing/standard/version';
import { $confirm } from '@/utils/react/antd';
import { IReception } from '@/ts/core/work/assign/reception';
/** 执行非页面命令 */
export const executeCmd = (cmd: string, entity: any) => {
  switch (cmd) {
    case 'qrcode':
      return entityQrCode(entity);
    case 'reload':
      return directoryRefresh(entity, true);
    case 'refresh':
      return directoryRefresh(entity, false);
    case 'openChat':
      return openChat(entity);
    case 'download':
      if ('shareInfo' in entity) {
        const link = (entity as ISysFileInfo).shareInfo().shareLink;
        window.open(shareOpenLink(link, true), '_black');
      }
      return;
    case 'copy':
    case 'move':
    case 'distribute':
    case 'copyRevision':
      return setCopyFiles(cmd, entity);
    case 'parse':
      return copyBoard(entity);
    case 'delete':
      return deleteEntity(entity, false);
    case 'hardDelete':
      return deleteEntity(entity, true);
    case 'shortcut':
      return createShortcut(entity);
    case 'restore':
      return restoreEntity(entity);
    case 'remove':
      return removeMember(entity);
    case 'newFile':
      return uploadFile(entity, (file) => {
        if (file) {
          entity.changCallback();
        }
      });
    case 'workForm':
      return openWork(entity);
    case 'standard':
      return uploadStandard(entity);
    case 'business':
      return uploadBusiness(entity);
    case 'online':
    case 'outline':
      return onlineChanged(cmd, entity);
    case 'activate':
      return activateStorage(entity);
    case 'hslSplit':
      return videoHslSplit(entity);
    case 'removeSession':
      return removeSession(entity);
    case 'topingToggle':
      return sessionTopingToggle(entity);
    case 'readedToggle':
      return sessionReadedToggle(entity);
    case 'commonToggle':
      return commonToggle(entity);
    case 'companyCommonToggle':
      return commonToggle(entity, true);
    case 'setPageTab':
      return pageTabChange(entity);
    case 'applyFriend':
      return applyFriend(entity);
    case 'quit':
      return quitTeam(entity);
    case 'lookRevision':
      return loadRevisions(entity);
    case 'lookSubscribes':
      return lookSubscribes(entity);
    case 'subscribe':
      return subscribe(entity);
    case 'cancelSubscribe':
      return cancelSubscribe(entity);
    case 'subscribeUpdate':
      return subscribeUpdate(entity);
    case 'transferBelong':
      return transferBelong(entity);
    case 'switchVersion':
      return versionCtrl(entity, 'switchVersion');
    case 'deleteVersion':
      return versionCtrl(entity, 'deleteVersion');
    case 'withDrawWorkTask':
      return withDrawWorkTask(entity);
    case 'correctWorkTask':
      return correctWorkTask(entity);
    case 'cancelReceptionTask':
      return cancelReceptionTask(entity);
  }
  return false;
};

/** 刷新目录 */
const directoryRefresh = (dir: IDirectory | IApplication, reload: boolean) => {
  dir.loadContent(reload).then(() => {
    orgCtrl.changCallback();
  });
};

/** 激活存储 */
const activateStorage = (store: IStorage) => {
  store.activateStorage();
};

/** 视频切片 */
const videoHslSplit = (file: ISysFileInfo) => {
  const modal = Modal.confirm({
    title: '切片前确认',
    content: `视频截屏需要较长的时间,默认等待时间为2s,
              如果提示超时并非失败,请等待片刻后尝试刷新。`,
    okText: '确认切片',
    cancelText: '取消',
    onOk: async () => {
      await file.hslSplit();
      modal.destroy();
    },
    onCancel: () => {
      modal.destroy();
    },
  });
};

/** 移除会话 */
const removeSession = (entity: ISession) => {
  entity.chatdata.recently = false;
  entity.chatdata.lastMessage = undefined;
  entity.cacheChatData();
  command.emitterFlag('session', true);
  command.emitter('preview', 'chat', undefined);
};

/** 会话置顶变更 */
const sessionTopingToggle = (entity: ISession) => {
  entity.chatdata.isToping = !entity.chatdata.isToping;
  entity.cacheChatData();
  command.emitterFlag('session', true);
};

/** 会话已读/未读变更 */
const sessionReadedToggle = (entity: ISession) => {
  if (entity.chatdata.noReadCount > 0) {
    entity.chatdata.noReadCount = 0;
  } else {
    entity.chatdata.noReadCount = 1;
  }
  entity.cacheChatData();
  command.emitterFlag('session', true);
};

/** 常用标签变更 */
const commonToggle = (entity: IFile, isCompany: boolean = false) => {
  entity.toggleCommon(isCompany).then((success: boolean) => {
    if (success) {
      message.info('设置成功');
    }
  });
};
const pageTabChange = (entity: IFile) => {
  orgCtrl.home.switchTops(entity.id).then((success: boolean) => {
    if (success) {
      message.info('设置成功');
    }
  });
};
/** 申请加为好友 */
const applyFriend = (entity: ISession) => {
  orgCtrl.user.applyJoin([entity.metadata as schema.XTarget]).then(() => {
    orgCtrl.changCallback();
  });
};

/** 退出单位、部门、组织群 */
const quitTeam = (target: ITarget) => {
  if (!target) return;
  const modal = Modal.confirm({
    title: `确定退出${target.name}`,
    content: ``,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      await target.removeMembers([orgCtrl.user.metadata]).then((success: boolean) => {
        if (success) {
          orgCtrl.user.deepLoad(true);
          orgCtrl.user.directory.loadContent(true);
          orgCtrl.changCallback();
        }
      });
      modal.destroy();
    },
    onCancel: () => {
      modal.destroy();
    },
  });
};

/** 进入办事 */
const openWork = (entity: IWork) => {
  orgCtrl.currentKey = entity.key;
  orgCtrl.changCallback();
};

/** 拷贝/剪切文件 */
const setCopyFiles = async (cmd: string, file: IFile) => {
  const typeNameArr = ['表单', '报表', '视图', '目录', '应用'];
  if (typeNameArr.includes(file.typeName)) {
    await (file as any).load();
  }
  const key = cmd + '_' + file.id;
  for (const k of orgCtrl.user.copyFiles.keys()) {
    if (k.endsWith(file.id)) {
      orgCtrl.user.copyFiles.delete(k);
    }
  }
  orgCtrl.user.copyFiles.set(key, file);
  message.info(`${file.name}已放入剪切板`);
};

function isDirectory(file: IFile): file is IDirectory {
  return file.typeName == '目录';
}

function checkCycle(dir: IDirectory, target: IDirectory): true | string {
  if (target.isShortcut) {
    return '不能将目录移动到快捷方式中';
  }

  // 此处的id都是真实目录id
  if (dir.id == target.id) {
    return '移动的目标不能是自身';
  }

  let parent = target.parent;
  while (parent) {
    if (parent.id == dir.id) {
      return '移动的目标不能是自身的子目录中';
    }
    parent = parent.parent;
  }
  return true;
}

/** 剪贴板操作 */
const copyBoard = (dir: IDirectory) => {
  const accepts: string[] = (dir as any).accepts ?? [];
  if (accepts.length < 1) return;
  const datasource: { key: string; cmd: string; file: IFile }[] = [];
  for (const item of orgCtrl.user.copyFiles.entries()) {
    if (
      accepts.includes(item[1].typeName) ||
      (accepts.includes('文件') && 'filedata' in item[1])
    ) {
      datasource.push({
        key: item[0],
        cmd: item[0].split('_')[0],
        file: item[1],
      });
    }
  }
  const modal = Modal.confirm({
    icon: <></>,
    width: 500,
    cancelText: '取消',
    okText: '全部',
    onOk: async () => {
      for (const item of datasource) {
        switch (item.cmd) {
          case 'copy':
            await item.file.copy(dir);
            break;
          case 'move':
            if (isDirectory(item.file)) {
              let result = checkCycle(item.file, dir);
              if (typeof result === 'string') {
                message.warn(result);
                modal.destroy();
                return;
              }
            }
            await item.file.move(dir);
            break;
          case 'distribute':
            if ('distribute' in item.file && typeof item.file.distribute == 'function') {
              await item.file.distribute(dir);
            }
            break;
          case 'copyRevision':
            await dir.target.space.manager.create(item.file);
            break;
          default:
            break;
        }
        orgCtrl.user.copyFiles.delete(item.key);
      }
      orgCtrl.changCallback();
      modal.destroy();
    },
    content: (
      <List
        itemLayout="horizontal"
        dataSource={datasource}
        renderItem={({ key, cmd, file }) => {
          var cmdType = '未知';
          switch (cmd) {
            case 'copy':
              cmdType = '复制';
              break;
            case 'move':
              cmdType = '移动';
              break;
            case 'distribute':
              cmdType = '分发';
              break;
            case 'copyRevision':
              cmdType = '更新';
              break;
            default:
              break;
          }
          return (
            <List.Item
              style={{ cursor: 'pointer', padding: 6 }}
              actions={[
                <div key={file.name} style={{ width: 60 }}>
                  {cmdType}
                </div>,
              ]}
              onClick={async () => {
                modal.destroy();
                switch (cmd) {
                  case 'copy':
                    await file.copy(dir);
                    break;
                  case 'move':
                    await file.move(dir);
                    break;
                  case 'distribute':
                    if ('distribute' in file && typeof file.distribute == 'function') {
                      await file.distribute(dir);
                    }
                    break;
                  case 'copyRevision':
                    await dir.target.space.manager.create(file);
                    break;
                  default:
                    break;
                }
                orgCtrl.user.copyFiles.delete(key);
                orgCtrl.changCallback();
              }}>
              <List.Item.Meta
                avatar={<TypeIcon iconType={file.typeName} size={50} />}
                title={<strong>{file.name}</strong>}
                description={<EntityIcon entityId={file.directory.belongId} showName />}
              />
            </List.Item>
          );
        }}
      />
    ),
  });
};

/** 打开会话 */
const openChat = (entity: IMemeber | ITarget | ISession) => {
  const session = 'sessionId' in entity ? entity : entity.session;
  if (session) {
    session.chatdata.recently = true;
    session.chatdata.lastMsgTime = new Date().getTime();
    session.cacheChatData();
    command.emitter('executor', 'link', '/chat');
    setTimeout(() => {
      command.emitter('session', 'open', session);
    }, 200);
  }
};

/** 恢复实体 */
const restoreEntity = (entity: IFile) => {
  entity.restore().then((success: boolean) => {
    if (success) {
      orgCtrl.changCallback();
    }
  });
};

/** 删除实体 */
const deleteEntity = (entity: IFile, hardDelete: boolean) => {
  Modal.confirm({
    okText: '确认',
    cancelText: '取消',
    title: '删除询问框',
    content: (
      <div style={{ fontSize: 16 }}>
        确认要{hardDelete ? '彻底' : ''}删除{entity.typeName}[{entity.name}]吗?
      </div>
    ),
    onOk: async () => {
      try {
        const success = await (hardDelete ? entity.hardDelete() : entity.delete());
        if (success) {
          orgCtrl.changCallback();
        }
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error));
      }
    },
  });
};

/** 移除成员 */
const removeMember = (member: IMemeber) => {
  Modal.confirm({
    icon: <></>,
    title: `确认要移除成员[${member.name}]吗?`,
    onOk: () => {
      member.directory.target
        .removeMembers([member.metadata])
        .then((success: boolean) => {
          if (success) {
            orgCtrl.changCallback();
          }
        });
    },
  });
};

/** 实体二维码 */
const entityQrCode = (entity: IEntity<schema.XEntity>) => {
  Modal.info({
    icon: <></>,
    okText: '关闭',
    maskClosable: true,
    content: (
      <div style={{ textAlign: 'center' }}>
        <QrCode
          level="H"
          size={300}
          fgColor={'#204040'}
          value={`${location.origin}/${entity.id}`}
          imageSettings={{
            src: entity.share.avatar?.thumbnail ?? '',
            width: 80,
            height: 80,
            excavate: true,
          }}
        />
        <div
          style={{
            fontSize: 22,
            marginTop: 10,
          }}>
          {entity.name}
        </div>
      </div>
    ),
  });
};

/** 上下线提醒 */
const onlineChanged = (cmd: string, info: model.OnlineInfo) => {
  if (info.userId != '0') {
    orgCtrl.user.findEntityAsync(info.userId).then((target) => {
      if (target) {
        if (cmd === 'online') {
          message.info(`${target.name} [${target.code}] 从${info.remoteAddr}上线啦`);
        } else {
          message.error(`${target.name} [${target.code}] 从${info.remoteAddr}下线啦`);
        }
      }
    });
  }
};

/** 文件上传 */
const uploadFile = (
  dir: ISysDirectoryInfo,
  uploaded?: (file: IFile | undefined) => void,
) => {
  const acceptFiles =
    '.img,.jpeg,.jpg,.png,.svg,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.dcm,.md,.tsx,.ts,.js,.jsx,.vue,.html,.java,.json,.mp3,.mp4,.mov,.wav,.avi';
  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    width: 610,
    title: '文件上传',
    maskClosable: true,
    content: (
      <Upload
        multiple
        type={'drag'}
        maxCount={100}
        showUploadList={false}
        accept={acceptFiles}
        style={{ width: 550, height: 300 }}
        customRequest={async (options) => {
          const fileNameArr = options.file.name.split('.');
          const uploadFileType = fileNameArr[fileNameArr.length - 1];
          if (uploadFileType && !acceptFiles.includes(uploadFileType)) {
            return message.error('不支持上传该文件');
          }
          modal.destroy();
          command.emitter('executor', 'taskList', dir);
          const file = options.file as File;
          if (file) {
            uploaded?.apply(this, [await dir.createFile(file.name, file)]);
          }
        }}>
        <div style={{ color: 'limegreen', fontSize: 22 }}>点击或拖拽至此处上传</div>
      </Upload>
    ),
  });
};

/** 创建快捷方式 */
const createShortcut = async (entity: IStandardFileInfo<XStandard>) => {
  if (await entity.createShortcut()) {
    orgCtrl.changCallback();
  }
};

const RevisionContent = (props: { file: IFile }) => {
  const ref = useRef<ActionType>();
  return (
    <Revisions
      actionRef={ref}
      request={async (params) => {
        const result = await props.file.recorder.loadRevisions({
          skip: (params.current - 1) * params.pageSize,
          take: params.pageSize,
        });
        return { data: result.data, success: true, total: result.totalCount };
      }}
      toolBar={() => [
        <Button
          key="clear"
          onClick={async () => {
            const modal = Modal.confirm({
              title: '删除前确认',
              content: `确认删除${props.file.name}的所有变化吗？`,
              okText: '确认',
              cancelText: '取消',
              onOk: async () => {
                modal.destroy();
                await props.file.recorder.clear();
                ref.current?.reload();
              },
              onCancel: () => {
                modal.destroy();
              },
            });
          }}>
          清空所有变化
        </Button>,
      ]}
      operate={() => {
        return {
          title: '操作',
          render: (_, item) => {
            return (
              <Space>
                <a
                  onClick={() => {
                    const modal = Modal.confirm({
                      title: '删除前确认',
                      content: `确认删除${item.data.name}的变化吗？`,
                      okText: '确认',
                      cancelText: '取消',
                      onOk: async () => {
                        modal.destroy();
                        await props.file.recorder.delete(item);
                        ref.current?.reload();
                      },
                      onCancel: () => {
                        modal.destroy();
                      },
                    });
                  }}>
                  删除
                </a>
              </Space>
            );
          },
        };
      }}
    />
  );
};

/** 变动明细 */
const loadRevisions = (file: IFile) => {
  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    width: '80%',
    title: '变动明细',
    maskClosable: true,
    onOk: () => modal.destroy(),
    onCancel: () => modal.destroy(),
    content: <RevisionContent file={file} />,
  });
};

/** 订阅列表 */
const lookSubscribes = (file: IFile) => {
  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    width: '80%',
    title: '订阅列表',
    maskClosable: true,
    onOk: () => modal.destroy(),
    onCancel: () => modal.destroy(),
    content: <Subscriptions file={file} />,
  });
};

interface CreateProps {
  file: IFile;
}

const Creating = ({ file }: CreateProps) => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    file
      .copy(file.directory.target.space.directory)
      .then(() => message.info('更新成功'))
      .catch(() => message.error('更新失败'))
      .finally(async () => {
        setLoading(false);
        await file.directory.target.space.manager.upsert({
          id: file.id,
          name: file.name,
          typeName: file.typeName,
          target: file.directory.target.metadata,
          relations: file.directory.target.relations,
        } as schema.XSubscription);
        file.directory.changCallback();
      });
  }, []);
  if (loading) {
    return (
      <Space>
        <LoadingOutlined />
        <div>订阅中</div>
      </Space>
    );
  }
  return (
    <Space>
      <CheckOutlined />
      <div>订阅成功</div>
    </Space>
  );
};

const subscribe = async (file: IFile) => {
  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    title: '内容订阅',
    maskClosable: true,
    onOk: () => modal.destroy(),
    onCancel: () => modal.destroy(),
    content: <Creating file={file} />,
  });
};

const cancelSubscribe = async (file: IFile) => {
  const subscription = file.directory.target.space.manager.find(file.id);
  if (subscription) {
    await file.directory.target.space.manager.remove(subscription.metadata);
    file.directory.changCallback();
    message.info('取消成功');
  }
};

interface UpdateProps {
  file: IFile;
  subscription: ISubscription;
}

const RevisionUpdate = (props: UpdateProps) => {
  const ref = useRef<ActionType>();
  return (
    <Revisions
      actionRef={ref}
      request={async (params) => {
        const result = await props.subscription.loadRevisions({
          skip: (params.current - 1) * params.pageSize,
          take: params.pageSize,
        });
        return { data: result.data, success: true, total: result.totalCount };
      }}
    />
  );
};

const Updating = (props: UpdateProps) => {
  const [percent, setPercent] = useState(0);
  useEffect(() => {
    props.subscription
      .syncing((current, total) => {
        if (total <= 0) {
          setPercent(100);
          return;
        }
        return setPercent(Number(((current * 100) / total).toFixed(2)));
      })
      .then(() => message.info('更新成功'))
      .catch(() => message.error('更新失败'))
      .finally(async () => {
        await props.file.directory.loadContent(true);
        props.file.directory.changCallback();
      });
  }, []);
  return <Progress percent={percent} />;
};

const subscribeUpdate = (file: IFile) => {
  const subscription = file.directory.target.space.manager.find(file.id);
  if (subscription) {
    const modal = Modal.info({
      icon: <></>,
      okText: '更新',
      cancelText: '关闭',
      width: '80%',
      title: '变动明细',
      maskClosable: true,
      onOk: () => {
        modal.destroy();
        const inner = Modal.info({
          icon: <></>,
          okText: '关闭',
          title: '更新中',
          maskClosable: true,
          onOk: () => inner.destroy(),
          onCancel: () => inner.destroy(),
          content: <Updating file={file} subscription={subscription} />,
        });
      },
      onCancel: () => modal.destroy(),
      content: <RevisionUpdate file={file} subscription={subscription} />,
    });
  }
};

/** 转变归属 */
const transferBelong = async (entity: IGroup) => {
  const modal = Modal.confirm({
    icon: <></>,
    title: '转变归属',
    okText: '确认',
    cancelText: '取消',
    content: <MemberBox target={entity.metadata} teamId={entity.id} />,
    onOk: async () => {
      // TODO 需要实现归属转变逻辑
      modal.destroy();
    },
    onCancel: () => {
      modal.destroy();
    },
  });
};

const versionCtrl = async (entity: IVersion, cmd: string) => {
  await $confirm({
    title: '版本操作',
    content: `确定 ${cmd == 'switchVersion' ? '把当前版本设为在用' : '删除此版本'} 吗？`,
    okText: '确定',
    cancelText: '取消',
  });
  switch (cmd) {
    case 'switchVersion':
      await entity.load();
      entity.switchToVersion();
      break;
    case 'deleteVersion':
      entity.deleteVersion();
      break;
    default:
      break;
  }
};
/** 撤回办事 */
const withDrawWorkTask = (entity: IWorkTask) => {
  Modal.confirm({
    okText: '确认',
    cancelText: '取消',
    title: '撤回办事询问框',
    content: (
      <div style={{ fontSize: 16 }}>
        确认要撤回{entity.typeName}[{entity.name}]吗?
      </div>
    ),
    onOk: async () => {
      try {
        const success = await entity.recallApply();
        if (success) {
          orgCtrl.changCallback();
        } else {
          message.warn('tb_work_instance 没有找到');
        }
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error));
      }
    },
  });
};

/** 校准办事 */
const correctWorkTask = (entity: IWorkTask) => {
  Modal.confirm({
    okText: '确认',
    cancelText: '取消',
    title: '校准办事询问框',
    content: (
      <div style={{ fontSize: 16 }}>
        确认要校准{entity.typeName}[{entity.name}]吗?
      </div>
    ),
    onOk: async () => {
      try {
        if (entity.taskdata.instanceId) {
          const res = await kernel.correctInstance({ id: entity.taskdata.instanceId });
          if (res.success) {
            orgCtrl.changCallback();
          } else {
            message.warn(res.msg);
          }
        } else {
          message.warn('流程实例ID为空');
        }
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error));
      }
    },
  });
};

/** 取消任务接收 */
const cancelReceptionTask = (entity: IReception) => {
  Modal.confirm({
    okText: '确认',
    cancelText: '取消',
    title: '取消任务接收',
    content: (
      <div style={{ fontSize: 16 }}>
        确认要取消{entity.typeName}[{entity.name}]吗?
      </div>
    ),
    onOk: async () => {
      try {
        if (entity.metadata.receiveUserId === orgCtrl.user.id) {
          entity.metadata.receiveUserId = '';
          const res = await entity.group.resource.publicTaskReceptionColl.update(
            entity.metadata.id,
            entity.metadata,
          );
          if (res) {
            orgCtrl.changCallback();
          }
        } else {
          message.warn('取消任务接收失败');
        }
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error));
      }
    },
  });
};

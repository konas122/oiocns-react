import React, { ReactNode } from 'react';
import { Avatar, Spin } from 'antd';
import orgCtrl from '@/ts/controller';
import { ShareIcon } from '@/ts/base/model';
import { command, parseAvatar, schema } from '@/ts/base';
import TypeIcon from './typeIcon';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { ImInfo } from 'react-icons/im';
import { IBelong } from '@/ts/core';
import { isSnowflakeId } from '@/ts/base/common';
import { TemplateType } from '@/ts/core/public/enums';

interface teamTypeInfo {
  size?: number;
  iconSize?: number;
  entityId?: string;
  entity?: schema.XEntity;
  typeName?: string;
  title?: string;
  showName?: boolean;
  showCode?: boolean;
  disableInfo?: boolean;
  onClick?: (entity?: schema.XEntity) => void;
  belong?: IBelong;
  showImInfo?: boolean;
  tags?: string[];
  empty?: ReactNode;
}

interface shareIconInfo extends teamTypeInfo {
  share?: ShareIcon & { code?: string };
}

/** 实体图标 */
const EntityIcon = (info: teamTypeInfo) => {
  const getEntity = () => {
    if (info.entity) {
      return info.entity;
    }
    if (info.entityId && isSnowflakeId(info.entityId)) {
      return orgCtrl.user.findMetadata<schema.XEntity>(info.entityId);
    }
  };
  const entity = getEntity();
  let typeName = entity?.typeName as string;
  if (entity?.typeName === '商城模板') {
    typeName =
      entity?.template === TemplateType.dataTemplate ? '商城模板-数据' : '商城模板-实体';
  }
  const loadIconItem = () => {
    if (entity) {
      return (
        <ShareIconItem
          {...info}
          share={{
            name: entity.name,
            typeName,
            code: entity.code,
            avatar: parseAvatar(entity.icon),
          }}
        />
      );
    } else {
      return <ShareIconById {...info} />;
    }
  };

  return <div className="entityIcon">{loadIconItem()}</div>;
};

/** 实体ID查找 */
const ShareIconById = (info: shareIconInfo) => {
  if (info.entityId) {
    const [loaded, entity] = useAsyncLoad(() => {
      if (info.belong && info.typeName) {
        return info.belong.resource.findEntityById(
          info.entityId!,
          info.typeName,
          info.entity?.shareId,
        );
      }
      return orgCtrl.user.findEntityAsync(info.entityId!);
    }, [info.entityId]);
    if (!loaded) {
      return <Spin size="small" delay={10} />;
    }
    if (entity) {
      return (
        <ShareIconItem
          {...info}
          share={{
            name: entity.name,
            typeName: entity.typeName,
            code: entity.code,
            avatar: parseAvatar(entity.icon),
          }}
        />
      );
    }
  }
  if (info.typeName) {
    return <ShareIconItem {...info} />;
  }
  return info.empty || <></>;
};

/** 实体图标 */
export const ShareIconItem = (info: shareIconInfo) => {
  const size = info.size ?? 22;
  const fontSize = size > 14 ? 14 : size;
  const infoMore = () => {
    if (info.disableInfo !== true && info.entity && size > 18) {
      return (
        <span
          style={{
            position: 'absolute',
            zIndex: 101,
            fontSize: 12,
            top: '-8px',
            left: '-9px',
            width: 4,
          }}>
          {!info.showImInfo && (
            <ImInfo
              color={'#abc'}
              onClick={(e) => {
                e.stopPropagation();
                let typeName = info.entity?.typeName as string;
                if (info.entity?.typeName === '商城模板') {
                  typeName =
                    info.entity?.template === TemplateType.dataTemplate
                      ? '商城模板-数据'
                      : '商城模板-实体';
                }
                command.emitter(
                  'executor',
                  'open',
                  {
                    ...info.entity,
                    typeName,
                  },
                  'preview',
                );
              }}
            />
          )}
        </span>
      );
    }
    return <></>;
  };
  if (info.share) {
    if (info.share.avatar?.thumbnail) {
      return (
        <span
          style={{ display: 'contents', cursor: 'pointer', position: 'relative' }}
          title={info.title ?? ''}
          onClick={() => info.onClick?.apply(this, [info.entity])}>
          {infoMore()}
          <div>
            <Avatar
              size={info.iconSize || size}
              src={info.share.avatar.thumbnail}
              className="avatarIcon"
            />
            {info.showName && (
              <strong className="pickupName" style={{ fontSize: fontSize }}>
                {info.share.name}
              </strong>
            )}
            {info.showCode && (
              <strong className="pickupName">({info.share?.code})</strong>
            )}
          </div>
        </span>
      );
    } else {
      const icon = (
        <TypeIcon
          name={info.share.name}
          iconType={info.share.typeName || info.typeName || '其它'}
          size={info.iconSize || size}
        />
      );
      return (
        <span
          style={{ display: 'flex', cursor: 'pointer' }}
          onClick={() => info.onClick?.apply(this, [info.entity])}>
          {infoMore()}
          <div>
            {icon}
            {info.showName && (
              <b className="pickupName" style={{ fontSize: fontSize }}>
                {info.share.name}
              </b>
            )}
            {info.showCode && (
              <strong className="pickupName">({info.share?.code})</strong>
            )}
          </div>
        </span>
      );
    }
  }
  return (
    <span
      style={{ display: 'contents', cursor: 'pointer' }}
      title={info.title ?? ''}
      onClick={() => info.onClick?.apply(this, [info.entity])}>
      {infoMore()}
      <TypeIcon iconType={'其它'} size={size} name={info.entity?.name} />
      {info.showName && <strong className="pickupName">{info.entity?.id}</strong>}
      {info.showCode && <strong className="pickupName">({info.entity?.code})</strong>}
    </span>
  );
};

export default EntityIcon;

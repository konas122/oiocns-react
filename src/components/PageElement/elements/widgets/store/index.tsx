import React, { useEffect, useState } from 'react';
import { ExistTypeMeta } from '@/ts/element/ElementMeta';
import { SEntity } from '@/ts/element/standard';
import { Context } from '../../../render/PageContext';
import { defineElement } from '../../defineElement';
import orgCtrl from '@/ts/controller';
import { Divider, Space } from 'antd';
import { formatSize } from '@/ts/base/common';
import { model } from '@/ts/base';
import { TargetType } from '@/ts/core';
import { useHistory } from 'react-router-dom';

interface IProps {
  height: number;
  url?: SEntity;
  props: any;
  ctx: Context;
}

const View: React.FC<IProps> = () => {
  const history = useHistory();
  const [noStore, setNoStore] = useState(false);
  const [diskInfo, setDiskInfo] = useState<model.DiskInfoType>();
  const renderDataItem = (
    title: string,
    number: string | number,
    size?: number,
    info?: string,
  ) => {
    return (
      <div className="dataItem">
        <div className="dataItemTitle">{title}</div>
        <div className="dataItemNumber">{number}</div>
        {size && size > 0 && <div className="dataItemTitle">大小:{formatSize(size)}</div>}
        {info && info.length > 0 && <div className="dataItemTitle">{info}</div>}
      </div>
    );
  };
  useEffect(() => {
    orgCtrl.user.getDiskInfo().then((value) => {
      setDiskInfo(value);
      setNoStore(value === undefined);
    });
  }, []);
  return (
    <div className="workbench-wrap">
      <div className="cardGroup">
        <div className="cardItem" onClick={() => history.push('work')}>
          <div className="cardItem-header">
            <span className="title">数据</span>
            <span className="extraBtn">
              <div className="svg-container">
                <img src={`/svg/home-setting.svg`} />
              </div>
              <span>管理数据</span>
            </span>
          </div>
          <div className="cardItem-viewer">
            <Space wrap split={<Divider type="vertical" />} size={6}>
              {diskInfo && (
                <>
                  {renderDataItem(
                    `关系(个)`,
                    orgCtrl.chats.filter(
                      (i) => i.isMyChat && i.typeName !== TargetType.Group,
                    ).length,
                    -1,
                    `共计:${orgCtrl.chats.length}个`,
                  )}
                  {renderDataItem(`数据集(个)`, diskInfo.collections, diskInfo.dataSize)}
                  {renderDataItem(`对象数(个)`, diskInfo.objects, diskInfo.totalSize)}
                  {renderDataItem(`文件(个)`, diskInfo.filesCount, diskInfo.filesSize)}
                  {renderDataItem(
                    `硬件`,
                    formatSize(diskInfo.fsUsedSize),
                    diskInfo.fsTotalSize,
                  )}
                </>
              )}
              {noStore && (
                <h3 style={{ color: 'red' }}>
                  {`您还未申请存储资源，
                您将无法使用本系统，
                请申请加入您的存储资源群（用来存储您的数据），
                个人用户试用存储群为（orginone_data），
                申请通过后请在关系中激活使用哦！`}
                </h3>
              )}
            </Space>
          </div>
        </div>
      </div>
    </div>
  );
};

export default defineElement({
  render(props, ctx) {
    return <View {...props} ctx={ctx} />;
  },
  displayName: 'Store',
  meta: {
    props: {
      height: {
        type: 'number',
        default: 200,
      },
      url: {
        type: 'type',
        label: '关联图片',
        typeName: 'picFile',
      } as ExistTypeMeta<SEntity | undefined>,
    },
    label: '数据概览',
    type: 'Element',
  },
});

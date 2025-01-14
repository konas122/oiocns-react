import React, { useEffect, useState } from 'react';
import { model } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { formatSize } from '@/ts/base/common';
import { TargetType, IBelong } from '@/ts/core';
import cls from '../../index.module.less';
import LineChart from './LineChart';
interface IProps {
  space: IBelong
}
const DataInfo: React.FC<IProps> = (props) => {
  const [noStore, setNoStore] = useState(false);
  const [diskInfo, setDiskInfo] = useState<model.DiskInfoType>();
  useEffect(() => {
    props.space.getDiskInfo().then((value) => {
    setDiskInfo(value);
    setNoStore(value === undefined);
  });
  }, [props.space]);
  return (
    <div className="cardGroup" style={{ marginBottom: '30px' }}>
      <div className="cardItem">
        <div className="cardItem-header">
          <span className="title">数据</span>
        </div>
        {diskInfo && (
          <div
            className="cardItem-header"
            style={{ marginTop: '20px', fontSize: '12px' }}>
            <span className="title">{props.space.activated?.metadata.name}</span>
            <span className="extraBtn" onClick={() => {}}></span>
          </div>
        )}
        {diskInfo && (
          <div className={cls['data-content']}>
            <div className={cls['data-chart']}>
              <LineChart
                fsSize={diskInfo.fsUsedSize}
                fsTotal={diskInfo.fsTotalSize}></LineChart>
              <div className={cls['data-chart-box']}>
                <p>存储大小</p>
                <p>
                  {formatSize(diskInfo.fsUsedSize)}/{formatSize(diskInfo.fsTotalSize)}
                </p>
              </div>
            </div>
            <div className={cls['data-list']}>
              <p>
                <span>关系(个)</span>
                <span>
                  {
                    orgCtrl.chats.filter(
                      (i) => i.isMyChat && i.typeName !== TargetType.Group,
                    ).length
                  }
                </span>
                <span>{`共计:${orgCtrl.chats.length}个`}</span>
              </p>
              <p>
                <span>数据集(个)</span> <span>{diskInfo.collections}</span>
                <span>大小:{formatSize(diskInfo.dataSize)}</span>
              </p>
              <p>
                <span>对象数(个)</span> <span>{diskInfo.objects}</span>
                <span>大小:{formatSize(diskInfo.totalSize)}</span>
              </p>
              <p>
                <span>文件(个)</span> <span>{diskInfo.filesCount}</span>
                <span>大小:{formatSize(diskInfo.filesSize)}</span>
              </p>
            </div>
          </div>
        )}
        {noStore && (
          <div className={cls['noData']}>
            <img src="/img/home/noData.png"></img>
            <div className={cls['noData-text']}>
              暂无数据核，请
              <span onClick={() => (window.location.href = '/#/relation')}>
                添加数据核
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default DataInfo;

import React from 'react';
import { Empty } from 'antd';

interface EmptyType {
  desc?: string;
  height?: number;
}
const EmptyCom: React.FC<EmptyType> = ({ desc, height }) => {
  return (
    <Empty
      image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
      imageStyle={{
        height: height ?? 300,
      }}
      description={desc ?? '该视图暂不支持成员查看，请联系管理员'}
    />
  );
};

export default EmptyCom;

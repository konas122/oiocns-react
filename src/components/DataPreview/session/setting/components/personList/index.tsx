import React, { useState } from 'react';
import { Card, Button, message, Col } from 'antd';
import { IPerson, IFile } from '@/ts/core';
import FullScreenModal from '@/components/Common/fullScreen';
import Store from '@/pages/Store';
import ContentCard from '@/pages/Home/components/Content/components/card';
interface IProps {
  title: string;
  target: IPerson;
}

export function isValidKey(
  key: string | number | symbol,
  object: object,
): key is keyof typeof object {
  return key in object;
}
const BannerSetting: React.FC<IProps> = ({ title, target }) => {
  const [showType, setShowType] = useState<boolean>(false);
  return (
    <Col span={24} style={{ marginTop: '10px' }}>
      <Card title={title}>
        <ContentCard space={target}/>
      </Card>
      {showType && (
        <FullScreenModal
          open={showType}
          width={'80vw'}
          bodyHeight={'70vh'}
          onCancel={() => setShowType(false)}>
          <div className="common-content">
            <Store></Store>
          </div>
        </FullScreenModal>
      )}
    </Col>
  );
};

export default BannerSetting;

import React, { useState } from 'react';
import { Card, Button, Col } from 'antd';
import { ICompany } from '@/ts/core';
import OpenFileDialog from '@/components/OpenFileDialog';
import ContentCard from '@/pages/Home/components/Content/components/card';

interface IProps {
  current: ICompany;
}

export function isValidKey(
  key: string | number | symbol,
  object: object,
): key is keyof typeof object {
  return key in object;
}
const CommonList: React.FC<IProps> = ({ current }) => {
  const hasRelationAuth = current.hasRelationAuth();
  const [showType, setShowType] = useState<boolean>(false);
  return (
    <Col span={24} style={{ marginTop: '10px' }}>
      <Card
        title={'常用'}
        extra={
          hasRelationAuth && (
            <Button
              onClick={() => {
                setShowType(true);
              }}
              type="primary">
              选择
            </Button>
          )
        }>
        {hasRelationAuth ? (<ContentCard space={current} />) : (
          <div style={{ color: '#999' }}>可联系单位管理员设置</div>
        )}
      </Card>
      {showType && (
        <OpenFileDialog
          title={`选择`}
          rightShow={false}
          accepts={['应用', '模块' ,'办事', '表单']}
          showFile
          rootKey={current.directory.key}
          onCancel={() => {
            setShowType(false);
          }}
          onOk={(files) => {
            files[0].toggleCommon(true);
          }}
        />
      )}
    </Col>
  );
};

export default CommonList;

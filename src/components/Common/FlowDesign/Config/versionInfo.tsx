import React from 'react';
import { Card, Descriptions, Switch } from 'antd';
import { IWork } from '@/ts/core';
import EntityIcon from '../../GlobalComps/entityIcon';
import useStorage from '@/hooks/useStorage';

interface VersionInfoType {
  current: IWork;
}
const VersionInfo: React.FC<VersionInfoType> = ({ current }) => {
  const { name, version, createUser, createTime, updateTime, updateUser, remark } =
    current.metadata;
  const [showVersionList, setShowVersionList] = useStorage('showVersionList', 'true');

  return (
    <div>
      <Card>
        <Descriptions column={1}>
          <Descriptions.Item label="名称">{name}</Descriptions.Item>
          <Descriptions.Item label="版本">v{version}</Descriptions.Item>
          <Descriptions.Item label="创建人">
            <EntityIcon entityId={createUser} showName />
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{createTime}</Descriptions.Item>
          {createUser !== updateUser && (
            <Descriptions.Item label="更新人">
              <EntityIcon entityId={updateUser} showName />
            </Descriptions.Item>
          )}
          <Descriptions.Item label="更新时间">{updateTime}</Descriptions.Item>
          <Descriptions.Item label="备注">{remark}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card>
        <Descriptions column={1}>
          <Descriptions.Item label="版本列表">
            <Switch
              checkedChildren="显示"
              unCheckedChildren="隐藏"
              checked={showVersionList === 'true'}
              onChange={(v) => {
                const isShow = v.toString();
                current.directory.changCallback('versionlayout', 'showList', isShow);
                setShowVersionList(isShow);
              }}
            />
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default VersionInfo;

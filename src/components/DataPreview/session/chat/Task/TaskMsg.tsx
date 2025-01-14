import { TaskContentType } from '@/ts/base/model';
import { tryParseJson } from '@/utils/tools';
import { ProfileOutlined } from '@ant-design/icons';
import { Descriptions, Tag } from 'antd';
import React, { useState } from 'react';
import cls from './index.module.less';
import { DistributionModal } from './DistributionModal';

interface IProps {
  msg: string;
  type?: string;
}

const TaskMsg: React.FC<IProps> = (props: IProps) => {
  const metadata = tryParseJson(props.msg);
  const [open, setOpen] = useState(false);

  const renderContent: () => React.ReactNode = () => {
    switch (metadata.content.type) {
      case TaskContentType.Report:
        return (
          <div className={cls['tm-content-report']}>
            <Descriptions title={''} column={1}>
              <Descriptions.Item label="办事">
                {metadata.content.workName}
              </Descriptions.Item>
              <Descriptions.Item label="报表树">
                {metadata.content.treeName}
              </Descriptions.Item>
              <Descriptions.Item label="数据时期">{metadata.period}</Descriptions.Item>
            </Descriptions>
          </div>
        );
      default:
        return <div className={cls['tm-content-empty']}>暂无匹配数据</div>;
    }
  };

  const handleOpen = (type: string) => {
    switch (type) {
      case TaskContentType.Report:
        setOpen(true);
        break;
      default:
        setOpen(true);
        break;
    }
  };

  return (
    <>
      <div
        className={cls['tm-wrapper']}
        onClick={() => {
          handleOpen(metadata.content.type);
        }}>
        <div className={cls['tm-header']}>
          <div className={cls['tm-header-item']}>
            <ProfileOutlined className={cls['tm-header-icon1']} />
            <div className={cls['tm-header-title']}>任务</div>
          </div>
          <div className={cls['tm-header-item']}>
            <div className={cls['tm-header-name']}>
              {metadata.name} ({metadata.code})
            </div>
          </div>
          <div className={cls['tm-header-item']}>
            <Tag color="green">{metadata.periodType}</Tag>
            <Tag color="processing">{metadata.content.type}</Tag>
          </div>
        </div>
        <div className={cls['tm-content']}>{renderContent()}</div>
        <div className={cls['tm-footer']}>
          <div className={cls['tm-footer-detail-btn']}>查看详情</div>
        </div>
      </div>
      {open && <DistributionModal open={open} setOpen={setOpen} metadata={metadata} />}
    </>
  );
};

export default TaskMsg;

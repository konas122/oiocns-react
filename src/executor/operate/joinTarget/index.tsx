import React, { useState } from 'react';
import { XTarget } from '@/ts/base/schema';
import { IBelong, TargetType } from '@/ts/core';
import SearchTarget from '@/components/Common/SearchTarget';
import JoinDepartment from './JoinDepartment';
import { Modal } from 'antd';
import { schema } from '@/ts/base';
import { logger } from '@/ts/base/common';

type IProps = {
  cmd: string;
  current: IBelong;
  finished: () => void;
};

/*
  弹出框申请计入
*/
const JoinTarget: React.FC<IProps> = ({ cmd, current, finished }) => {
  const [selectMembers, setSelectMembers] = useState<XTarget[]>([]); // 选中的要拉的人
  let modalTitle = '';
  let selectTargetType: TargetType = TargetType.Person;
  switch (cmd) {
    case 'joinFriend':
      modalTitle = '申请加好友';
      break;
    case 'joinCohort':
      modalTitle = '申请加入群组';
      selectTargetType = TargetType.Cohort;
      break;
    case 'joinStorage':
      modalTitle = '申请加入存储资源群';
      selectTargetType = TargetType.Storage;
      break;
    case 'joinCompany':
      modalTitle = '申请加入单位';
      selectTargetType = TargetType.Company;
      break;
    case 'joinGroup':
      modalTitle = '申请加入组织群';
      selectTargetType = TargetType.Group;
      break;
    case 'joinDepartment':
      modalTitle = '申请加入部门';
      selectTargetType = current.typeName as TargetType;
      break;
    default:
      return <></>;
  }
  const renderContent = () => {
    if (cmd === 'joinDepartment')
      return (
        <JoinDepartment
          autoSelect
          searchCallback={(persons: schema.XTarget[]) => {
            setSelectMembers(persons);
          }}
          current={current}
        />
      );

    return (
      <SearchTarget
        autoSelect
        searchCallback={(persons: schema.XTarget[]) => {
          setSelectMembers(persons);
        }}
        searchType={selectTargetType}
        belongId={modalTitle === '申请加入部门' ? current.belongId : undefined}
        code={modalTitle === '申请加入部门' ? current.metadata.code : undefined}
      />
    );
  };
  return (
    <Modal
      destroyOnClose
      title={modalTitle}
      open={true}
      onOk={async () => {
        if (await current.applyJoin(selectMembers)) {
          logger.info('申请成功！请等待审核...');
          finished();
        }
      }}
      onCancel={finished}
      okButtonProps={{ disabled: selectMembers.length < 1 }}
      width={670}>
      {renderContent()}
    </Modal>
  );
};

export default JoinTarget;

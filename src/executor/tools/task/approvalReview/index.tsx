import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { schema } from '@/ts/base';
import { IWorkTask } from '@/ts/core';
import { Button, Dropdown, Input } from 'antd';
import React, { memo, useMemo, useState } from 'react';
import cls from './index.module.less';
import type { IMembersObj } from '@/executor/tools/task';

interface IApprovalReview {
  task: IWorkTask;
  membersObj?: IMembersObj;
  onChat: (memberId: string, _belongId?: string) => void;
}

const ApprovalReview = ({ membersObj, onChat, task }: IApprovalReview) => {
  const [content, setContent] = useState<string>();
  const onSend = () => {
    const review = {
      content,
    };
  };
  const menus = useMemo(() => {
    let members: schema.XTarget[] = [];
    if (membersObj) {
      members = membersObj[task.taskdata.identityId]?.members || [];
    }
    return members.map((member) => {
      return {
        key: member.id,
        label: <EntityIcon entity={member} showName />,
      };
    });
  }, [membersObj?.members]);
  return (
    <>
      <div className={cls.ApprovalReview}>
        <div className={cls.ApprovalReviewContent}>
          <div>审核评论：</div>
          <div className={cls.ApprovalReviewInput}>
            <Input.TextArea
              placeholder="请输入审核评论"
              bordered={false}
              value={content}
              style={{ height: '30px', resize: 'none' }}
              onChange={(e) => {
                setContent(e.target.value);
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Dropdown
            menu={{
              items: menus,
              onClick: (e) => {
                onChat(e.key, membersObj?.[task.taskdata.identityId]?.originId);
              },
            }}>
            <div>
              <img src="/svg/dot/chat.svg" />
              &nbsp; 发起审核沟通
            </div>
          </Dropdown>
          &nbsp;&nbsp;
          <Button type="primary" style={{ height: '36px' }} onClick={onSend}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/svg/dot/send.svg" />
              &nbsp; 发送
            </div>
          </Button>
        </div>
      </div>
    </>
  );
};

export default memo(ApprovalReview);

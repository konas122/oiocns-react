import EntityIcon from '../../Common/GlobalComps/entityIcon';
import React from 'react';
import { CommentType } from '@/ts/base/model';
import UserInfo from '../UserInfo';
import { Button } from 'antd';
import OrgIcons from '@/components/Common/GlobalComps/orgIcons';
import orgCtrl from '@/ts/controller';

const ActivityComment: React.FC<{
  comment: CommentType;
  onClick: (comment: CommentType) => void;
  onDelete: (comment: CommentType) => void;
}> = ({ comment, onClick, onDelete }) => {
  return (
    <div className="activityCommet" onClick={() => onClick(comment)}>
      <div className={'activityCommet-avatar'}>
        <EntityIcon entityId={comment.userId} showName></EntityIcon>
      </div>
      <div className={'activityCommet-content'}>
        {comment.replyTo ? (
          <>
            回复 <UserInfo userId={comment.replyTo}></UserInfo> ：
          </>
        ) : (
          <></>
        )}
        {comment.label}
      </div>
      {comment.userId === orgCtrl.user.id && comment.id && onDelete && (
        <Button
          className={'activityCommet-uncomment'}
          type="text"
          onClick={() => onDelete(comment)}>
          <OrgIcons type="/toolbar/delete" size={18} />
        </Button>
      )}
    </div>
  );
};

export default ActivityComment;

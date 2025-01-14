import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import OrgIcons from '@/components/Common/GlobalComps/orgIcons';
import FullScreenModal from '@/components/Common/fullScreen';
import ActivityComment from '@/components/TargetActivity/ActivityComment';
import { parseAvatar } from '@/ts/base';
import { MessageType } from '@/ts/core';
import { parseTolink, showChatTime } from '@/utils/tools';
import { Image, List, Tag, Typography } from 'antd';
import orgCtrl from '@/ts/controller';
import React, { useState } from 'react';
import { XEntity } from '@/ts/base/schema';
import LinkPreview from '@/components/TargetActivity/LinkPreview';
import ActivityResource from '@/components/TargetActivity/ActivityResource';

interface IProps {
  share: any;
  finished: () => void;
}

const GroupDynamics: React.FC<IProps> = ({ share, finished }) => {
  const data = parseAvatar(share.msgBody);
  const [_replyTo, setReplyTo] = useState<XEntity | null>(null);
  const handleReply = async (userId: string = '') => {
    setReplyTo(null);
    if (userId) {
      const user = await orgCtrl.user.findEntityAsync(userId);
      user && setReplyTo(user);
    }
  };

  const renderContent = () => {
    switch (data.typeName) {
      case MessageType.Text:
        return (
          <Typography.Paragraph>
            <div dangerouslySetInnerHTML={{ __html: parseTolink(data.content) }}></div>
            {data?.linkInfo && <LinkPreview url={data?.linkInfo} isClsBase />}
          </Typography.Paragraph>
        );
      case MessageType.Html:
        return (
          <div
            dangerouslySetInnerHTML={{
              __html: data.content,
            }}></div>
        );
    }
  };

  return (
    <FullScreenModal
      centered
      open={true}
      title={'动态详情'}
      width={'80vw'}
      bodyHeight={'80vh'}
      destroyOnClose
      onCancel={() => finished()}>
      <List.Item>
        <List.Item.Meta
          title={
            <div style={{ width: '100%' }}>
              <span style={{ fontWeight: 'bold', marginRight: 10 }}>
                <EntityIcon entityId={data.belongId} showName size={40} />
                {share.metadata.name}
              </span>
              {data.tags.map((tag: any, index: number) => {
                return (
                  <Tag color="processing" key={index}>
                    {tag}
                  </Tag>
                );
              })}
            </div>
          }
          description={
            <div className={'activityItem'}>
              <div>
                {renderContent()}
                {data.resource.length > 0 && (
                  <div className={'activityItem-imageList'}>
                    <Image.PreviewGroup>
                      {ActivityResource(data.resource, 600)}
                    </Image.PreviewGroup>
                  </div>
                )}
              </div>
              <div className={'activityItem-footer'}>
                <div>
                  <EntityIcon entityId={data.createUser} showName />
                  <span className={'activityTime mgl4'}>
                    发布于{showChatTime(data.createTime)}
                  </span>
                </div>
              </div>
              <div
                className={'activityItem-footer-likes'}
                style={{ display: data.likes.length ? 'flex' : 'none' }}>
                <OrgIcons type="/toolbar/likeFull" size={18} />
                {data.likes.map((userId: string, index: number) => {
                  return (
                    <div
                      key={data.id + index}
                      style={{ alignItems: 'center', display: 'flex' }}>
                      <EntityIcon entityId={userId} showName></EntityIcon>
                    </div>
                  );
                })}
              </div>
              {data.comments?.length > 0 && (
                <div className={'activityItem-commentList'}>
                  {data.comments.map((item: any) => {
                    return (
                      <ActivityComment
                        comment={item}
                        key={item.time}
                        onClick={(comment) => handleReply(comment.userId)}
                        onDelete={(_comment) => {
                          throw new Error('Function not implemented.');
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          }
        />
      </List.Item>
    </FullScreenModal>
  );
};

export default GroupDynamics;

import React, { useEffect, useState } from 'react';
import { Button, Divider, Image, Input, List, Space, Tag, Typography } from 'antd';
import { IActivity, IActivityMessage, MessageType } from '@/ts/core';
import { parseHtmlToText, parseTolink, showChatTime } from '@/utils/tools';
import orgCtrl from '@/ts/controller';
import { XEntity } from '@/ts/base/schema';
import ActivityResource from '../ActivityResource';
import ActivityComment from '../ActivityComment';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import OrgIcons from '@/components/Common/GlobalComps/orgIcons';
import ChatShareForward from '@/components/DataPreview/session/chat/ChatShareForward';
import LinkPreview from '../LinkPreview';

interface ActivityItemProps {
  hideResource?: boolean;
  item: IActivityMessage;
  activity: IActivity;
}
export const ActivityMessage: React.FC<ActivityItemProps> = ({
  item,
  activity,
  hideResource,
}) => {
  const [metadata, setMetadata] = useState(item.metadata);
  const [showShareForward, setShowShareForward] = useState(false);
  useEffect(() => {
    const id = item.subscribe(() => {
      setMetadata(item.metadata);
    });
    return () => {
      item.unsubscribe(id);
    };
  }, [item]);
  const renderContent = () => {
    switch (metadata.typeName) {
      case MessageType.Text:
        return (
          <Typography.Paragraph ellipsis={hideResource}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }} dangerouslySetInnerHTML={{ __html: parseTolink(metadata.content) }} />
            {!hideResource && metadata?.linkInfo && <LinkPreview url={metadata?.linkInfo} isClsBase />}
          </Typography.Paragraph>
        );
      case MessageType.Html:
        if (hideResource) {
          return (
            <Typography.Paragraph ellipsis={hideResource}>
              {parseHtmlToText(metadata.content)}
            </Typography.Paragraph>
          );
        } else {
          return (
            <div
              dangerouslySetInnerHTML={{
                __html: metadata.content,
              }}></div>
          );
        }
    }
  };
  const RenderCtxMore: React.FC<ActivityItemProps> = ({ item, hideResource }) => {
    const [commenting, setCommenting] = useState(false);
    const [comment, setComment] = useState('');
    const [replyTo, setReplyTo] = useState<XEntity | null>(null);
    const handleReply = async (userId: string = '') => {
      setReplyTo(null);
      if (userId) {
        const user = await orgCtrl.user.findEntityAsync(userId);
        user && setReplyTo(user);
      }
      setCommenting(true);
    };
    const renderOperate = () => {
      return (
        <Space split={<Divider type="vertical" />} wrap size={2}>
          <Button
            type="text"
            onClick={() => {
              setShowShareForward(true);
            }}>
            <OrgIcons type="/toolbar/share" size={18} />
            <span style={{ marginLeft: 2 }}>转发</span>
          </Button>
          <Button
            type="text"
            onClick={async () => {
              await item.like();
            }}>
            {metadata.likes.includes(orgCtrl.user.id) ? (
              <>
                <OrgIcons type="/toolbar/likeFull" size={18} />
                <span style={{ marginLeft: 2 }}>取消</span>
              </>
            ) : (
              <>
                <OrgIcons type="/toolbar/like" size={18} />
                <span style={{ marginLeft: 2 }}>点赞</span>
              </>
            )}
          </Button>
          <Button type="text" onClick={() => handleReply()}>
            <OrgIcons type="/toolbar/comment" size={18} />
            <span style={{ marginLeft: 2 }}>评论</span>
          </Button>
          {item.canDelete && (
            <Button type="text" onClick={() => item.delete()}>
              <OrgIcons type="/toolbar/delete" size={18} />
              <span style={{ marginLeft: 2 }}>删除</span>
            </Button>
          )}
          <ChatShareForward
            message={[
              { msgBody: JSON.stringify(metadata), msgType: MessageType.Dynamic },
            ]}
            open={showShareForward}
            btachType={'single'}
            onShow={(val: boolean) => {
              setShowShareForward(val);
            }}
          />
        </Space>
      );
    };
    if (hideResource === true) {
      // const showLikes = metadata.likes?.length > 0 || metadata.comments?.length > 0;
      return (
        <>
          {/* <div className={cls.activityItemFooter}> */}
          <div className={'activityItem-footer'}>
            <div>
              <EntityIcon entityId={metadata.createUser} showName />
              {/* <span className={cls.activityTime}> */}
              <span className={'activityTime mgl4'}>
                {/* 发布于{showChatTime(item.metadata.createTime)} */}
              </span>
            </div>
          </div>
          {/* {showLikes && (
            // <div className={cls.activityItemFooterLikes}>
            <div className={'activityItem-footer-likes'}>
              {metadata.likes.length > 0 && (
                <span style={{ fontSize: 18, color: '#888' }}>
                  <OrgIcons type="/toolbar/likeFull" size={18} />
                  <b style={{ marginLeft: 6 }}>{metadata.likes.length}</b>
                </span>
              )}
              {metadata.comments.length > 0 && (
                <span style={{ fontSize: 18, color: '#888' }}>
                  <OrgIcons type="/toolbar/comment" size={18} />
                  <b style={{ marginLeft: 6 }}>{metadata.comments.length}</b>
                </span>
              )}
            </div>
          )} */}
        </>
      );
    }
    return (
      <>
        <div className={'activityItem-footer'}>
          <div>
            <EntityIcon entityId={metadata.createUser} showName />
            <span className={'activityTime mgl4'}>
              发布于{showChatTime(item.metadata.createTime)}
            </span>
          </div>
          {!hideResource && <div>{renderOperate()}</div>}
        </div>
        <div
          className={'activityItem-footer-likes'}
          style={{ display: metadata.likes.length ? 'flex' : 'none' }}>
          <OrgIcons type="/toolbar/likeFull" size={18} />
          {metadata.likes.map((userId: string, index: number) => {
            return (
              <div
                key={metadata.id + index}
                style={{ alignItems: 'center', display: 'flex' }}>
                <EntityIcon entityId={userId} showName></EntityIcon>
              </div>
            );
          })}
        </div>
        {metadata.comments?.length > 0 && (
          <div className={'activityItem-commentList'}>
            {metadata.comments.map((comment,index) => {
              return (
                <ActivityComment
                  comment={comment}
                  key={index}
                  onClick={(comment) => handleReply(comment.userId)}
                  onDelete={async (comment) => {
                    await item.unComment(comment);
                  }}
                />
              );
            })}
          </div>
        )}
        <div
          style={{ display: commenting ? 'flex' : 'none' }}
          className={'activityItem-commentInputBox'}>
          <Input.TextArea
            placeholder={replyTo ? `回复${replyTo.name} :` : ''}
            style={{ height: 12 }}
            value={comment}
            onChange={(e) => setComment(e.currentTarget.value)}></Input.TextArea>
          <Button
            type="primary"
            size="small"
            onClick={async () => {
              await item.comment(comment, replyTo?.id);
              setCommenting(false);
              setComment('');
              setReplyTo(null);
            }}>
            发送
          </Button>
        </div>
      </>
    );
  };
  return (
    <List.Item>
      <List.Item.Meta
        title={
          <div style={{ marginBottom: 15 }}>
            <div style={{ width: '100%' }}>
              <span style={{ fontWeight: 'bold', marginRight: 10 }}>
                {activity.metadata.name}
              </span>
              {metadata.tags.map((tag, index) => {
                return (
                  <Tag color="processing" key={index}>
                    {tag}
                  </Tag>
                );
              })}
            </div>
            {/* {!hideResource && <div>{renderOperate()}</div>} */}
            {hideResource && <span style={{ fontSize: '12px', color: '#424A57' }}>最近发布</span>}
          </div>
        }
        avatar={<EntityIcon entity={activity.metadata} size={40} />}
        description={
          <div className={'activityItem'}>
            <div>
              {renderContent()}
              {hideResource !== true && (
                <div className={'activityItem-imageList'}>
                  <Image.PreviewGroup>
                    {ActivityResource(metadata.resource, 600)}
                  </Image.PreviewGroup>
                </div>
              )}
            </div>
            <RenderCtxMore item={item} hideResource={hideResource} activity={activity} />
          </div>
        }
      />
    </List.Item>
  );
};

export default ActivityMessage;

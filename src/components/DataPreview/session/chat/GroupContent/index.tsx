import { Button, Checkbox, message, Popover, Spin, Badge, Tag } from 'antd';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { useCopyToClipboard } from 'react-use';
import EntityInfo from '@/components/Common/GlobalComps/entityIcon';
import Information from './information';
import ForwardContentModal from './forwardContentModal';
import { showChatTime, downloadByUrl, shareOpenLink } from '@/utils/tools';
import { IMessage, ISession, MessageType } from '@/ts/core';
import { parseAvatar } from '@/ts/base';
import { parseCiteMsg, parseMsg, parseForwardMsg } from '../components/parseMsg';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

import OrgIcons from '@/components/Common/GlobalComps/orgIcons';
/**
 * @description: 聊天区域
 * @return {*}
 */

interface Iprops {
  chat: ISession;
  filter: string;
  handleReWrites: Function;
  /** 返回值，引用 */
  citeText: any;
  forward: any;
  multiSelectShow: boolean;
  multiSelectMsg: (item: IMessage, checked: boolean) => void;
  multiSelectFn: (multi: boolean) => void;
}

const GroupContent = (props: Iprops) => {
  const [lastTime, setLastTime] = useState(new Date());
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState<IMessage>();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const { handleReWrites, multiSelectShow } = props;
  const body = useRef<HTMLDivElement>(null);
  const [beforescrollHeight, setBeforescrollHeight] = useState(0);
  const [forwardModalOpen, setForwardModalOpen] = useState<boolean>(false); // 转发时用户
  const [forwardMessages, setForwardMessages] = useState<IMessage[]>([]);
  const [multiSelect, setMultiSelect] = useState(multiSelectShow);
  const [, copyToClipboard] = useCopyToClipboard();
  const init = useRef(false);
  useEffect(() => {
    props.chat.onMessage((ms) => {
      setMessages([...ms]);
    });
    return () => {
      props.chat.unMessage();
    };
  }, [props.chat]);

  useEffect(() => {
    setMultiSelect(multiSelectShow);
  }, [multiSelectShow]);

  useEffect(() => {
    if (body && body.current && messages.length > 0) {
      if (!init.current) {
        body.current.scrollTop = body.current.scrollHeight;
        init.current = true;
        return;
      }
      if (loading) {
        setLoading(false);
        body.current.scrollTop = body.current.scrollHeight - beforescrollHeight;
      } else if (
        body.current.scrollTop + body.current.offsetHeight >=
        beforescrollHeight - 10
      ) {
        body.current.scrollTop = body.current.scrollHeight;
      } else if (
        body.current.scrollTop > 0 &&
        body.current.scrollTop + body.current.offsetHeight < body.current.scrollHeight
      ) {
        var newMessage = messages.filter((a) => new Date(a.createTime) > lastTime);
        if (newMessage.some((a) => a.isMySend)) {
          body.current.scrollTop = body.current.scrollHeight;
          setNewMessageCount(0);
        } else {
          setNewMessageCount(
            messages.filter((a) => new Date(a.createTime) > lastTime).length,
          );
        }
      }
    }
  }, [messages]);

  const isShowTime = (curDate: string, beforeDate: string) => {
    if (beforeDate === '') return true;
    return moment(curDate).diff(beforeDate, 'minute') > 3;
  };
  // 滚动事件
  const onScroll = async () => {
    if (!loading && body.current) {
      if (props.chat && body.current.scrollTop < 10) {
        setLoading(true);
        await props.chat.moreMessage();
        setMessages([...props.chat.messages]);
      }
      if (
        newMessageCount > 0 &&
        body.current.scrollTop + body.current.offsetHeight >=
        body.current.scrollHeight - 10
      ) {
        setNewMessageCount(0);
        setLastTime(new Date());
      }
      setBeforescrollHeight(body.current.scrollHeight);
    }
  };

  const handleForwadModalClose = () => {
    setForwardModalOpen(false);
    setForwardMessages([]);
  };
  const viewForward = (item: IMessage[]) => {
    setForwardModalOpen(true);
    setForwardMessages(item);
  };

  const batchForwardMsg = (item: IMessage) => {
    // TODO 需要优化
    if (
      item.forward.length === 1 &&
      item.forward[0].forward &&
      item.forward[0].forward.length > 1
    ) {
      return (
        <React.Fragment>
          {parseForwardMsg(item.forward[0].forward, viewForward)}
        </React.Fragment>
      );
    }
    return <React.Fragment>{parseForwardMsg(item.forward, viewForward)}</React.Fragment>;
  };

  const showMsg = (item: IMessage) => {
    if (item.forward && item.forward.length) return batchForwardMsg(item);
    else return <React.Fragment>{parseMsg(item)}</React.Fragment>;
  };
  const viewMsg = (item: IMessage) => {
    if (item.isMySend) {
      return (
        <>
          <Popover
            className="popver"
            autoAdjustOverflow={false}
            trigger="hover"
            key={item.id}
            placement="leftBottom"
            getPopupContainer={(triggerNode: HTMLElement) => {
              return triggerNode.parentElement || document.body;
            }}
            overlayInnerStyle={{ marginRight: '-16px', padding: '3px' }}
            content={msgAction(item)}>
            <div className="flex">
              <div className="con_content">
                {props.chat.isBelongPerson ? (
                  <>
                    {showMsg(item)}
                    {item.cite && parseCiteMsg(item.cite)}
                  </>
                ) : (
                  <>
                    <Badge
                      key={item.id}
                      count={item.comments}
                      size="small"
                      style={{ zIndex: 2 }}
                      offset={[-15, -12]}>
                      {showMsg(item)}
                      {item.cite && parseCiteMsg(item.cite)}
                    </Badge>
                    <div
                      className={`information ${
                        item.readedinfo.includes('已读') ? 'readed' : ''
                      }`}
                      onClick={() => setInfoMsg(item)}>
                      {item.readedinfo}
                    </div>
                  </>
                )}
              </div>
              <div>
                <EntityInfo entityId={item.metadata.fromId} size={40} />
              </div>
            </div>
          </Popover>
        </>
      );
    } else {
      return (
        <>
          <div className="flex view_msg_gap">
            <div>
              <EntityInfo
                entityId={item.metadata.fromId}
                size={40}
                tags={item.metadata.tags}
              />
            </div>
            {item.metadata.tags?.map((label) => {
              return (
                <Tag key={label} color="processing">
                  {label}
                </Tag>
              );
            })}
            <div className={`con_content`}>
              <div className={`name`}>{item.from.name}</div>
              <Popover
                className="popver"
                autoAdjustOverflow={false}
                trigger="hover"
                key={item.id}
                placement="rightBottom"
                getPopupContainer={(triggerNode: HTMLElement) => {
                  return triggerNode.parentElement || document.body;
                }}
                overlayInnerStyle={{ marginLeft: '-18px', padding: '3px' }}
                content={msgAction(item)}>
                {showMsg(item)}
              </Popover>
              {item.cite && parseCiteMsg(item.cite)}
            </div>
          </div>
        </>
      );
    }
  };

  const handleMore = () => {
    setMultiSelect(true);
    props.multiSelectFn(true);
  };

  const loadMsgItem = (item: IMessage) => {
    return (
      <div
        className="con_body"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}>
        {multiSelect && (
          <Checkbox
            className="multiSelectStyl"
            style={{ margin: 'auto 12px auto 0' }}
            onClick={(e) => {
              props.multiSelectMsg(
                item,
                (e as unknown as CheckboxChangeEvent).target.checked,
              );
            }}
          />
        )}
        {viewMsg(item)}
      </div>
    );
  };

  const msgAction = (item: IMessage) => {
    return (
      <div className="msgAction">
        <Button
          type="text"
          className="multiBtn"
          onClick={() => {
            copyToClipboard(item.msgBody);
            message.success('复制成功');
          }}>
          <div className="msgActionBtn">
            <OrgIcons type="/toolbar/copy" size={16} />
            <span className="moreActionTxt">复制</span>
          </div>
        </Button>
        <Button
          type="text"
          className="multiBtn"
          onClick={() => {
            props.forward(item);
          }}>
          <div className="msgActionBtn">
            <OrgIcons type="/toolbar/share1" size={16} />
            <span className="moreActionTxt">转发</span>
          </div>
        </Button>
        <Button
          type="text"
          className="multiBtn"
          onClick={() => {
            props.citeText(item);
          }}>
          <div className="msgActionBtn">
            <OrgIcons type="/toolbar/msg" size={16} />
            <span className="moreActionTxt">引用</span>
          </div>
        </Button>
        {['文件', '视频', '图片', '名片', '网页'].includes(item.msgType) &&
          item.forward?.length < 1 && (
            <Button
              type="text"
              className="multiBtn"
              onClick={() => {
                const url = parseAvatar(item.msgBody).shareLink;
                downloadByUrl(shareOpenLink(url, true));
              }}>
              <div className="msgActionBtn">
                <OrgIcons type="/toolbar/download" size={16} />
                <span className="moreActionTxt">下载</span>
              </div>
            </Button>
          )}
        <Button type="text" className="multiBtn" onClick={handleMore}>
          <div className="msgActionBtn">
            <OrgIcons type="/toolbar/checkmore" size={16} />
            <span className="moreActionTxt">多选</span>
          </div>
        </Button>
        {item.isMySend && item.allowRecall && (
          <Button
            type="text"
            className="multiBtn"
            onClick={async () => {
              await props.chat.recallMessage(item.id);
            }}>
            <div className="msgActionBtn">
              <OrgIcons type="/toolbar/recall" css={{paddingBottom:'1px'}} size={16} />
              <span className="moreActionTxt">撤回</span>
            </div>
          </Button>
        )}
      </div>
    );
  };

  const renderMessage = (item: IMessage) => {
    switch (item.msgType) {
      case MessageType.Recall:
        return (
          <div className="left-msg-body con recall">
            {item.msgBody}
            {(item.allowEdit && !item.msgSource.includes('shareLink')) && (
              <span
                className="reWrite"
                onClick={() => {
                  handleReWrites(item.msgSource);
                }}>
                重新编辑
              </span>
            )}
          </div>
        );
      case MessageType.Notify:
        return <div className="left-msg-body con recall">{item.msgBody}</div>;
      default:
        if (item.isMySend) {
          return <div className="right-msg-body con">{loadMsgItem(item)}</div>;
        } else {
          return <div className="left-msg-body con">{loadMsgItem(item)}</div>;
        }
    }
  };

  return (
    <div className="msg-body" ref={body} onScroll={onScroll}>
      <Spin tip="加载中..." spinning={loading}>
        {newMessageCount > 0 && (
          <Button
            style={{
              width: body.current ? body.current.clientWidth : '100vm',
              position: 'fixed',
              zIndex: 1000,
              border: 0,
            }}
            onClick={() => {
              if (body.current) {
                body.current.scrollTop = body.current.scrollHeight;
              }
            }}>
            <span style={{ color: 'blue' }}>接收到{newMessageCount}条新消息</span>
          </Button>
        )}
        <div className="msg-body-warp">
          {messages
            .filter((i) => i.msgBody.includes(props.filter))
            .map((item, index: any) => {
              return (
                <React.Fragment key={item.id}>
                  {/* 聊天间隔时间3分钟则 显示时间 */}
                  {isShowTime(
                    item.createTime,
                    index > 0 ? messages[index - 1].createTime : '',
                  ) ? (
                    <div className="chat-space-time">
                      <span>{showChatTime(item.createTime)}</span>
                    </div>
                  ) : (
                    ''
                  )}
                  {/* 聊天框内容显示 */}
                  {renderMessage(item)}
                </React.Fragment>
              );
            })}
        </div>
        {infoMsg && <Information msg={infoMsg} onClose={() => setInfoMsg(undefined)} />}
      </Spin>
      <ForwardContentModal
        handleClose={handleForwadModalClose}
        open={forwardModalOpen}
        messages={forwardMessages}
        isBelongPerson={true}
        title={''}
        viewForward={viewForward}
      />
    </div>
  );
};
export default GroupContent;

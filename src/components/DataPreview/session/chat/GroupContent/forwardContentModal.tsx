import React, { FC } from 'react';
import { Popover, Badge } from 'antd';
import moment from 'moment';
import { showChatTime } from '@/utils/tools';
import { IMessage, MessageType } from '@/ts/core';
import { parseCiteMsg, parseMsg, parseForwardMsg } from '../components/parseMsg';
import TeamIcon from '@/components/Common/GlobalComps/entityIcon';
import FullScreenModal from '@/components/Common/fullScreen';
interface IForwardContentModalProps {
  open: boolean;
  messages: IMessage[];
  title: string;
  isBelongPerson?: boolean;
  handleClose: () => void;
  viewForward?: (item: IMessage[]) => void;
}

const ForwardContentModal: FC<IForwardContentModalProps> = (props) => {
  const { open, isBelongPerson, messages, handleClose, viewForward } = props;
  const isShowTime = (curDate: string, beforeDate: string) => {
    if (beforeDate === '') return true;
    return moment(curDate).diff(beforeDate, 'minute') > 3;
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
  const defaultMsg = (item: IMessage) => {
    return (
      <div className="flex view_msg_share" style={{ margin: '10px 0' }}>
        <React.Fragment>
          <div style={{ color: '#888' }}>
            <TeamIcon entityId={item.metadata.fromId} size={36} />
          </div>
          <div className="con_content">
            <div className="name">{item.from.name}</div>
            <div className="con_content_share">
              {parseMsg(item)}
              {item.cite && parseCiteMsg(item.cite)}
            </div>
          </div>
        </React.Fragment>
      </div>
    );
  };
  const showMsg = (item: IMessage) => {
    if (item.forward && item.forward.length) return batchForwardMsg(item);
    else return defaultMsg(item);
  };
  const viewMsg = (item: IMessage) => {
    if (item.isMySend) {
      return (
        <div className="flex view_msg_share" style={{ margin: ' 0 10px' }}>
          {isBelongPerson ? (
            showMsg(item)
          ) : (
            <Badge
              key={item.id}
              count={item.comments}
              size="small"
              style={{ zIndex: 2 }}
              offset={[-15, -12]}>
              <div className="con_content_share">
                {showMsg(item)}
                {item.cite && parseCiteMsg(item.cite)}
              </div>
            </Badge>
          )}
        </div>
      );
    } else {
      return (
        <>
          <div className="flex view_msg_gap" style={{ margin: '10px' }}>
            <div style={{ color: '#888', paddingRight: 10 }}>
              <TeamIcon entityId={item.metadata.fromId} size={36} />
            </div>
            <div className="con_content">
              <div className="name">{item.from.name}</div>
              {parseMsg(item)}
              {item.cite && parseCiteMsg(item.cite)}
            </div>
          </div>
        </>
      );
    }
  };

  const loadMsgItem = (item: IMessage) => {
    return (
      <Popover
        trigger="hover"
        key={item.id}
        placement="bottom"
        getPopupContainer={(triggerNode: HTMLElement) => {
          return triggerNode.parentElement || document.body;
        }}
        // content={msgAction(item)}
      >
        <div
          className="con_body"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}>
          {viewMsg(item)}
        </div>
      </Popover>
    );
  };

  return (
    <FullScreenModal
      centered
      // fullScreen
      width={'80vw'}
      bodyHeight={'80vh'}
      destroyOnClose
      title={'聊天记录'}
      open={open}
      footer={null}
      closable={false}
      onCancel={handleClose}>
      <div className="msg-body">
        <div className="msg-body-warp">
          {messages.map((item, index: any) => {
            return (
              <React.Fragment key={item.metadata.fromId + index}>
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
                {/* 左侧聊天内容显示 */}
                {!item.isMySend && item.msgType != MessageType.Recall && (
                  <div className="left-msg-body con">{loadMsgItem(item)}</div>
                )}
                {/* 右侧聊天内容显示 */}
                {item.isMySend && item.msgType != MessageType.Recall && (
                  <div className="right-msg-body con">{loadMsgItem(item)}</div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </FullScreenModal>
  );
};

export default ForwardContentModal;

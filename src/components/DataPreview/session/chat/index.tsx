import React, { useState, createContext } from 'react';
import GroupContent from './GroupContent';
import SendBox from './SendBox';
import ChatShareForward from './ChatShareForward';
import { ISession, IMessage } from '@/ts/core';
import { RiShareForwardLine } from 'react-icons/ri';
import { AiOutlineClose } from 'react-icons/ai';

export const SessionContext = createContext<ISession>(null!);

/**
 * @description: 沟通聊天
 * @return {*}
 */
const Chat: React.FC<{ chat: ISession; filter: string }> = ({ chat, filter }) => {
  const [writeContent, setWriteContent] = useState<string>(); // 重新编辑
  const [citeText, setCiteText] = useState<IMessage>(); // 引用值
  const [forwardMessage, setForwardMessage] = useState<IMessage[]>([]);
  const [showShareForward, setShowShareForward] = useState(false);
  const [multiSelectShow, setMultiSelectShow] = useState(false);
  const [btachType, setBatchType] = useState<string>('');
  /**
   * @description: 重新编辑
   * @param {string} write
   * @return {*}
   */
  const handleReWrites = (write: string) => {
    setWriteContent(write);
  };
  const multiSingleSend = () => {
    setShowShareForward(true);
    setBatchType('single');
  };
  const multiBatchSend = () => {
    setShowShareForward(true);
    setBatchType('merge');
  };
  return (
    <SessionContext.Provider value={chat}>
      <div className="chat">
        {/* 主体 */}
        <div className="chat-content">
          {/* 聊天区域 */}
          <GroupContent
            chat={chat}
            multiSelectShow={multiSelectShow}
            handleReWrites={handleReWrites}
            filter={filter}
            citeText={(msg: IMessage) => setCiteText(msg)}
            forward={(item: IMessage) => {
              setForwardMessage([item]);
              setShowShareForward(true);
            }}
            multiSelectMsg={(item: IMessage, checked) => {
              if (checked) {
                setForwardMessage([...forwardMessage, item]);
              } else {
                setForwardMessage(
                  forwardMessage.filter((itm: IMessage) => itm.id !== item.id),
                );
              }
            }}
            multiSelectFn={(multi: boolean) => {
              setMultiSelectShow(multi);
            }}
          />
          {/* 输入区域 */}
          <SendBox
            chat={chat}
            writeContent={writeContent}
            citeText={citeText} // 传递引用的值给聊天框组件
            closeCite={() => setCiteText(undefined)} // 设置关闭引用下的值
          />
          {/* 多选操作内容 */}
          {multiSelectShow && (
            <div className="chart_mulit_select">
              <div className="chart_mulit_select_wrap">
                <div
                  className="chart_mulit_select_action"
                  onClick={() => multiSingleSend()}>
                  <span className="chart_mulit_select_icon">
                    <RiShareForwardLine size={22} />
                  </span>
                  <span>逐条转发</span>
                </div>
                <div
                  className="chart_mulit_select_action"
                  onClick={() => multiBatchSend()}>
                  <span className="chart_mulit_select_icon">
                    <RiShareForwardLine size={22} />
                  </span>
                  <span>合并转发</span>
                </div>
                <div>
                  <AiOutlineClose
                    size={22}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setMultiSelectShow(false);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        {/** 转发 */}
        <ChatShareForward
          message={forwardMessage}
          open={showShareForward}
          btachType={btachType}
          onShow={(val: boolean) => {
            setShowShareForward(val);
            setMultiSelectShow(false);
            setForwardMessage([]);
          }}
        />
      </div>
    </SessionContext.Provider>
  );
};
export default Chat;

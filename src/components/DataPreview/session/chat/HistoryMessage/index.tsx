import React, { useState } from 'react';
import { Modal, Input, Button, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { ISession } from '@/ts/core';

const HistoryMessage: React.FC<{ chat: ISession; handleCallBack: Function }> = (
  props,
) => {
  const [placeholder, setPlaceholder] = useState<React.ReactNode>(<SearchOutlined />);
  const [searchMsgType, setSearchMsgType] = useState<string>('');
  const [searchVal, setSearchVal] = useState<string>('');
  const msgTypeFilter = (type: React.ReactNode) => {
    setPlaceholder(type);
  };
  const closeTag = () => {
    setSearchMsgType('');
    setPlaceholder(<SearchOutlined />);
  };
  const color = '#55acee';
  const filerBtns = [
    {
      name: '文件',
      msgType: '文件',
    },
    {
      name: '图片',
      msgType: '图片',
    },
    {
      name: '视频',
      msgType: '视频',
    },
    // {
    //   name: '链接',
    //   msgType: '链接',
    // },
    {
      name: '任务',
      msgType: '任务',
    },
  ];
  const enterSearch = async (e: any) => {
    // const messages = await chat.searchMessage({
    //   searchVal: e ? e?.target.value : '',
    //   msgType: searchMsgType,
    // });
    if (e && e.target) {
      setSearchVal(e?.target.value);
    }
  };

  const tagRender = (btn: { name: string; msgType: string }) => {
    return (
      <Tag color={color} closable onClose={() => closeTag()}>
        {btn.name}
      </Tag>
    );
  };
  return (
    <div>
      <Modal
        width={window.innerWidth * 0.6}
        style={{ height: window.innerHeight * 0.8 }}
        open={true}
        footer={null}
        onCancel={() => props.handleCallBack()}>
        <div style={{ marginTop: '20px' }}>
          <Input prefix={placeholder} placeholder="搜索" onChange={enterSearch} />
          <div style={{ padding: '14px', borderBottom: '1px solid #eee' }}>
            {filerBtns.map((btn) => {
              return (
                <Button
                  key={btn.name}
                  name={btn.name}
                  size="middle"
                  type="link"
                  onClick={() => {
                    setSearchMsgType(btn.msgType);
                    msgTypeFilter(tagRender(btn));
                    // TODO 后期改，临时
                    enterSearch('');
                  }}>
                  {btn.name}
                </Button>
              );
            })}
          </div>
          <div style={{ height: window.innerHeight * 0.7, overflowY: 'scroll' }}>
            <div className="chat">
              <div className="chat-content">
                {/* <GroupContent
                  chat={chat}
                  multiSelectShow={false}
                  handleReWrites={() => {}}
                  historyMsgView={true}
                  filter={{ value: searchVal, msgType: searchMsgType }}
                /> */}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HistoryMessage;
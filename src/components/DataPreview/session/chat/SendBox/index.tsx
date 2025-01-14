import { Popover, Input, Button, List, Divider } from 'antd';
import React, { useEffect, useState, useRef } from 'react';
import { IMessage, ISession, ISysFileInfo, MessageType } from '@/ts/core';
import OpenFileDialog from '@/components/OpenFileDialog';
import { parseCiteMsg } from '../components/parseMsg';
import Emoji from '../components/emoji';
import OrgIcons from '@/components/Common/GlobalComps/orgIcons';
import UploadIcon from '@/components/Common/FileUpload/uploadIcon';
import { IDistributionTask } from '@/ts/core/thing/standard/distributiontask';
import { CreateTaskModal } from '../Task/CreateTaskModal';
import 'lodash';
import HistoryMessage from '../HistoryMessage';
import { MemberList } from '@/components/Common/SelectMember/memberSelector';
import EditorText from './editorText';
import orgCtrl from '@/ts/controller';

const TextArea = Input.TextArea;
/**
 * @description: 输入区域
 * @return {*}
 */

interface IProps {
  chat: ISession;
  citeText?: IMessage;
  writeContent?: string;
  closeCite: () => void;
}

const GroupInputBox = (props: IProps) => {
  const [openEmoji, setOpenEmoji] = useState(false);
  const [atShow, setAtShow] = useState<boolean>(false);
  const [htmlMessage, setHtmlMessage] = useState<string>(
    props.chat.inputContent.htmlMessage,
  );
  const ref = useRef<IMessage>();
  ref.current = props.citeText;
  const [openMore, setOpenMore] = useState(false);
  const [openType, setOpenType] = useState<string>();
  const [createTask, setCreateTask] = useState<boolean>(false);
  const [historyMessageModal, setHistoryMessageModal] = useState<boolean>(false);
  const [task, setTask] = useState<IDistributionTask | null>(null);
  const [sending, setSending] = useState<boolean>(false);
  useEffect(() => {
    if (props.writeContent) {
      setHtmlMessage(props.writeContent);
    }
  }, [props.writeContent]);

  useEffect(() => {
    props.chat.inputContent.message = processHTML(
      htmlMessage.replace(/<br\s*\/?>/gi, ''),
    );
    props.chat.inputContent.htmlMessage = htmlMessage;
  }, [htmlMessage]);

  //获取输入框中的本地图片数据
  const extractSrcsFromHtml = (htmlString: string) => {
    let srcMatch = htmlString.match(/src="([^"]*)"/);
    for (const element of props.chat.inputContent.imgList) {
      if (srcMatch && element.imgUrl == srcMatch[1]) {
        return element; // 返回匹配到的图片数据
      }
    }
    return null;
  };

  //html转化成普通文本
  const processHTML = (html: string) => {
    let tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    let result = '';
    tempDiv.querySelectorAll('p').forEach((p) => {
      p.childNodes.forEach((node) => {
        if (node && node.nodeType === Node.TEXT_NODE) {
          result += node?.textContent?.trim() + '\n';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          result += (node as Element)?.outerHTML;
        }
      });
    });
    if (result.endsWith('\n')) {
      result = result.slice(0, -1);
    }
    if (result.endsWith('@')) {
      setAtShow(true);
    }
    return result;
  };

  //拆分发送的消息类型 文本和图片
  const splitTextAndImages = (str: string) => {
    const imgRegex = /<img\s+[^>]*>/gi;
    const images = [...str.matchAll(imgRegex)].map((match) => match[0]);

    const imgIndices = images.map((img) => {
      const match = str.match(
        new RegExp(img.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      );
      return match?.index;
    });

    let result = [];
    let lastIndex = 0;
    imgIndices.forEach((index, i) => {
      if (index && index > lastIndex) {
        result.push(str.substring(lastIndex, index).trim());
      }
      result.push(images[i]);
      lastIndex = (index as number) + images[i].length;
    });

    if (lastIndex < str.length) {
      result.push(str.substring(lastIndex).trim());
    }
    return result;
  };

  /** 发送消息 */
  const sendMessage = async (html: string) => {
    if (sending) return;
    setSending(true);
    const messageList = splitTextAndImages(processHTML(html.replace(/<br\s*\/?>/gi, '')));
    for (const item of messageList) {
      if (item.startsWith('<img')) {
        let msgType = MessageType.Image;
        let imgs = extractSrcsFromHtml(item);
        if (imgs) {
          let file = await orgCtrl.user.directory.createFile(imgs.file.name, imgs.file);
          file &&
            (await props.chat.sendMessage(msgType, JSON.stringify(file.shareInfo()), []));
        }
      } else {
        const vaildMentions: string[] = [];
        for (const mention of props.chat.inputContent.mentions) {
          if (item.includes(mention.text) && !vaildMentions.includes(mention.id)) {
            vaildMentions.push(mention.id);
          }
        }
        await props.chat.sendMessage(MessageType.Text, item, vaildMentions, ref.current);
      }
    }
    setHtmlMessage('');
    props.closeCite();
    setSending(false);
  };
  /** 引用展示 */
  const citeShowText = (val: IMessage) => {
    return (
      <div className="cite-text">
        <div className="cite-text-content">
          <OrgIcons
            type="/toolbar/close"
            size={30}
            notAvatar
            onClick={() => props.closeCite()}
            className="cite-text-close-icon"
          />
          {parseCiteMsg(val)}
        </div>
      </div>
    );
  };
  const moreListItem = [
    {
      title: '发送云文档',
      type: '/toolbar/store',
      onClick: () => setOpenType('文件'),
    },
    {
      title: '发送任务',
      type: '/toolbar/task',
      onClick: () => setOpenType('任务'),
    },
    {
      title: '发送语音',
      type: '/toolbar/audio',
    },
    {
      title: '视频通话',
      type: '/toolbar/video',
    },
  ];

  const handleHistoryMessage = () => {
    setHistoryMessageModal(false);
  };
  return (
    <div className="chat-send-box">
      <div style={{ width: '100%' }}>
        {props.citeText && citeShowText(props.citeText)}
      </div>
      <div className="chat-send-box-main">
        <div style={{ width: '100%' }}>
          {atShow && (
            <Popover
              align={{
                points: ['t', 'l'],
              }}
              content={
                <MemberList
                  target={props.chat.target}
                  onClick={(item) => {
                    props.chat.inputContent.mentions.push({
                      id: item.id,
                      text: `@${item.name} `,
                    });
                    setAtShow(false);
                    let lastAtIndex = htmlMessage.lastIndexOf('@');
                    setHtmlMessage(
                      htmlMessage.slice(0, lastAtIndex + 1) +
                        item.name +
                        ' ' +
                        htmlMessage.slice(lastAtIndex + 1),
                    );
                  }}
                />
              }
              open={atShow}
              trigger={['click', 'contextMenu']}
              onOpenChange={setAtShow}></Popover>
          )}
          <div style={{ display: 'block', height: 'auto' }}>
            <EditorText
              chat={props.chat}
              onSendMessage={(html: string) => {
                sendMessage(html);
              }}
              htmlMessage={htmlMessage}
              onChange={(e: string) => {
                setHtmlMessage(e);
              }}
            />
          </div>
          {/* <TextArea
            value={message}
            autoSize={{ minRows: 1, maxRows: 5 }}
            allowClear={true}
            placeholder={`Enter键发送, Alt+Enter键换行。`}
            bordered={false}
            onChange={(e) => {
              const value = e.target.value;
              if (!value.endsWith('\n')) {
                if (value.endsWith('@')) {
                  setMessage(value);
                  setAtShow(true);
                } else {
                  setMessage(value);
                }
              } else {
                setMessage(value);
              }
            }}
            onPressEnter={(e) => {
              e.preventDefault();
              if (e.altKey === true && e.key === 'Enter') {
                setMessage((pre) => pre + '\n');
              } else {
                sendMessage();
              }
            }}
          /> */}
        </div>
        <OrgIcons type="/toolbar/setFull" size={22} notAvatar />
        <Divider type="vertical" style={{ margin: '0' }} />

        <Popover
          content={
            <Emoji
              onSelect={(emoji: string) => {
                setOpenEmoji(false);
                let mes = htmlMessage.replace(/<br\s*\/?>/gi, '').replace(/<\/p>$/, emoji +'</p>');
                setHtmlMessage(mes);
              }}
            />
          }
          open={openEmoji}
          trigger={['click', 'contextMenu']}
          onOpenChange={setOpenEmoji}>
          <OrgIcons type="/toolbar/emoji" size={22} notAvatar />
        </Popover>
        <UploadIcon
          size={22}
          onSelected={async (file) => {
            let msgType = MessageType.File;
            if (file.groupTags.includes('图片')) {
              msgType = MessageType.Image;
            } else if (file.groupTags.includes('视频')) {
              msgType = MessageType.Video;
            }
            await props.chat.sendMessage(msgType, JSON.stringify(file.shareInfo()), []);
          }}
        />
        {/* TODO 聊天历史入口 暂时隐藏 */}
        {/* <OrgIcons
          type="/toolbar/historyChat"
          size={22}
          notAvatar
          onClick={() => {
            setHistoryMessageModal(true);
          }}
        /> */}
        <Popover
          content={
            <List
              style={{ paddingLeft: '20px', paddingTop: '20px' }}
              grid={{ gutter: 4, column: 1 }}
              itemLayout="horizontal"
              dataSource={moreListItem}
              renderItem={(item) => (
                <List.Item style={{ cursor: 'pointer' }} onClick={item.onClick}>
                  <List.Item.Meta
                    avatar={<OrgIcons type={item.type} size={22} notAvatar />}
                    title={item.title}
                    description=""
                  />
                </List.Item>
              )}
            />
          }
          open={openMore}
          trigger={['click', 'contextMenu']}
          onOpenChange={setOpenMore}>
          <OrgIcons type="/toolbar/addCircle" size={22} notAvatar />
        </Popover>
        <Divider type="vertical" style={{ margin: '0' }} />
        <Button
          disabled={!htmlMessage.length}
          size="middle"
          onClick={() => sendMessage(htmlMessage)}
          style={{
            padding: '2px 14px 2px 6px',
          }}
          type={htmlMessage.length > 0 ? 'primary' : 'default'}
          icon={<OrgIcons type="/toolbar/send" size={20} notAvatar />}>
          <span style={{ fontSize: '14px', lineHeight: '20px', color: '#fff' }}>
            &nbsp;&nbsp;发送
          </span>
        </Button>
      </div>
      {openType && (
        <OpenFileDialog
          rootKey={'disk'}
          accepts={[openType]}
          allowInherited
          currentKey={props.chat.target.directory.key}
          onCancel={() => setOpenType(undefined)}
          onOk={async (files) => {
            if (files.length > 0) {
              switch (openType) {
                case '文件': {
                  const file = files[0] as ISysFileInfo;
                  let msgType = MessageType.File;
                  if (file.groupTags.includes('图片')) {
                    msgType = MessageType.Image;
                  } else if (file.groupTags.includes('视频')) {
                    msgType = MessageType.Video;
                  }
                  const share = JSON.stringify(file.shareInfo());
                  await props.chat.sendMessage(msgType, share, []);
                  break;
                }
                case '任务': {
                  const file = files[0] as IDistributionTask;
                  setTask(file);
                  setCreateTask(true);
                  break;
                }
              }
            }
            setOpenType(undefined);
          }}
        />
      )}
      {createTask && (
        <CreateTaskModal
          task={task!}
          onCancel={() => setCreateTask(false)}
          onFinished={async (dist) => {
            await props.chat.sendMessage(MessageType.Task, JSON.stringify(dist), []);
            setCreateTask(false);
          }}
        />
      )}
      {historyMessageModal && (
        <HistoryMessage chat={props.chat} handleCallBack={handleHistoryMessage} />
      )}
    </div>
  );
};

export default GroupInputBox;

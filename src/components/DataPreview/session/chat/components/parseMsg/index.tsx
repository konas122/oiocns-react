import React from 'react';
import {
  isURL,
  parseTolink,
  shareOpenLink,
  showChatTime,
  truncateString,
} from '@/utils/tools';
import { Divider, Image } from 'antd';
import { MessageType, IMessage } from '@/ts/core';
import { FileItemShare } from '@/ts/base/model';
import { command, parseAvatar } from '@/ts/base';
import { formatSize } from '@/ts/base/common';
import TypeIcon from '@/components/Common/GlobalComps/typeIcon';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import TaskMsg from '@/components/DataPreview/session/chat/Task/TaskMsg';
import LinkPreview from '@/components/TargetActivity/LinkPreview';
import ActivityResource from '@/components/TargetActivity/ActivityResource';
import TextParagraph from './textParagraph';

/**
 * 显示消息
 * @param item
 */
export const parseMsg = (item: IMessage): any => {
  switch (item.msgType) {
    case MessageType.Image: {
      const img: FileItemShare = parseAvatar(item.msgBody);
      if (img && img.shareLink) {
        return (
          <>
            <div
              className="con_content_txt con_content_image"
              onClick={() => {
                command.emitter('executor', 'open', img);
              }}>
              <Image
                className="image"
                width={300}
                src={shareOpenLink(img.shareLink)}
                preview={false}
              />
            </div>
          </>
        );
      }
      return <div className="con_content_txt">消息异常</div>;
    }
    case MessageType.Video: {
      const img: FileItemShare = parseAvatar(item.msgBody);
      if (img && img.shareLink) {
        return (
          <>
            <div
              className="con_content_txt"
              onClick={() => {
                command.emitter('executor', 'open', img);
              }}>
              {img?.thumbnail ? (
                <Image width={300} src={img.thumbnail} preview={false} />
              ) : (
                <div style={{ color: '#154ad8' }}>{img.name}</div>
              )}
            </div>
          </>
        );
      }
      return <div className="con_content_txt">消息异常</div>;
    }
    case MessageType.File: {
      const file: FileItemShare = parseAvatar(item.msgBody);
      if (!file) {
        return (
          <div className="con_content_txt" style={{ color: '#af1212' }}>
            文件消息异常
          </div>
        );
      }
      return (
        <>
          <div className={`con_content_txt con_content_file`}>
            <div className="flex">
              <TypeIcon iconType={file.contentType ?? 'unknown'} size={40} />
              <div className={`con_content_txt_inner`}>
                <div>{file.name}</div>
                <div className={`con_content_size`}>{formatSize(file.size)}</div>
              </div>
            </div>
            <Divider style={{ marginTop: '10px', marginBottom: '10px' }} />
            <div className="con_content_txt_action">
              <span
                onClick={() => {
                  command.emitter('executor', 'open', file);
                }}>
                在线预览
              </span>
              <Divider type="vertical" />
              <span
                onClick={() => {
                  window.open(shareOpenLink(file.shareLink, true));
                }}>
                点击下载
              </span>
            </div>
          </div>
        </>
      );
    }
    case MessageType.Voice: {
      const bytes = JSON.parse(item.msgBody).bytes;
      const blob = new Blob([new Uint8Array(bytes)], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      return (
        <>
          <div className="voiceStyle">
            <audio src={url} controls />
          </div>
        </>
      );
    }
    case MessageType.NameCard: {
      const data = parseAvatar(item.msgBody);
      return (
        <>
          <div
            className={`con_content_txt con_content_card`}
            onClick={(e) => {
              e.stopPropagation();
              command.emitter('executor', 'open', data, 'preview');
            }}>
            <div className="flex">
              <EntityIcon entity={data} showImInfo size={40} />
              <div className={`con_content_txt_inner`}>
                <div className={`con_content_txt_name`}>{data.name}</div>
                <div className={`con_content_name`}>{data.remark}</div>
              </div>
            </div>
            <Divider style={{ marginTop: '10px', marginBottom: '10px' }} />
            <div className="con_content_txt_personnelCard">
              <span>人员名片</span>
            </div>
          </div>
        </>
      );
    }
    case MessageType.Dynamic: {
      const data = parseAvatar(item.msgBody);
      return (
        <>
          <div
            className={`con_content_txt con_content_text activityItem`}
            onClick={() => {
              command.emitter('executor', 'open', item);
            }}>
            <div className="flex">
              <div className={`con_content_txt_textspan`}>
                {data.content.replace(/(<([^>]+)>)/gi, '')}
              </div>
              {data.resource.length < 1 ? null : (
                <Image.PreviewGroup>
                  {ActivityResource(data.resource.slice(0, 1), 60)}
                </Image.PreviewGroup>
              )}
            </div>
            <div>{isURL(data?.linkInfo) && <LinkPreview url={data.linkInfo} />}</div>
            <Divider style={{ marginTop: '10px', marginBottom: '10px' }} />
            <div className="con_content_txt_textowner">
              <EntityIcon entityId={data.createUser} showName showImInfo />
              <div style={{ float: 'right' }}>
                <span className={'activityTime mgl4'}>
                  发布于{showChatTime(data.createTime)}
                </span>
              </div>
            </div>
          </div>
        </>
      );
    }
    case MessageType.Task: {
      return (
        <>
          <div className="con_content_txt">
            <TaskMsg msg={item.msgBody} />
          </div>
        </>
      );
    }
    default: {
      // 优化截图展示问题
      if (item.msgBody.includes('$IMG')) {
        let str = item.msgBody;
        const matches = [...str.matchAll(/\$IMG\[([^\]]*)\]/g)];
        // 获取消息包含的图片地址
        const imgUrls = matches.map((match) => match[1]);
        // 替换消息里 图片信息特殊字符
        const willReplaceStr = matches.map((match) => match[0]);
        willReplaceStr.forEach((strItem) => {
          str = str.replace(strItem, ' ');
        });
        // 垂直展示截图信息。把文字消息统一放在底部
        return (
          <>
            <div className="con_content_txt">
              {imgUrls.map((url, idx) => (
                <Image className="cut_img" src={url} key={idx} preview={{ src: url }} />
              ))}
              {str.trim() && <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{str}</p>}
            </div>
          </>
        );
      }

      if (isURL(item.msgBody)) {
        return (
          <div className="con_content_txt">
            <LinkPreview url={item.msgBody} />
          </div>
        );
      }
      // 默认文本展示
      return <TextParagraph msgBody={item.msgBody} />;
    }
  }
};

/**
 * 解析引用消息
 * @param item 消息体
 * @returns 内容
 */
export const parseCiteMsg = (item: IMessage): any => {
  switch (item.msgType) {
    case MessageType.Image: {
      const img: FileItemShare = parseAvatar(item.msgBody);
      if (img && img.thumbnail) {
        return (
          <>
            <div className="con_content_cite_txt">
              <span>{item.from.name}:</span>
              <Image
                src={img.thumbnail}
                preview={{ src: shareOpenLink(img.shareLink) }}
              />
            </div>
          </>
        );
      }
      return <div className="con_content_cite_txt">消息异常</div>;
    }
    case MessageType.File: {
      const file: FileItemShare = parseAvatar(item.msgBody);
      return (
        <div className="con_content_cite_txt flex">
          <span>{item.from.name}:</span>
          <a className="flex" href={shareOpenLink(file.shareLink, true)} title="点击下载">
            <TypeIcon iconType={file.contentType ?? 'unknown'} size={40} />
            <div>
              <b>{file.name}</b>
              <div>{formatSize(file.size)}</div>
            </div>
          </a>
        </div>
      );
    }
    case MessageType.Voice: {
      const bytes = JSON.parse(item.msgBody).bytes;
      const blob = new Blob([new Uint8Array(bytes)], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      return (
        <div className="con_content_cite_txt">
          <span>{item.from.name}:</span>
          <div className="voiceStyle">
            <audio src={url} controls />
          </div>
        </div>
      );
    }
    case MessageType.NameCard: {
      const data = parseAvatar(item.msgBody);
      return (
        <>
          <div className="con_content_cite_card">
            <div className="flex">
              <EntityIcon entity={data} showImInfo size={40} />
              <div className={`con_content_txt_inner`}>
                <div className={`con_content_txt_name`}>{data.name}</div>
                <div className={`con_content_name`}>{data.remark}</div>
              </div>
            </div>
            <Divider style={{ marginTop: '10px', marginBottom: '10px' }} />
            <div className="con_content_txt_personnelCard">
              <span>人员名片</span>
            </div>
          </div>
        </>
      );
    }
    case MessageType.Dynamic: {
      const data = parseAvatar(item.msgBody);
      return (
        <>
          <div className="con_content_cite_card">
            <div className="flex">
              <div className={`con_content_txt_textspan`}>
                {data.content.replace(/(<([^>]+)>)/gi, '')}
              </div>
              {data.resource.length < 1 ? null : (
                <Image.PreviewGroup>
                  {ActivityResource(data.resource.slice(0, 1), 60)}
                </Image.PreviewGroup>
              )}
            </div>
            <Divider style={{ marginTop: '10px', marginBottom: '10px' }} />
            <div className="con_content_txt_textowner">
              <span className={'activityTime mgl4'}>
                发布于{showChatTime(data.createTime)}
              </span>
              <div style={{ float: 'right' }}>
                <EntityIcon entityId={data.createUser} showName showImInfo />
              </div>
            </div>
          </div>
        </>
      );
    }
    case MessageType.Task: {
      return (
        <>
          <div className="con_content_cite_txt">
            <span>{item.from.name}:</span>
            <div style={{ marginTop: 10 }}>
              <TaskMsg msg={item.msgBody} />
            </div>
          </div>
        </>
      );
    }
    default: {
      // 优化截图展示问题
      if (item.msgBody.includes('$IMG')) {
        let str = item.msgBody;
        const matches = [...str.matchAll(/\$IMG\[([^\]]*)\]/g)];
        // 获取消息包含的图片地址
        const imgUrls = matches.map((match) => match[1]);
        // 替换消息里 图片信息特殊字符
        const willReplaceStr = matches.map((match) => match[0]);
        willReplaceStr.forEach((strItem) => {
          str = str.replace(strItem, ' ');
        });
        // 垂直展示截图信息。把文字消息统一放在底部
        return (
          <>
            <div className="con_content_cite_txt">
              <span>{item.from.name}:</span>
              {imgUrls.map((url, idx) => (
                <Image className="cut_img" src={url} key={idx} preview={{ src: url }} />
              ))}
              {str.trim() && <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{str}</p>}
            </div>
          </>
        );
      }
      // 默认文本展示
      return (
        <div className="con_content_cite_txt">
          <span>{item.from.name}:</span>
          <div
            dangerouslySetInnerHTML={{
              __html: truncateString(parseTolink(item.msgBody), 80),
            }}></div>
        </div>
      );
    }
  }
};

/**
 * 解析转发消息
 * @param item 消息体
 * @returns 内容
 */
export const parseForwardMsg = (
  item: IMessage[],
  viewForward?: (item: IMessage[]) => void,
) => {
  let formName = Array.from(
    new Set(item.map((msg: IMessage) => msg.from.name).filter((name: string) => name)),
  );
  let showName =
    formName && formName.length > 2
      ? '群聊'
      : `${formName[0]}${formName[1] ? '和' + formName[1] : ''}的`;
  return (
    <div
      className="con_content_forward_txt"
      onClick={() => viewForward && viewForward(item)}>
      <div className="con_content_forward_session">{`${showName}会话消息`}</div>
      {item.map((msg: IMessage, idx: number) => {
        // 默认只展示3条记录
        if (idx > 2) return;
        if (!msg.msgBody && msg.forward?.length) {
          msg = msg.forward[0];
        }
        switch (msg.msgType) {
          case MessageType.Image: {
            const img: FileItemShare = parseAvatar(msg.msgBody);
            if (img)
              return (
                <div className="con_content_forward_msg">
                  {msg.from.name}:{img.name}
                </div>
              );
            return <div className="con_content_forward_msg">消息异常</div>;
          }
          case MessageType.File: {
            const file: FileItemShare = parseAvatar(msg.msgBody);
            return (
              <div className="con_content_forward_msg">
                {msg.from.name}:{file.name}
              </div>
            );
          }
          case MessageType.Voice: {
            const bytes = JSON.parse(msg.msgBody).bytes;
            const blob = new Blob([new Uint8Array(bytes)], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            return (
              <div className="con_content_forward_msg">
                {msg.from.name}:{url}
              </div>
            );
          }
          case MessageType.Task: {
            return (
              <>
                <div className="con_content_forward_msg">{msg.from.name}:【任务】</div>
              </>
            );
          }
          default: {
            // 优化截图展示问题
            if (msg.msgBody.includes('$IMG')) {
              let str = msg.msgBody;
              const matches = [...str.matchAll(/\$IMG\[([^\]]*)\]/g)];
              // 获取消息包含的图片地址
              // const imgUrls = matches.map((match) => match[1]);
              // 替换消息里 图片信息特殊字符
              const willReplaceStr = matches.map((match) => match[0]);
              willReplaceStr.forEach((strItem) => {
                str = str.replace(strItem, ' ');
              });
              // 垂直展示截图信息。把文字消息统一放在底部
              return (
                <div className="con_content_forward_msg">
                  {msg.from.name}:【图片】{str.trim()}
                </div>
              );
            }
            // 默认文本展示
            return (
              <div className="con_content_forward_msg">
                <span>{msg.from.name}：</span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: truncateString(parseTolink(msg.msgBody), 80),
                  }}></span>
              </div>
            );
          }
        }
      })}
    </div>
  );
};

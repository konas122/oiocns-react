import { common, model, parseAvatar } from '../../base';
import { MessageType, TargetType } from '../public';
import { IBelong } from '../target/base/belong';
import { IPerson } from '../target/person';
import { ISession } from './session';
export interface IMessageLabel {
  /** 标签名称 */
  label: string;
  /** 贴标签的人 */
  labeler: model.ShareIcon;
  /** 贴标签的时间 */
  time: string;
  /** 代表组织Id */
  designateId: string;
  /** 用户Id */
  userId: string;
}
export class MessageLabel implements IMessageLabel {
  constructor(_matedata: model.CommentType, target: IPerson) {
    this.user = target.user;
    this.metadata = _matedata;
  }
  user: IPerson;
  metadata: model.CommentType;
  get label(): string {
    return this.metadata.label;
  }
  get userId(): string {
    return this.metadata.userId;
  }
  get designateId(): string {
    return this.metadata.designateId;
  }
  get labeler(): model.ShareIcon {
    return this.user.findShareById(this.metadata.designateId ?? this.metadata.userId);
  }
  get time(): string {
    return this.metadata.time;
  }
}
export interface IMessage {
  /** 消息id */
  id: string;
  /** 元数据 */
  metadata: model.ChatMessageType;
  /** 发送方 */
  from: model.ShareIcon;
  /** 接收方 */
  to: model.ShareIcon;
  /** 是否是我发的 */
  isMySend: boolean;
  /** 是否已读 */
  isReaded: boolean;
  /** 提及 */
  mentions: string[];
  /** 引用 */
  cite: IMessage | undefined;
  /** 转发 */
  forward: IMessage[];
  /** 标签信息 */
  labels: IMessageLabel[];
  /** 消息类型 */
  msgType: string;
  /** 消息标题 */
  msgTitle: string;
  /** 消息内容 */
  msgBody: string;
  /** 源消息 */
  msgSource: string;
  /** 创建时间 */
  createTime: string;
  /** 允许撤回 */
  allowRecall: boolean;
  /** 允许编辑 */
  allowEdit: boolean;
  /** 已读信息 */
  readedinfo: string;
  /** 已读人员 */
  readedIds: string[];
  /** 未读人员信息 */
  unreadInfo: IMessageLabel[];
  /** 评论数 */
  comments: number;
  /** 会话 */
  chat: ISession;
}
export class Message implements IMessage {
  constructor(_metadata: model.ChatMessageType, _chat: ISession) {
    this._chat = _chat;
    this.user = _chat.target.user;
    _metadata.comments = _metadata.comments || [];
    const txt = common.StringPako.inflate(_metadata.content);
    if (txt.startsWith('[obj]')) {
      const content = JSON.parse(txt.substring(5));
      this._msgBody = content.body;
      this.mentions = content.mentions;
      if (content.cite) {
        this.cite = new Message(content.cite, _chat);
      }
      if (content.forward) {
        content.forward.map((item: model.ChatMessageType) => {
          this.forward.push(new Message(item, _chat));
        });
      }
    } else {
      this._msgBody = txt;
    }
    this.metadata = _metadata;
    _metadata.comments.map((tag) => {
      this.labels.push(new MessageLabel(tag, this.user));
    });
  }
  cite: IMessage | undefined;
  forward: IMessage[] = [];
  mentions: string[] = [];
  user: IPerson;
  _chat: ISession;
  _msgBody: string;
  labels: IMessageLabel[] = [];
  metadata: model.ChatMessageType;
  get id(): string {
    return this.metadata.id;
  }
  get msgType(): string {
    return this.metadata.typeName;
  }
  get createTime(): string {
    return this.metadata.createTime;
  }
  get from(): model.ShareIcon {
    return this.user.findShareById(this.metadata.fromId);
  }
  get to(): model.ShareIcon {
    return this.user.findShareById(this.metadata.toId);
  }
  get isMySend(): boolean {
    return this.metadata.fromId === this.user.id;
  }
  get chat(): ISession {
    return this._chat;
  }
  get isReaded(): boolean {
    return (
      this.isMySend ||
      this._chat.isBelongPerson ||
      this.labels.some((i) => i.userId === this.user.id)
    );
  }
  get readedinfo(): string {
    const ids = this.readedIds;
    if (ids.length === 0) {
      return '全部未读';
    }
    if (this._chat.metadata.typeName === TargetType.Person) {
      return ids.length === 1 ? '已读' : '未读';
    }
    if (ids.length === this._chat.memberCount - 1) {
      return '全部已读';
    }
    return this._chat.memberCount - ids.length - 1 + '人未读';
  }
  get readedIds(): string[] {
    const ids = this.labels.map((v) => v.userId);
    return ids.filter((id, i) => ids.indexOf(id) === i);
  }
  get unreadInfo(): IMessageLabel[] {
    const ids = this.readedIds;
    return this._chat.members
      .filter((m) => !ids.includes(m.id) && m.id != this.user.id)
      .map(
        (m) =>
          new MessageLabel(
            {
              id: m.id,
              label: m.remark,
              userId: m.id,
              designateId: m.id,
              time: '',
            },
            this.user,
          ),
      );
  }
  get comments(): number {
    return this.labels.filter((v) => v.label != '已读').length;
  }
  get allowRecall(): boolean {
    if (!this.isMySend) {
      return false;
    }
    switch (this.msgType) {
      case MessageType.Recall:
        return false;
      case MessageType.Task:
        return true;
      default:
        return new Date().getTime() - new Date(this.createTime).getTime() < 2 * 60 * 1000;
    }
  }
  get allowEdit(): boolean {
    return this.isMySend && this.msgType === MessageType.Recall;
  }
  get msgTitle(): string {
    let header = ``;
    if (this._chat.metadata.typeName != TargetType.Person) {
      header += `${this.from.name}: `;
    }
    switch (this.msgType) {
      case MessageType.Text:
      case MessageType.Notify:
      case MessageType.Recall:
        return `${header}${this.msgBody.substring(0, 50)}`;
      case MessageType.Voice:
        return `${header}[${MessageType.Voice}]`;
      case MessageType.Forward:
        return `${this.forward.length}条转发信息`;
      case MessageType.Dynamic:
        return `${this.from.name}[${this.msgType}]:${parseAvatar(
          this.msgBody,
        ).content.replace(/(<([^>]+)>)/gi, '')}`;
    }
    const file: model.FileItemShare = parseAvatar(this.msgBody);
    if (file) {
      return `${header}[${this.msgType}]:${file.name}(${common.formatSize(file.size)})`;
    }
    return `${header}[${this.msgType}]:解析异常`;
  }
  get msgBody(): string {
    if (this.msgType === MessageType.Recall) {
      return (this.isMySend ? '我' : this.from.name) + '撤回了一条消息';
    }
    return this._msgBody;
  }
  get msgSource(): string {
    return this._msgBody;
  }
}
export class GroupMessage extends Message {
  space: IBelong;
  constructor(_metadata: model.ChatMessageType, _chat: ISession) {
    super(_metadata, _chat);
    this.space = _chat.target.space;
  }
  get isMySend(): boolean {
    return (
      this.metadata.fromId === this.user.id && this.metadata.designateId === this.space.id
    );
  }
  get isReaded(): boolean {
    return true
  }
  get readedinfo(): string {
    const ids = this.readedIds;
    if (ids.length === 0) {
      return '全部未读';
    }
    const noread = this._chat.members
      .filter((i) => i.id != this.metadata.designateId)
      .filter((i) => !ids.includes(i.id)).length;
    if (noread === 0) {
      return '全部已读';
    }
    return noread + '人未读';
  }
  get readedIds(): string[] {
    const ids = this.labels
      .map((v) => v.designateId)
      .filter((a) => a != this.metadata.designateId);
    return ids.filter((id, i) => ids.indexOf(id) === i);
  }
  get unreadInfo(): IMessageLabel[] {
    const ids = this.readedIds;
    return this._chat.members
      .filter((m) => !ids.includes(m.id) && m.id != this.metadata.designateId)
      .map(
        (m) =>
          new MessageLabel(
            {
              id: m.id,
              label: m.remark,
              userId: m.id,
              designateId: m.id,
              time: '',
            },
            this.user,
          ),
      );
  }
}

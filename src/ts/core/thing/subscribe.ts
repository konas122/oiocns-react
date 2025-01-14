import { common, kernel, model } from '@/ts/base';
import { Emitter } from '@/ts/base/common';
import { LoadResult } from '@/ts/base/model';
import {
  XEntity,
  XRevision,
  XSubscription,
  XSyncing,
  XWorkDefine,
} from '@/ts/base/schema';
import { getEndNode } from '@/utils/work';
import { IBelong, IFile } from '..';
import { PageAll } from '../public';
import { XCollection } from '../public/collection';
import { DataResource } from './resource';

interface Params {
  take: number;
  skip: number;
}

type OnProgress = (current: number, total: number) => void;

export interface ISyncing<T extends XSyncing> {
  /** 主键 */
  id: string;
  /** 元数据 */
  metadata: T;
  /** 源 */
  source: DataResource;
  /** 目标 */
  target: DataResource;
  /** 剩余 */
  remainder: number;
  /** 计数 */
  counting(reload?: boolean): Promise<number>;
  /** 同步 */
  syncing(onProgress?: OnProgress): Promise<boolean>;
  /** 查询 */
  loadRevisions(params: Params): Promise<LoadResult<XRevision<XEntity>[]>>;
}

export abstract class Syncing<T extends XSyncing> implements ISyncing<T> {
  constructor(metadata: T, source: DataResource, target: DataResource) {
    this.metadata = metadata;
    this.source = source;
    this.target = target;
  }
  source: DataResource;
  target: DataResource;
  metadata: T;
  remainder = 0;
  loaded = false;
  worksCache: { [applicationId: string]: XWorkDefine[] } = {};
  get id() {
    return this.metadata.id;
  }
  get match() {
    const match: any = { labels: { _in_: [this.metadata.id] } };
    if (this.metadata.syncTime) {
      match.updateTime = { _gte_: new Date(this.metadata.syncTime) };
    }
    return match;
  }
  async counting(reload?: boolean): Promise<number> {
    if (reload || !this.loaded) {
      this.loaded = true;
      this.remainder = await this.source.revisionColl.count({
        options: { match: this.match },
      });
    }
    return this.remainder;
  }
  async syncing(onProgress?: OnProgress): Promise<boolean> {
    let skip = 0;
    let take = 10;
    let running = true;
    const remainder = await this.counting(true);
    this.worksCache = {};
    while (running) {
      const res = await this.source.revisionColl.loadResult({
        options: {
          match: this.match,
          sort: { createTime: 1 },
        },
        skip,
        take,
      });
      if (res.success && res.data && res.data.length > 0) {
        await this.target.revisionColl.replaceMany(res.data);
        for (const item of res.data) {
          switch (item.data.typeName) {
            case '办事':
            case '集群模板':
              await this.handlingWork(item);
              break;
            default: {
              const coll = this.target.genColl(item.collName);
              switch (item.operate) {
                case 'insert':
                case 'move':
                case 'update':
                  await coll.replace(item.data);
                  break;
                case 'delete':
                  await coll.remove(item.data);
                  break;
              }
              break;
            }
          }
        }
        skip += res.data.length;
        await this.update(this.metadata);
        onProgress?.(skip, remainder);
      } else {
        running = false;
      }
    }
    onProgress?.(remainder, remainder);
    return true;
  }
  abstract update(metadata: T): Promise<T | undefined>;
  private async handlingWork(revision: XRevision<XWorkDefine>): Promise<void> {
    const define = revision.data;
    if (!this.worksCache[define.applicationId]) {
      const matched = await kernel.queryWorkDefine({
        id: define.applicationId,
        shareId: define.shareId,
      });
      this.worksCache[define.applicationId] = matched?.data.result ?? [];
    }
    switch (revision.operate) {
      case 'insert': {
        const result = await kernel.queryWorkNodes({
          id: define.id,
          shareId: define.shareId,
        });
        if (result) {
          let node = result.data;
          let entNode = getEndNode(node);
          if (node && node.code) {
            delete node.children;
            delete node.branches;
          } else {
            node = {
              code: `node_${common.generateUuid()}`,
              type: '起始',
              name: '发起',
              num: 1,
              forms: [],
              executors: [],
              formRules: [],
              primaryPrints: [],
              primaryForms: [],
              detailForms: [],
            } as unknown as model.WorkNodeModel;
          }
          node.children = entNode;
          await kernel.createWorkDefine({
            id: '0',
            primaryId: '0',
            name: define.name,
            code: define.code,
            icon: define.icon,
            remark: define.remark,
            shareId: this.target.targetMetadata.id,
            applicationId: define.applicationId,
            applyAuth: '0',
            sourceId: define.id,
            node: node,
            applyType: define.applyType,
            hasGateway: define.hasGateway,
            isPrivate: define.isPrivate,
            canUrge: define.canUrge,
            allowInitiate: define.allowInitiate,
            belongId: define.belongId,
          });
        }
        break;
      }
      case 'move':
      case 'update':
        break;
      case 'delete': {
        const works = this.worksCache[define.applicationId] ?? [];
        const work = works.find((item) => item.sourceId == define.id);
        if (work) {
          await kernel.deleteWorkDefine({ id: work.id, shareId: work.shareId });
        }
        break;
      }
    }
  }
  async loadRevisions(params: Params): Promise<LoadResult<XRevision<XEntity>[]>> {
    return await this.source.revisionColl.loadResult({
      options: {
        ...params,
        match: this.match,
      },
    });
  }
}

export interface ISubscriptionManager extends Emitter {
  /** 归属组织 */
  space: IBelong;
  /** 同步集合 */
  coll: XCollection<XSubscription>;
  /** 所有订阅 */
  subscriptions: ISubscription[];
  /** 创建订阅 */
  upsert(data: XSubscription): Promise<XSubscription | undefined>;
  /** 删除订阅 */
  remove(data: XSubscription): Promise<XSubscription | undefined>;
  /** 创建临时同步 */
  create(file: IFile): Promise<boolean>;
  /** 加载所有订阅 */
  loadSubscriptions(reload?: boolean): Promise<ISubscription[]>;
  /** 查询某个订阅 */
  find(id: string): ISubscription | undefined;
}

export class SubscriptionManager extends Emitter implements ISubscriptionManager {
  constructor(belong: IBelong) {
    super();
    this.space = belong;
    this.coll.subscribe([this.key], (data) => {
      switch (data.operate) {
        case 'replace':
          this.replace(data.result);
          break;
        case 'remove':
          this.subscriptions = this.subscriptions.filter((item) => {
            return item.metadata.id != data.result.id;
          });
          break;
      }
      this.changCallback();
    });
  }
  space: IBelong;
  subscriptions: ISubscription[] = [];
  loaded: boolean = false;
  get key() {
    return this.space.key + '-subscribe';
  }
  get coll(): XCollection<XSubscription> {
    return this.space.resource.subscriptionColl;
  }
  async upsert(data: XSubscription): Promise<XSubscription | undefined> {
    data.syncTime = new Date() as any;
    data.canceled = false;
    const result = await this.coll.replace(data);
    if (result) {
      this.replace(result);
      await this.coll.notity({ operate: 'replace', result }, true);
    }
    return result;
  }
  async create(file: IFile): Promise<boolean> {
    const target = file.directory.target;
    if (target.belongId == this.space.id) {
      return false;
    }
    let coll = this.space.resource.genColl<XSyncing>('syncing-' + target.id);
    let result = await coll.find([file.id]);
    let syncing: XSyncing | undefined;
    if (result.length == 0) {
      syncing = await coll.replace({ id: file.id } as XSyncing);
    } else {
      syncing = result[0];
    }
    if (!syncing) {
      return false;
    }
    const copy = new CopySyncing(syncing, file.directory.resource, this.space.resource);
    return await copy.syncing();
  }
  private replace(data: XSubscription): void {
    let index = this.subscriptions.findIndex((item) => {
      return item.metadata.id == data.id;
    });
    if (index > -1) {
      this.subscriptions[index].metadata = data;
    } else {
      this.subscriptions.push(new Subscription(this, this.space.resource, data));
    }
  }
  async remove(data: XSubscription): Promise<XSubscription | undefined> {
    data.canceled = true;
    const result = await this.coll.replace(data);
    if (result) {
      await this.coll.notity({ operate: 'remove', result: data });
    }
    return result;
  }
  async loadSubscriptions(reload?: boolean): Promise<ISubscription[]> {
    if (!this.loaded || reload) {
      this.loaded = true;
      this.subscriptions = [];
      const items = await this.coll.loadSpace({
        options: { match: { isDeleted: false, canceled: false } },
      });
      for (const item of items) {
        const subscribe = new Subscription(this, this.space.resource, item);
        this.subscriptions.push(subscribe);
      }
    }
    return this.subscriptions;
  }
  find(id: string): ISubscription | undefined {
    return this.space.manager.subscriptions.find((item) => {
      return item.metadata.id == id;
    });
  }
}

export interface ISubscription extends ISyncing<XSubscription> {
  /** 管理 */
  manager: ISubscriptionManager;
}

export class Subscription extends Syncing<XSubscription> implements ISubscription {
  constructor(
    manager: ISubscriptionManager,
    target: DataResource,
    metadata: XSubscription,
  ) {
    super(metadata, new DataResource(metadata.target, metadata.relations, []), target);
    this.metadata = metadata;
    this.manager = manager;
    this.subscribe(this.source.revisionColl, 'source');
    this.subscribe(this.target.revisionColl, 'target');
  }
  manager: ISubscriptionManager;
  remainder: number = 0;
  metadata: XSubscription;
  loaded: boolean = false;
  private subscribe(coll: XCollection<XRevision<any>>, key: string) {
    coll.subscribe([this.metadata.id + '-' + key], async (data) => {
      switch (data.operate) {
        case 'refresh':
          await this.counting(true);
          break;
      }
      this.manager.space.directory.changCallback();
    });
  }
  async update(metadata: XSubscription): Promise<XSubscription | undefined> {
    metadata.syncTime = new Date() as any;
    return await this.manager.upsert(metadata);
  }
  async syncing(onProgress?: OnProgress | undefined): Promise<boolean> {
    const success = await super.syncing(onProgress);
    if (success) {
      await this.target.revisionColl.notity({ operate: 'refresh' });
    }
    return success;
  }
}

export class CopySyncing extends Syncing<XSyncing> {
  constructor(metadata: XSyncing, source: DataResource, target: DataResource) {
    super(metadata, source, target);
    const meta = `syncing-${source.targetMetadata.id}`;
    this.coll = target.genColl<XSyncing>(meta);
  }
  coll: XCollection<XSyncing>;
  async update(metadata: XSyncing): Promise<XSyncing | undefined> {
    metadata.syncTime = new Date() as any;
    const result = await this.coll.replace(metadata);
    if (result) {
      this.metadata = result;
    }
    return result;
  }
}

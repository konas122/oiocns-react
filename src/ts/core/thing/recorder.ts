import { LoadResult } from '@/ts/base/model';
import { ITarget, XCollection } from '..';
import { XEntity, XRevision } from '../../base/schema';
import { IFileInfo } from './fileinfo';

interface Updater<T extends XEntity> {
  coll: XCollection<T>;
  next: T;
  notify?: boolean;
}

interface Saver<T extends XEntity> extends Updater<T> {
  operate: string;
  path: string[];
}

interface UpdaterBatch<T extends XEntity> {
  coll: XCollection<T>;
  next: T[];
  notify?: boolean;
}

interface SaverBatch<T extends XEntity> extends UpdaterBatch<T> {
  operate: string;
  path: string[];
}

interface Mover<T extends XEntity> extends Updater<T> {
  destination: IFileInfo<XEntity>;
}

interface Changer<T extends XEntity> extends Updater<T> {
  prev: T;
}

interface Loader {
  skip: number;
  take: number;
  sort?: 'asc' | 'desc';
  countQuery?: boolean;
}

export interface IRecorder<T extends XEntity> {
  /** 组织对象 */
  target: ITarget;
  /** 系统项 */
  file: IFileInfo<T>;
  /** 变化集合 */
  coll: XCollection<XRevision<XEntity>>;
  /** 保存变化 */
  save<O extends XEntity>(saver: Saver<O>): Promise<XRevision<O> | undefined>;
  /** 更新变化（自身） */
  update(updater: Updater<T>): Promise<XRevision<T> | undefined>;
  /** 移除变化（自身） */
  remove(updater: Updater<T>): Promise<XRevision<T> | undefined>;
  /** 创建变化（子变化） */
  creating<O extends XEntity>(updater: Updater<O>): Promise<XRevision<O> | undefined>;
  /** 移动变化（子变化） */
  moving<O extends XEntity>(mover: Mover<O>): Promise<XRevision<O>[]>;
  /** 删除变化（子变化） */
  deleting<O extends XEntity>(updater: Updater<O>): Promise<XRevision<O> | undefined>;
  /** 批量删除 */
  batchDeleting<O extends XEntity>(up: UpdaterBatch<O>): Promise<XRevision<O>[]>;
  /** 更新变化（子变化）*/
  updating<O extends XEntity>(changer: Changer<O>): Promise<XRevision<O> | undefined>;
  /** 加载某一时刻之后的变化 */
  loadRevisions(loader: Loader): Promise<LoadResult<XRevision<T>[]>>;
  /** 删除变化 */
  delete<O extends XEntity>(data: XRevision<O>): Promise<boolean>;
  /** 清空变化 */
  clear(): Promise<boolean>;
}

export class Recorder<T extends XEntity> implements IRecorder<T> {
  constructor(item: IFileInfo<T>) {
    this.file = item;
  }
  file: IFileInfo<T>;
  get target() {
    return this.file.directory.target;
  }
  get coll() {
    return this.file.directory.resource.revisionColl;
  }
  async save<O extends XEntity>(p: Saver<O>): Promise<XRevision<O> | undefined> {
    return await this.coll.insert({
      operate: p.operate,
      collName: p.coll.collName,
      data: p.next,
      labels: p.path,
    } as XRevision<O>);
  }
  async saveBatch<O extends XEntity>(bp: SaverBatch<O>): Promise<XRevision<O>[]> {
    return await this.coll.insertMany(
      bp.next.map(
        (p) =>
          ({
            operate: bp.operate,
            collName: bp.coll.collName,
            data: p,
            labels: [...bp.path, p.id],
          } as XRevision<O>),
      ),
    );
  }
  async update(up: Updater<T>): Promise<XRevision<T> | undefined> {
    return this.save({
      coll: up.coll,
      path: this.file.path,
      operate: 'update',
      next: up.next,
      notify: up.notify,
    });
  }
  async remove(up: Updater<T>): Promise<XRevision<T> | undefined> {
    return this.save({
      coll: up.coll,
      path: this.file.path,
      operate: 'delete',
      next: up.next,
      notify: up.notify,
    });
  }
  async creating<O extends XEntity>(up: Updater<O>): Promise<XRevision<O> | undefined> {
    return this.save({
      coll: up.coll,
      path: [...this.file.path, up.next.id],
      operate: 'insert',
      next: up.next,
      notify: up.notify,
    });
  }
  async deleting<O extends XEntity>(up: Updater<O>): Promise<XRevision<O> | undefined> {
    return this.save({
      coll: up.coll,
      path: [...this.file.path, up.next.id],
      operate: 'delete',
      next: up.next,
      notify: up.notify,
    });
  }
  async batchDeleting<O extends XEntity>(up: UpdaterBatch<O>): Promise<XRevision<O>[]> {
    return this.saveBatch({
      coll: up.coll,
      path: this.file.path,
      operate: 'delete',
      next: up.next,
      notify: up.notify,
    });
  }
  async updating<O extends XEntity>(cg: Changer<O>): Promise<XRevision<O> | undefined> {
    return this.save({
      coll: cg.coll,
      path: [...this.file.path, cg.next.id],
      operate: 'update',
      next: cg.next,
      notify: cg.notify,
    });
  }
  async moving<O extends XEntity>(p: Mover<O>): Promise<XRevision<O>[]> {
    const result: XRevision<O>[] = [];
    const prev = await this.save<O>({
      coll: p.coll,
      path: [...this.file.path, p.next.id],
      operate: 'move',
      next: p.next,
      notify: p.notify,
    });
    const next = await p.destination.recorder.save<O>({
      coll: p.coll,
      path: [...p.destination.recorder.file.path, p.next.id],
      operate: 'move',
      next: p.next,
      notify: p.notify,
    });
    if (prev) {
      result.push(prev);
    }
    if (next) {
      result.push(next);
    }
    return result;
  }
  async loadRevisions(loader: Loader): Promise<LoadResult<XRevision<T>[]>> {
    return this.coll.loadResult({
      options: {
        match: { labels: { _in_: [this.file.id] } },
        sort: {
          createTime: loader.sort == 'asc' ? 1 : -1,
        },
      },
      requireTotalCount: true,
      isCountQuery: loader.countQuery ?? false,
      skip: loader.skip,
      take: loader.take,
    });
  }
  async delete<O extends XEntity>(data: XRevision<O>): Promise<boolean> {
    if (await this.coll.remove(data)) {
      await this.coll.notity({ operate: 'refresh' });
    }
    return true;
  }
  clear(): Promise<boolean> {
    return this.coll.removeMatch({ labels: { _in_: [this.file.id] } });
  }
}

import { LoadOptions, LoadResult } from '@/ts/base/model';
import { kernel, schema } from '../../base';

/** 集合工具类 */
export class XCollection<T extends schema.Xbase> {
  private _loaded: boolean;
  private _cache: T[];
  private _collName: string;
  private _target: schema.XTarget;
  private _relations: string[];
  private _keys: string[];
  constructor(target: schema.XTarget, name: string, relations: string[], keys: string[]) {
    this._cache = [];
    this._keys = keys;
    this._loaded = false;
    this._collName = name;
    this._target = target;
    this._relations = relations;
  }

  get cache(): T[] {
    return this._cache;
  }

  get collName(): string {
    return this._collName;
  }

  subMethodName(id?: string): string {
    return `${this._target.belongId}-${id || this._target.id}-${this._collName}`;
  }

  async all(reload: boolean = false, skip: number = 0): Promise<T[]> {
    if (!this._loaded || reload) {
      this._loaded = true;
      if (skip === 0) {
        this._cache = [];
      }
      const data = await this.load({
        skip: skip,
        take: 500,
        requireTotalCount: false,
      });
      if (data && Array.isArray(data) && data.length > 0) {
        this._cache.push(...data);
        if (data.length === 500) {
          await this.all(true, this._cache.length);
        }
      }
    }
    return this._cache;
  }

  async find(ids?: string[]): Promise<T[]> {
    if (ids && ids.length > 0) {
      return await this.loadSpace({
        options: {
          match: {
            id: {
              _in_: ids,
            },
          },
        },
      });
    }
    return [];
  }

  async loadResult(options: LoadOptions<T>): Promise<LoadResult<T[]>> {
    options = options || {};
    options.userData = options.userData || [];
    options.options = options.options || {};
    options.options.match = options.options.match || {};
    let _targetId = options?.clusterId ?? this._target.id;
    let _belongId = this._target.belongId;
    let _relations = [...this._relations];
    if (options?.extraReations) {
      if (Array.isArray(options.extraReations) && options.extraReations.length > 0) {
        _relations = _relations.concat(options.extraReations);
        _targetId = options.extraReations.at(-1) as string;
      }

      if (typeof options.extraReations === 'string') {
        _relations.push(options.extraReations);
        _targetId = options.extraReations;
      }

      delete options.extraReations;
    }
    return await kernel.collectionLoad<T[]>(
      _targetId,
      _belongId,
      _relations,
      this._collName,
      options,
    );
  }

  async loadSpace<U = T>(options: LoadOptions<T>): Promise<U[]> {
    const res = await this.loadResult(options);
    if (res.success && res.data) {
      return (res.data as any as U[]) || [];
    }
    return [];
  }

  async loadAggregate(options: any): Promise<any> {
    const res = await kernel.collectionAggregate(
      this._target.id,
      this._target.belongId,
      this._relations,
      this._collName,
      options,
    );
    if (res.success && res.data) {
      return (res.data as any as U[]) || [];
    }
  }

  async count(options: LoadOptions<T> = {}): Promise<number> {
    options.userData ||= [];
    options.options ||= {};
    options.options.match ||= {};
    options.isCountQuery = true;
    const res = await this.loadResult(options);
    if (res.success && typeof res.totalCount === 'number') {
      return res.totalCount;
    }
    return 0;
  }

  async load(options: LoadOptions<T>): Promise<T[]> {
    options = options || {};
    options.options = options.options || {};
    options.options.match = options.options.match || {};
    options.options.match.shareId = this._target.id;
    return await this.loadSpace(options);
  }

  async insert(data: T, copyId?: string): Promise<T | undefined> {
    data.id = data.id || 'snowId()';
    data.shareId = this._target.id;
    data.belongId = data.belongId || this._target.belongId;
    const res = await kernel.collectionInsert<T>(
      this._target.id,
      this._target.belongId,
      this._relations,
      this._collName,
      data,
      copyId,
    );
    if (res.success) {
      return res.data;
    }
  }

  async insertMany(data: T[], copyId?: string): Promise<T[]> {
    if (data.length < 1) return data;
    data = data.map((a) => {
      a.id = a.id || 'snowId()';
      a.shareId = this._target.id;
      a.belongId = a.belongId || this._target.belongId;
      return a;
    });
    const res = await kernel.collectionInsert<T[]>(
      this._target.id,
      this._target.belongId,
      this._relations,
      this._collName,
      data,
      copyId,
    );
    if (res.success) {
      if (!Array.isArray(res.data)) {
        res.data = [res.data as unknown as T];
      }
      return res.data || [];
    }
    return [];
  }

  async replace(data: T, copyId?: string): Promise<T | undefined> {
    data.id = data.id || 'snowId()';
    data.shareId = this._target.id;
    data.belongId = data.belongId || this._target.belongId;
    const res = await kernel.collectionReplace<T>(
      this._target.id,
      this._target.belongId,
      this._relations,
      this._collName,
      data,
      copyId,
    );
    if (res.success) {
      return res.data;
    }
  }

  async replaceMany(data: T[], copyId?: string): Promise<T[]> {
    if (data.length < 1) return data;
    data = data.map((a) => {
      a.id = a.id || 'snowId()';
      a.shareId = this._target.id;
      a.belongId = a.belongId || this._target.belongId;
      return a;
    });
    const res = await kernel.collectionReplace<T[]>(
      this._target.id,
      this._target.belongId,
      this._relations,
      this._collName,
      data,
      copyId,
    );
    if (res.success) {
      return res.data || [];
    }
    return [];
  }
  async update(id: string, update: any, copyId?: string): Promise<T | undefined> {
    const res = await kernel.collectionSetFields<T>(
      this._target.id,
      this._target.belongId,
      this._relations,
      this._collName,
      {
        id,
        update,
      },
      copyId,
    );
    if (res.success) {
      return res.data;
    }
  }

  async updateMany(ids: string[], update: any, copyId?: string): Promise<T[]> {
    const res = await kernel.collectionSetFields<T[]>(
      this._target.id,
      this._target.belongId,
      this._relations,
      this._collName,
      {
        ids,
        update,
      },
      copyId,
    );
    if (res.success) {
      return res.data;
    }
    return [];
  }

  async updateMatch(match: any, update: any, copyId?: string): Promise<boolean> {
    const res = await kernel.collectionUpdate(
      this._target.id,
      this._target.belongId,
      this._relations,
      this._collName,
      {
        match,
        update,
      },
      copyId,
    );
    if (res.success) {
      return res.data?.MatchedCount > 0;
    }
    return false;
  }

  async delete(data: T, copyId?: string): Promise<boolean> {
    const res = await kernel.collectionUpdate(
      this._target.id,
      this._target.belongId,
      this._relations,
      this._collName,
      {
        match: { id: data.id },
        update: {
          _set_: {
            isDeleted: true,
          },
        },
      },
      copyId,
    );
    if (res.success) {
      return res.data?.MatchedCount > 0;
    }
    return false;
  }

  async deleteMany(data: T[], copyId?: string): Promise<boolean> {
    if (data.length < 1) return true;
    const res = await kernel.collectionUpdate(
      this._target.id,
      this._target.belongId,
      this._relations,
      this._collName,
      {
        match: {
          id: {
            _in_: data.map((i) => i.id),
          },
        },
        update: {
          _set_: {
            isDeleted: true,
          },
        },
      },
      copyId,
    );
    if (res.success) {
      return res.data?.MatchedCount > 0;
    }
    return false;
  }

  async deleteMatch(match: any, copyId?: string): Promise<boolean> {
    const res = await kernel.collectionUpdate(
      this._target.id,
      this._target.belongId,
      this._relations,
      this._collName,
      {
        match: match,
        update: {
          _set_: {
            isDeleted: true,
          },
        },
      },
      copyId,
    );
    if (res.success) {
      return res.data?.MatchedCount > 0;
    }
    return false;
  }

  async remove(data: T, copyId?: string): Promise<boolean> {
    const res = await kernel.collectionRemove(
      this._target.id,
      this._target.belongId,
      this._relations,
      this._collName,
      {
        id: data.id,
      },
      copyId,
    );
    if (res.success) {
      return res.data > 0;
    }
    return false;
  }

  async removeMany(data: T[], copyId?: string): Promise<boolean> {
    const res = await kernel.collectionRemove(
      this._target.id,
      this._target.belongId,
      this._relations,
      this._collName,
      {
        id: {
          _in_: data.map((i) => i.id),
        },
      },
      copyId,
    );
    if (res.success) {
      return res.data > 0;
    }
    return false;
  }

  async removeMatch(match: any, copyId?: string): Promise<boolean> {
    const res = await kernel.collectionRemove(
      this._target.id,
      this._target.belongId,
      this._relations,
      this._collName,
      match,
      copyId,
    );
    if (res.success) {
      return res.data > 0;
    }
    return false;
  }

  removeCache(predicate: (value: T) => boolean): void {
    this._cache = this._cache.filter((a) => predicate(a));
  }

  async notity(
    data: any,
    ignoreSelf?: boolean,
    targetId?: string,
    onlyTarget?: boolean,
    onlineOnly: boolean = true,
    targetType?: string,
  ): Promise<boolean> {
    const res = await kernel.dataNotify({
      data: data,
      flag: this.collName,
      onlineOnly: onlineOnly,
      belongId: this._target.belongId,
      relations: this._relations,
      onlyTarget: onlyTarget === true,
      ignoreSelf: ignoreSelf === true,
      targetId: targetId ?? this._target.id,
      targetType: targetType ?? 'target',
    });
    return res.success;
  }

  subscribe(keys: string[], callback: (data: any) => void, id?: string): void {
    kernel.subscribe(this.subMethodName(id), [...this._keys, ...keys], (data) => {
      callback.apply(this, [data]);
    });
  }

  unsubscribe(key: string): void {
    kernel.unSubscribe(key);
  }
}

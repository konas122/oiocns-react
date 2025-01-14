import { AcquireExecutor } from '@/ts/base/model';
import { Executor } from '.';
import { IWork } from '..';
import { IForm, ITarget, XCollection } from '../..';
import { kernel, model, schema } from '../../../base';
import orgCtrl from '../../../controller';
import { IBelong } from '../../target/base/belong';
import { Directory } from '../../thing/directory';
import { Form } from '../../thing/standard/form';

const innerDefined = [
  {
    name: '资产',
    items: [
      {
        id: '_system-things',
        typeName: '资产',
        name: '资产',
        code: '_system-things',
        enable: true,
      },
      {
        id: '_system-things-changed',
        typeName: '资产',
        name: '资产的变更明细',
        code: '_system-things-changed',
        enable: true,
      },
      {
        id: '_system-things-snapshot',
        typeName: '资产',
        code: '_system-things-snapshot',
        name: '资产的快照（单个）',
        enable: true,
      },
      {
        id: '_system-things_{period}',
        typeName: '资产',
        code: '_system-things_{period}',
        name: '资产的月快照（批量）',
        enable: true,
      },
    ],
  },
  {
    name: '财务',
    items: [
      {
        id: 'depreciation-config',
        typeName: '财务',
        code: 'depreciation-config',
        name: '折旧配置模板',
        enable: true,
      },
      {
        id: 'financial-closing-options',
        typeName: '财务',
        name: '财务结账科目项模板',
        code: 'financial-closing-options',
        enable: true,
      },
      {
        id: 'financial-closings',
        typeName: '财务',
        name: '财务结账科目项',
        code: 'financial-closings',
        enable: true,
      },
      {
        id: 'financial-period',
        typeName: '财务',
        code: 'financial-period',
        name: '财务账期',
        enable: true,
      },
      {
        id: 'financial-query',
        typeName: '财务',
        code: 'financial-query',
        name: '财务总账查询方案',
        enable: true,
      },
    ],
  },
  {
    name: '办事',
    items: [
      {
        id: 'work-instance',
        typeName: '办事',
        code: 'work-instance',
        name: '流程实例数据',
        enable: true,
      },
      {
        id: 'work-history-flow',
        typeName: '办事',
        code: 'work-history-flow',
        name: '历史流程数据',
        enable: true,
      },
    ],
  },
  {
    name: '附件',
    items: [
      {
        id: 'files',
        code: 'files',
        name: '附件',
        typeName: '附件',
        enable: true,
      },
    ],
  },
];

interface SubParams {
  operate: string;
  data: schema.XOperationLog<Params>;
}

/**
 * 数据申领
 */
export class Acquire extends Executor<AcquireExecutor> {
  public target: IBelong | undefined;
  public source: ITarget | undefined;
  public work: IWork | undefined;
  private loaded: boolean = false;
  take: number = 500;
  acquires: Acquiring[] = [];
  operationColl: XCollection<schema.XOperationLog<Params>> | undefined;
  acquireColl: XCollection<model.Acquiring> | undefined;
  periodColl: XCollection<schema.XPeriod> | undefined;
  /*
   * 执行器
   */
  async execute(): Promise<boolean> {
    for (const acquiring of await this.loadAcquires()) {
      await acquiring.restart();
    }
    return true;
  }
  /*
   * 带上用户操作的执行
   */
  async handlingExecute(handler?: Handler): Promise<boolean> {
    for (const acquiring of await this.loadAcquires()) {
      await acquiring.restart(handler);
    }
    return true;
  }
  /*
   * 根据类型迁移
   */
  async typingExecute(typeName: string): Promise<boolean> {
    const result = await this.loadAcquires();
    await Promise.all(
      result.filter((item) => item.typeName == typeName).map((item) => item.restart()),
    );
    return true;
  }
  /**
   * 获取办事
   * @returns 获取办事
   */
  async findWork(): Promise<IWork> {
    if (!this.work) {
      const work = await this.task.loadWork(
        this.task.taskdata.defineId,
        this.task.taskdata.defineShareId || this.task.taskdata.shareId,
      );
      if (work) {
        this.work = work;
      }
    }
    if (!this.work) {
      throw new Error('未获取到办事信息！');
    }
    return this.work;
  }
  async initialize(target: IBelong) {
    this.operationColl = target.resource.genColl('operation-log');
    this.acquireColl = target.resource.genColl('transfer-acquire');
    this.periodColl = target.resource.genColl('financial-period');
    this.operationColl.subscribe([this.metadata.id], (result: SubParams) => {
      switch (result.operate) {
        case 'update':
          for (const acquire of this.acquires) {
            if (acquire.metadata.id == result.data.instanceId) {
              acquire.operation = result.data;
              this.command.emitter('acquire', 'progress', acquire.metadata);
              break;
            }
          }
          break;
      }
    });
  }
  /**
   * 加载所有迁移项
   * @returns 迁移项
   */
  async loadAcquires(reload = false): Promise<Acquiring[]> {
    if (!this.loaded || reload) {
      this.loaded = true;
      this.acquires = [];
      const belongs = await this.loadBelongs();
      await this.initialize(belongs.target);
      const work = await this.findWork();
      const records = await this.acquireColl?.all(true);
      for (const acquire of records ?? []) {
        let operation = await this.loadOperation(acquire);
        if (!operation) {
          operation = await this.create(acquire);
        }
        if (operation) {
          this.acquires.push(
            new Acquiring(work, acquire, operation, belongs.source, belongs.target, this),
          );
        }
      }
    }
    return this.acquires;
  }
  /**
   * 生成所有迁移项
   */
  async genAcquires(): Promise<model.Acquiring[]> {
    const belongs = await this.loadBelongs();
    await this.initialize(belongs.target);
    const acquires = await this.combine();
    const records = (await this.acquireColl?.find(acquires.map((item) => item.id))) ?? [];
    const data: model.Acquiring[] = [];
    for (let item of acquires) {
      let record = records.find((record) => record.id == item.id);
      if (record) {
        item = { ...record, ...item };
      }
      record = await this.acquireColl?.replace({ ...item } as model.Acquiring);
      if (record) {
        data.push(record);
      }
    }
    return data;
  }
  /**
   * 组合迁移项
   */
  async combine() {
    const periods = await this.loadPeriods();
    const acquires = (this.metadata.acquires ?? []).filter((item) =>
      ['标准', '应用', '办事', '表单', '基础数据'].includes(item.typeName),
    );
    acquires.push(
      ...innerDefined.flatMap((item) => {
        const result = item.items.filter((i) => i.code != '_system-things_{period}');
        const months = item.items.filter((i) => i.code == '_system-things_{period}');
        if (months.length > 0) {
          const month = months[0];
          periods.sort((a, b) => a.period.localeCompare(b.period));
          if (periods.length > 0) {
            const smallest = this.target?.financial.getOffsetPeriod(
              periods[0].period,
              -1,
            );
            if (smallest) {
              result.push({
                id: '_system-things_' + smallest,
                typeName: '资产',
                code: '_system-things_' + smallest,
                name: '资产的月快照（批量）',
                enable: true,
              });
            }
          }
          for (const period of periods) {
            result.push({
              ...month,
              id: '_system-things_' + period.period,
              code: '_system-things_' + period.period,
            });
          }
        }
        return result;
      }),
    );
    return acquires;
  }
  /**
   * 加载数据源归属
   */
  async loadBelongs(): Promise<{ source: ITarget; target: IBelong }> {
    if (!this.target) {
      const belong = [orgCtrl.user, ...orgCtrl.user.companys];
      for (const item of belong) {
        if (item.id == this.task.taskdata.applyId) {
          this.target = item;
          if ((this.target.metadata.storeId?.length ?? 0) == 0) {
            throw new Error('单位未激活数据核');
          }
          break;
        }
      }
    }
    if (!this.target) {
      throw new Error('获取目标单位失败！');
    }
    this.source = this.target.targets.find(
      (item) => item.id == this.task.taskdata.shareId,
    );
    if (!this.source) {
      throw new Error('获取数据源单位失败!');
    }
    return { target: this.target, source: this.source };
  }
  /**
   * 加载账期
   */
  async loadPeriods(): Promise<schema.XPeriod[]> {
    const periodColl = this.source?.resource.genColl<schema.XPeriod>('financial-period');
    const result = await periodColl?.loadResult({
      options: { match: { belongId: this.task.taskdata.applyId } },
    });
    return result?.data ?? [];
  }
  /**
   * 加载操作
   * @param item 领用项
   * @returns
   */
  async loadOperation(item: model.Acquire) {
    const result = await this.operationColl?.loadResult({
      options: { match: { instanceId: item.id } },
    });
    if (result && result?.data?.length > 0) {
      return result.data[result.data.length - 1];
    }
  }
  /**
   * 更新日志信息
   * @param operation 新日志
   */
  async update(acquiring: Acquiring, operation: schema.XOperationLog<Params>) {
    acquiring.operation = operation;
    if (await this.operationColl?.replace(operation)) {
      await this.operationColl?.notity({ operate: 'update', data: operation }, true);
    }
    this.command.emitter('acquire', 'progress', acquiring.metadata);
  }
  /**
   * 创建操作
   * @param item 操作
   * @returns 操作日志
   */
  async create(item: model.Acquire): Promise<schema.XOperationLog<Params> | undefined> {
    const params = this.buildParams(item);
    if (!params) {
      return;
    }
    return await this.operationColl?.insert({
      instanceId: item.id,
      status: Status.Pause,
      progress: 0,
      typeName: 'Acquire',
      params,
    } as schema.XOperationLog<Params>);
  }
  private buildParams(item: model.Acquire): Params | undefined {
    switch (item.typeName) {
      case '标准':
        return { type: 'directorys' } as Params;
      case '应用':
        return { type: 'applications' } as Params;
      case '资产':
      case '办事':
        return {
          type: 'collection',
          coll: item.code,
          belong: true,
          skip: 0,
          take: this.take,
        };
      case '财务':
        switch (item.code) {
          case 'depreciation-config':
            return { type: 'depreciation' } as Params;
          case 'financial-query':
          case 'financial-closing-options':
            return {
              type: 'collection',
              coll: item.code,
              belong: false,
              skip: 0,
              take: this.take,
            };
          default:
            return {
              type: 'collection',
              coll: item.code,
              belong: true,
              skip: 0,
              take: this.take,
            };
        }
      case '表单':
      case '基础数据':
        if (item.collName) {
          return {
            type: 'collection',
            coll: item.collName,
            belong: item.typeName == '表单' ? true : false,
            skip: 0,
            take: this.take,
            form: item.id,
          };
        }
        break;
      case '附件':
        return {
          type: 'files',
          coll: 'files',
          belong: true,
          skip: 0,
          take: this.take,
          form: item.id,
        };
    }
  }
}

export enum Status {
  // 暂停
  Pause,
  // 运行
  Running,
  // 异常
  Error,
  // 完成
  Completed,
}

interface Params {
  // 迁移项类型
  type: string;
  // 迁移项数据所在集合
  coll: string;
  // 跳过的数据
  skip: number;
  // 获取到的数据
  take: number;
  // 是否获取归属
  belong: boolean;
  // 表单数据
  form?: string;
  // 所有数据
  total?: number;
  // 是否基础数据
  base?: boolean;
}

export type Handler = (
  item: Acquiring,
  data: schema.XThing[],
) => Promise<schema.XThing[]>;

export class Acquiring {
  constructor(
    work: IWork,
    metadata: model.Acquiring,
    operation: schema.XOperationLog<Params>,
    source: ITarget,
    target: IBelong,
    acquire: Acquire,
  ) {
    this.work = work;
    this.executor = acquire;
    this.metadata = metadata;
    this.operation = operation;
    this.source = source;
    this.target = target;
  }
  work: IWork;
  executor: Acquire;
  source: ITarget;
  target: IBelong;
  metadata: model.Acquiring;
  operation: schema.XOperationLog<Params>;
  operationLoaded = false;
  get key() {
    return this.metadata.id;
  }
  get typeName() {
    return this.metadata.typeName;
  }
  get code() {
    return this.metadata.code;
  }
  get name() {
    return this.metadata.name;
  }
  get status() {
    return this.operation.status;
  }
  get params() {
    return this.operation.params;
  }
  get progress() {
    const total = this.params.total ?? 0;
    if (total > 0) {
      return Number(((this.params.skip / total) * 100).toFixed(2));
    }
    return this.status == Status.Completed ? 100 : 0;
  }
  /**
   * 开始
   */
  async start(handler?: Handler) {
    if (this.operation.status != Status.Pause) {
      return;
    }
    await this.executor.update(this, { ...this.operation, status: Status.Running });
    try {
      if (!(await this.execute(handler))) {
        return;
      }
      await this.executor.update(this, { ...this.operation, status: Status.Completed });
    } catch (error) {
      await this.executor.update(this, {
        ...this.operation,
        status: Status.Error,
        error: (error as Error).message,
      });
    }
  }
  /**
   * 重新执行
   */
  async restart(handler?: Handler) {
    if (this.operation.status == Status.Running) {
      return;
    }
    await this.executor.update(this, {
      ...this.operation,
      status: Status.Pause,
      params: { ...this.operation.params, skip: 0, take: this.executor.take },
    });
    await this.start(handler);
  }
  /**
   * 暂停
   */
  async pause() {
    if (this.operation.status == Status.Running) {
      await this.executor.update(this, { ...this.operation, status: Status.Pause });
    }
  }
  /**
   * 执行
   */
  private async execute(handler?: Handler): Promise<boolean> {
    switch (this.params.type) {
      case 'directorys':
      case 'applications':
        await this.standard(this.params.type);
        break;
      case 'depreciation':
        await this.depreciation();
        break;
      case 'collection':
        await this.collection(handler);
        if (this.params.coll == 'financial-period') {
          await this.initialize();
        }
        break;
      case 'files':
        await this.files();
        break;
    }
    return true;
  }
  /**
   * 按集合迁移
   */
  async collection(handler?: Handler): Promise<boolean> {
    await this.getTotalCount();
    return await this.transfer(handler);
  }
  /**
   * 加载表单
   */
  async loadForm(): Promise<IForm | undefined> {
    if (this.operation.params.form) {
      const formColl = this.source.resource.genColl<schema.XForm>('standard-form');
      const result = await formColl.loadResult({
        options: { match: { id: this.operation.params.form } },
      });
      if (result.data.length > 0) {
        return new Form(result.data[0], this.source.directory);
      }
    }
  }
  /**
   * 迁移数据
   * @param work 办事
   * @param onProgress 进度回调
   */
  private async transfer(handler?: Handler): Promise<boolean> {
    let done = false;
    while (!done) {
      const things = await this.loadData(this.params);
      if (this.operation.status == Status.Pause) {
        return false;
      }
      let data = things.data;
      if (data.length == 0) {
        done = true;
        break;
      }
      if (handler && things.data.length > 1) {
        data = await handler?.(this, things.data);
      }
      await kernel.collectionReplace(
        this.target.id,
        this.target.id,
        [this.target.id],
        this.params.coll,
        data,
      );
      this.params.skip += things.data.length;
      await this.executor.update(this, this.operation);
    }
    return true;
  }
  /**
   * 获取总进度
   * @param work 办事
   * @returns 总进度
   */
  private async getTotalCount(): Promise<void> {
    const things = await this.loadData(this.params, true);
    this.params.total = things.totalCount ?? 0;
    await this.executor.update(this, this.operation);
  }
  /**
   * 迁移标准
   */
  private async standard(key: 'directorys' | 'applications') {
    const work = await this.executor.findWork();
    const group = work.directory.target;
    await group.directory.loadContent(true);
    for (const file of group.directory.standard[key]) {
      if (this.metadata.id == file.id) {
        await file.loadContent(true);
        await file.copy(this.target.directory);
        await this.target.space.manager.upsert({
          id: file.id,
          name: file.name,
          typeName: file.typeName,
          target: file.directory.target.metadata,
          relations: file.directory.target.relations,
        } as schema.XSubscription);
        break;
      }
    }
  }
  /**
   * 加载物
   * @param take 拿几个
   * @param skip 跳过几个
   * @param form 表单
   * @param work 办事
   * @returns 物信息
   */
  private async loadData(params: Params, isCountQuery = false) {
    let filter: any[] = [];
    let userData: any[] = [];
    let match: any = {};
    if (params.belong) {
      filter = ['belongId', '=', this.target.id];
    }
    const form = await this.loadForm();
    if (form) {
      filter = form.combineFilter(filter, form.parseFilter());
      match = form.parseClassify();
    }
    if (params.base) {
      userData.push(params.form);
    }
    if (params.coll == 'work-instance') {
      params.take = 1;
    }
    const loadOptions = {
      take: params.take,
      skip: params.skip,
      userData: userData,
      filter: filter,
      isCountQuery,
      options: { match },
    };
    const coll = this.work.directory.target.resource.genColl<schema.XThing>(params.coll);
    return coll.loadResult(loadOptions);
  }
  /**
   * 加载源对象
   * @param code 代码
   * @returns 对象
   */
  async loadSourceObject<T extends schema.Xbase>(collName: string, id: string) {
    const configColl = this.source.resource.genColl<T>(collName);
    const options = { options: { match: { id } } };
    return await configColl.loadResult(options);
  }
  /**
   * 初始化账期
   */
  async initialize() {
    if (this.target.financial.initialized || this.target.financial.current) {
      return;
    }
    const periods = await this.executor.loadPeriods();
    const data = periods.sort((a, b) => a.period.localeCompare(b.period));
    if (data.length > 0) {
      const first = data[0];
      const init = this.target.financial.getOffsetPeriod(first.period, -1);
      await this.target.financial.setInitialize(init);
      await this.target.financial.setCurrent(data[data.length - 1].period);
    }
  }
  /**
   * 迁移对象
   */
  async depreciation() {
    const config = await this.loadSourceObject<schema.XConfiguration>(
      '_system-objects',
      'depreciation-config',
    );
    if (config.success && config.data && config.data.length > 0) {
      await this.target.financial.configuration.setMetadata(config.data[0]);
    }
    const financial = await this.loadSourceObject<schema.XFinancial>(
      '_system-objects',
      'target-financial',
    );
    if (financial.success && financial.data && financial.data.length > 0) {
      let item = financial.data[0];
      if (item.query) {
        const query = await this.loadSourceObject<schema.XQuery>(
          'financial-query',
          item.query,
        );
        if (query.success && query.data && query.data.length > 0) {
          await this.target.financial.setQuery(query.data[0]);
        }
      }
      if (item.form) {
        const forms = await this.loadSourceObject<schema.XForm>(
          'standard-form',
          item.form,
        );
        if (forms.success && forms.data && forms.data.length > 0) {
          await this.target.financial.setForm(forms.data[0]);
        }
      }
      if (item.balance) {
        const forms = await this.loadSourceObject<schema.XForm>(
          'standard-form',
          item.balance,
        );
        if (forms.success && forms.data && forms.data.length > 0) {
          await this.target.financial.setBalance(forms.data[0]);
        }
      }
    }
  }
  /**
   * 迁移文件
   */
  async files(): Promise<void> {
    const files = await this.source.resource.historyFileColl.loadSpace({
      options: { match: { belongId: this.target.id } },
    });
    await this.target.resource.historyFileColl.replaceMany(files);
    this.params.total = files.length;
    await this.executor.update(this, this.operation);
    const children = await this.target.directory.standard.loadDirectorys();
    let fileDir = children.find((item) => item.name.includes('数据附件'));
    if (!fileDir) {
      const files = await this.target.directory.create({
        name: '数据附件',
        code: 'dataFile',
        typeName: '目录',
        directoryId: this.target.id,
      } as schema.XDirectory);
      if (files) {
        fileDir = new Directory(files, this.target, this.target.directory);
      }
    }
    if (!fileDir) {
      return;
    }
    const names = (await fileDir.loadFiles()).map((item) => item.code.split('/')[1]);
    for (const item of files) {
      const exists = names.some((name) => item.name == name);
      if (!exists && item.shareLink) {
        const response = await fetch(item.shareLink);
        if (response.ok) {
          const blob = await response.blob();
          await fileDir.createFile(
            item.name,
            new File([blob], item.name, { type: blob.type }),
          );
        }
      }
      this.params.skip += 1;
      await this.executor.update(this, this.operation);
    }
  }
}

import { common, kernel, model, schema } from '../../base';
import { XCollection } from '../public/collection';
import { TaskStatus } from '../public/enums';
import { DataProvider } from '../provider';
import { IReception } from './assign/reception';
import { IWorkDarft, WorkDarft } from './draft';
import { IWorkTask, TaskTypeName, WorkTask } from './task';
import { sleep } from '@/ts/base/common';

/** 任务集合名 */
const TaskCollName = 'work-task';
export interface IWorkProvider {
  /** 用户ID */
  userId: string;
  /** 当前用户 */
  user: DataProvider;
  /** 待办 */
  todos: IWorkTask[];
  /** 变更通知 */
  notity: common.Emitter;
  /** 办事草稿 */
  draftsWorks: IWorkDarft[];
  /** 任务更新 */
  updateTask(task: schema.XWorkTask): void;
  /** 加载实例详情 */
  loadInstanceDetail(
    id: string,
    targetId: string,
    belongId: string,
  ): Promise<schema.XWorkInstance | undefined>;
  /** 加载待办 */
  loadTodos(reload?: boolean): Promise<IWorkTask[]>;
  /** 加载任务数量 */
  loadTaskCount(typeName: TaskTypeName): Promise<number>;
  /** 加载任务事项 */
  loadContent(
    typeName: TaskTypeName,
    filter?: string,
    skip?: number,
    reload?: boolean,
  ): Promise<IWorkTask[]>;
  /** 加载任务记录 */
  loadTasks(options: any): Promise<model.LoadResult<schema.XWorkTask[]>>;
  /** 加载办事草稿 */
  loadDraft(reload?: boolean): Promise<IWorkDarft[]>;
  /** 自动审核变更 */
  tiggleAutoApproval(
    auto: boolean,
    tasks: IWorkTask[],
    message: (msg: string) => void,
  ): void;
}

export class WorkProvider implements IWorkProvider {
  constructor(_user: DataProvider) {
    this.user = _user;
    this.userId = _user.user!.id;
    this.notity = new common.Emitter();
    kernel.on('RecvTask', (data: schema.XWorkTask) => {
      if (this._todoLoaded && data.approveType != '抄送') {
        this.updateTask(data);
      }
    });
    this.autoApprovalThread();
  }
  userId: string;
  user: DataProvider;
  notity: common.Emitter;
  todos: IWorkTask[] = [];
  draftsWorks: IWorkDarft[] = [];
  tasks: IReception[] = [];
  autoTasks: IWorkTask[] = [];
  autoApproval: boolean = false;
  message?: (msg: string) => void;
  receptionColl: Dictionary<XCollection<schema.XReception>> = {};
  private _todoLoaded: boolean = false;
  private _draftsLoaded: boolean = false;

  tiggleAutoApproval(
    auto: boolean,
    tasks: IWorkTask[],
    message: (msg: string) => void,
  ): void {
    this.autoApproval = auto;
    this.autoTasks = this.autoApproval ? tasks : [];
    if (!Array.isArray(this.autoTasks)) {
      this.autoTasks = [];
    }
    this.autoTasks = this.autoTasks.reverse();
    this.message = message;
  }

  async autoApprovalThread(): Promise<void> {
    while (true) {
      if (this.autoApproval && this.autoTasks.length > 0) {
        const start = Math.floor(Math.random() * this.autoTasks.length);
        const items = this.autoTasks.slice(start, start + 5);
        const threads = items.map(async (item) => {
          const executors = await item.loadExecutors();
          const executor = executors.find(
            (item) =>
              item.metadata.funcName == '字段变更' ||
              item.metadata.funcName == '任务状态变更' ||
              item.metadata.funcName === '商城订单同步',
          );
          if (!executor || executor.metadata.funcName === '任务状态变更') {
            if (executor && item.instanceData?.reception) {
              const formData = new Map<string, model.FormEditData>();
              await executor.execute(formData);
            }
            await item.approvalTask(TaskStatus.ApprovalStart, '自动通过');
            this.message?.apply(this, [item.name + '自动审核成功']);
          }
        });
        await Promise.all(threads);
      }
      await sleep(1000);
    }
  }

  updateTask(task: schema.XWorkTask): void {
    const index = this.todos.findIndex((i) => i.metadata.id === task.id);
    if (index > -1) {
      if (
        task.status < TaskStatus.ApprovalStart &&
        (task.approveType != '子流程' ||
          task.records == undefined ||
          task.records?.findIndex((a) => !a.isPast || a.isPast == undefined) < 0)
      ) {
        this.todos[index].updated(task);
      } else {
        this.todos.splice(index, 1);
      }
      this.notity.changCallback('待办');
    } else {
      if (task.status < TaskStatus.ApprovalStart) {
        this.todos.unshift(new WorkTask(task, this.user));
        this.notity.changCallback('待办');
      }
    }
  }
  async loadContent(
    typeName: TaskTypeName,
    filter?: string,
    skip: number = 0,
    reload: boolean = false,
  ): Promise<IWorkTask[]> {
    if (typeName === '待办') {
      return await this.loadTodos(reload);
    }
    const tasks: IWorkTask[] = [];
    const match = this._typeMatch(typeName);
    if (filter && filter.length > 0) {
      match._or_ = [
        {
          title: {
            _regex_: filter,
            _options_: 'i',
          },
        },
        {
          content: {
            _regex_: filter,
            _options_: 'i',
          },
        },
      ];
    }
    const result = await this.loadTasks({
      options: {
        match: match,
        sort: {
          createTime: -1,
        },
      },
      skip: skip,
      take: 30,
    });
    if (result.success && result.data && result.data.length > 0) {
      result.data.forEach((item) => {
        if (tasks.every((i) => i.id != item.id)) {
          tasks.push(new WorkTask(item, this.user, true));
        }
      });
    }
    return tasks.filter((i) => i.isTaskType(typeName));
  }
  async loadTodos(reload: boolean = false): Promise<IWorkTask[]> {
    if (!this._todoLoaded || reload) {
      let res = await kernel.queryApproveTask({ id: '0' });
      if (res.success) {
        this._todoLoaded = true;
        this.todos = (res.data.result || []).map((task) => new WorkTask(task, this.user));
      }
    }
    return this.todos;
  }
  async loadTasks(options: any): Promise<model.LoadResult<schema.XWorkTask[]>> {
    return await kernel.collectionLoad<schema.XWorkTask[]>(
      this.userId,
      this.userId,
      [],
      TaskCollName,
      options,
    );
  }
  async loadTaskCount(typeName: TaskTypeName): Promise<number> {
    const res = await kernel.collectionLoad(this.userId, this.userId, [], TaskCollName, {
      options: {
        match: this._typeMatch(typeName),
      },
      isCountQuery: true,
    });
    if (res.success) {
      return res.totalCount;
    }
    return 0;
  }
  async loadInstanceDetail(
    id: string,
    targetId: string,
    belongId: string,
  ): Promise<schema.XWorkInstance | undefined> {
    const instance = await kernel.findInstance(targetId, belongId, id);
    if (instance) {
      instance.tasks = await kernel.LoadInstanceTask(targetId, belongId, id);
    }
    return instance;
  }
  async loadDraft(reload: boolean = false) {
    if (!this._draftsLoaded || reload) {
      const result = await this.user.user!.workStagging.loadResult({
        ...this._typeMatch('草稿'),
      });
      if (result.success) {
        this._draftsLoaded = true;
        this.draftsWorks = (result.data || []).map(
          (task: any) => new WorkDarft(task, this.user, this.notity),
        );
      }
    }
    return this.draftsWorks;
  }

  private _typeMatch(typeName: TaskTypeName): any {
    switch (typeName) {
      case '已办':
        return {
          status: {
            _gte_: 100,
          },
          records: {
            _exists_: true,
          },
        };
      case '已发起':
        return {
          createUser: this.userId,
          status: {
            _lt_: 100,
          },
          nodeId: {
            _exists_: false,
          },
        };
      case '已完结':
        return {
          createUser: this.userId,
          status: {
            _gte_: 100,
          },
          nodeId: {
            _exists_: false,
          },
        };
      case '抄送':
        return {
          approveType: '抄送',
        };
      case '草稿':
        return {
          userData: [],
          options: {
            match: {},
            sort: {
              createTime: -1,
            },
            project: {
              data: 0,
            },
          },
          skip: 0,
          take: 30,
        };
      default:
        return {
          status: {
            _lt_: 100,
          },
        };
    }
  }
}

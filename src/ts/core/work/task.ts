import { logger } from '@/ts/base/common';
import { IWork, Work } from '.';
import { schema, model, kernel } from '../../base';
import { TaskStatus, entityOperates } from '../public';
import { IBelong } from '../target/base/belong';
import { DataProvider } from '../provider';
import { IWorkApply } from './apply';
import { FileInfo, IFile } from '../thing/fileinfo';
import { Acquire } from './executor/acquire';
import { IExecutor } from './executor';
import { FieldsChange } from './executor/change';
import { Webhook } from './executor/webhook';
import { CopyForm } from './executor/copyForm';
import { MallOrderSync } from './executor/mallOrderSync';
import message from '@/utils/message';
import { AcquireExecutor, WorkNodeModel } from '@/ts/base/model';
import { ReceptionChange } from './executor/reception';
import { getPlatFormName } from '@/utils/tools';
import { IApplication } from '../thing/standard/application';
import { getNodeByNodeId } from '@/utils/work';
import { PageAll } from '@/ts/core/public/consts';
export type TaskTypeName = '待办' | '已办' | '抄送' | '已发起' | '已完结' | '草稿';

export interface IPressedParams {
  // 实例id
  instanceId?: string
  // 催办人员id
  targetIds?: string[]
  // 催办短信内容
  message?: string
}

export interface IWorkTask extends IFile {
  /** 审核意见 */
  approvalRemark: string;
  /** 内容 */
  comment: string;
  /** 当前用户 */
  user: DataProvider;
  /** 归属空间 */
  belong: IBelong;
  /** 任务元数据 */
  taskdata: schema.XWorkTask;
  /** 该任务对应办事的节点信息 */
  node: WorkNodeModel | undefined;
  /** 流程实例 */
  instance: schema.XWorkInstance | undefined;
  /** 实例携带的数据 */
  instanceData: model.InstanceDataModel | undefined;
  /** 加用户任务信息 */
  targets: schema.XTarget[];
  /** 是否为历史对象 */
  isHistory: boolean;
  /** 是否为指定的任务类型 */
  isTaskType(type: TaskTypeName): boolean;
  /** 是否满足条件 */
  isMatch(filter: string): boolean;
  /** 任务更新 */
  updated(_metadata: schema.XWorkTask): Promise<boolean>;
  /** 加载流程实例数据 */
  loadInstance(reload?: boolean): Promise<boolean>;
  /** 加载流程节点 */
  loadWorkNode(reload?: boolean): Promise<model.WorkNodeModel | undefined>;
  /** 撤回任务 */
  recallApply(): Promise<boolean>;
  /** 创建申请(子流程) */
  createApply(): Promise<IWorkApply | undefined>;
  /** 任务审核 */
  approvalTask(
    status: number,
    comment?: string,
    fromData?: Map<string, model.FormEditData>,
    gatewayInfo?: Map<string, string[]>,
    backId?: string,
    isSkip?: boolean,
  ): Promise<boolean>;
  /** 加载办事 */
  loadWork(wrokId: string, shareId: string): Promise<IWork | undefined>;
  /** 加载执行器 */
  loadExecutors(): Promise<IExecutor[]>;
  /** 获取该任务下一步节点 */
  loadNextNodes(): Promise<model.ResultType<model.PageResult<schema.XWorkNode>>>;
  /** 根据审核查询关联的流程实例 */
  loadAllNodes(id: string, shareId?: string): Promise<model.RelationInstanceModel>;
  /** 发送任务审核催办 */
  sendTaskInfo(pressedParams?: IPressedParams): Promise<model.ResultType<model.RelationInstanceModel>>;
  /** 递归存储流程数据 */
  loadTasksData(): Promise<model.AllTask[]>;
  /** 按照时间线排序展示 */
  getSortedRecords(tasks: model.AllTask[]): model.WorkRecordView[];
  /** 通过身份id查询成员 */
  loadMembers(identityId: string): Promise<schema.XTarget[]>
}

export class WorkTask extends FileInfo<schema.XEntity> implements IWorkTask {
  private history: boolean;
  constructor(
    _metadata: schema.XWorkTask,
    _user: DataProvider,
    history: boolean = false,
  ) {
    super(_metadata as any, _user.user!.directory);
    this.taskdata = _metadata;
    this.user = _user;
    this.history = history;
  }
  user: DataProvider;
  cacheFlag: string = 'worktask';
  approvalRemark: string = '';
  node: model.WorkNodeModel | undefined;
  taskdata: schema.XWorkTask;
  instance: schema.XWorkInstance | undefined;
  instanceData: model.InstanceDataModel | undefined;
  get isHistory(): boolean {
    return this.history;
  }
  get groupTags(): string[] {
    const approveType =
      this.taskdata.approveType !== '审批' ? this.taskdata.approveType : '';
    return [this.belong.name, this.taskdata.taskType, approveType];
  }
  get metadata(): schema.XEntity {
    let typeName = this.taskdata.taskType;
    if (
      ['子流程', '网关', '起始'].includes(this.taskdata.approveType) &&
      this.taskdata.identityId &&
      this.taskdata.identityId.length > 5
    ) {
      typeName = '子流程';
    }
    if (this.taskdata.approveType == '起始') {
      typeName = '起始';
    }
    if (this.targets.length === 2) {
      typeName = '加' + this.targets[1].typeName;
    }
    return {
      ...this.taskdata,
      icon: '',
      typeName,
      belong: undefined,
      name: this.taskdata.title,
      code: this.taskdata.instanceId,
      remark: this.comment || '暂无信息',
    };
  }
  delete(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  operates(): model.OperateModel[] {
    if (
      this.taskdata.status < TaskStatus.ApprovalStart &&
      this.taskdata.createUser == this.userId
    ) {
      return [
        entityOperates.Open,
        entityOperates.Remark,
        entityOperates.QrCode,
        entityOperates.WithDrawWorkTask,
        entityOperates.CorrectWorkTask,
      ];
    } else {
      return [entityOperates.Open, entityOperates.Remark, entityOperates.QrCode];
    }
  }
  get comment(): string {
    if (this.targets.length === 2) {
      return `${this.targets[0].name}[${this.targets[0].typeName}]申请加入${this.targets[1].name}[${this.targets[1].typeName}]`;
    }
    return this.taskdata.content;
  }
  get belong(): IBelong {
    for (const company of this.user.user!.companys) {
      if (company.id === this.taskdata.belongId) {
        return company;
      }
    }
    return this.user.user!;
  }
  get targets(): schema.XTarget[] {
    if (this.taskdata.taskType == '加用户') {
      try {
        return JSON.parse(this.taskdata.content) || [];
      } catch (ex) {
        logger.error(ex as Error);
      }
    }
    return [];
  }
  isMatch(filter: string): boolean {
    return JSON.stringify(this.taskdata).includes(filter);
  }
  isTaskType(type: TaskTypeName): boolean {
    switch (type) {
      case '已办':
        return (
          this.taskdata.status >= TaskStatus.ApprovalStart &&
          this.taskdata.createUser !== this.userId
        );
      case '已发起':
      case '已完结':
        return this.taskdata.createUser == this.userId;
      case '待办':
        return this.taskdata.status < TaskStatus.ApprovalStart;
      case '抄送':
        return this.taskdata.approveType === '抄送';
      case '草稿':
        return false;
    }
  }
  async updated(_metadata: schema.XWorkTask): Promise<boolean> {
    if (this.taskdata.id === _metadata.id) {
      this.taskdata = _metadata;
      await this.loadInstance(true);
      return true;
    }
    return false;
  }
  async loadInstance(reload: boolean = false, isHistory = false): Promise<boolean> {
    if (this.instanceData !== undefined && !reload) return true;
    if (this.taskdata.taskType === '加用户') return false;
    const data = await kernel.findInstance(
      this.taskdata.shareId,
      this.taskdata.belongId,
      isHistory ? this.taskdata.id : this.taskdata.instanceId,
    );
    if (data) {
      try {
        this.instance = data;
        this.instance.tasks = await kernel.LoadInstanceTask(
          this.taskdata.shareId,
          this.taskdata.belongId,
          isHistory ? this.taskdata.id : this.taskdata.instanceId,
        );
        this.instanceData = eval(`(${data.data})`);
        return this.instanceData !== undefined;
      } catch (ex) {
        logger.error(ex as Error);
      }
    }
    return false;
  }

  async loadWorkNode(reload: boolean = false): Promise<model.WorkNodeModel | undefined> {
    if (reload || this.node == undefined) {
      if ((await this.loadInstance()) && this.instance) {
        var result = await kernel.queryWorkNodes({
          id: this.instance.defineId,
          shareId: this.instance.defineShareId,
        });
        if (result.success) {
          this.node = result.data;
        }
      }
    }
    return this.node;
  }

  async loadExecutors(): Promise<IExecutor<model.Executor>[]> {
    let executors: IExecutor[] = [];
    if (await this.loadInstance()) {
      const node = this.searchNodeById(this.taskdata.nodeId, this.instanceData?.node);
      if (node && node.executors) {
        for (const item of node.executors) {
          switch (item.funcName) {
            case '资产领用':
            case '数据申领':
              executors.push(new Acquire(item as AcquireExecutor, this));
              break;
            case '字段变更':
              executors.push(new FieldsChange(item, this));
              break;
            case 'Webhook':
              executors.push(new Webhook(item, this));
              break;
            case '任务状态变更':
              executors.push(
                new ReceptionChange(
                  item,
                  this,
                  this.instance!.belongId == this.instance!.applyId,
                ),
              );
              break;
            case '复制表到子表':
              executors.push(new CopyForm(item, this));
              break;
            case '商城订单同步':
              executors.push(new MallOrderSync(item, this));
              break;
            default:
              break;
          }
        }
      }
    }
    return executors;
  }

  async recallApply(): Promise<boolean> {
    if ((await this.loadInstance()) && this.instance) {
      if (this.instance.createUser === this.belong.userId) {
        var recallId =
          '起始' == this.taskdata.approveType ? this.taskdata.id : this.instance.id;
        let res = await kernel.recallWorkInstance({ id: recallId });
        if (res.success) {
          return true;
        }
      }
    }
    return false;
  }

  async createApply(): Promise<IWorkApply | undefined> {
    var work = await this.loadWork(this.taskdata.defineId, this.taskdata.defineShareId);
    if (work) {
      return await work.createApply(this.id, this.instanceData, '0');
    }
  }
  async loadWork(id: string, shareId: string): Promise<IWork | undefined> {
    await this.loadInstance();
    switch (this.metadata.typeName) {
      case '子流程':
        return await this.findWorkByPrimaryId(id, shareId);
      case '起始':
        return await this.findWorkById(id, shareId);
      case '事项':
        return await this.findWorkById(id, shareId);
    }
  }

  async findWorkByPrimaryId(id: string, shareId: string): Promise<IWork | undefined> {
    var target = this.user.targets.find((i) => i.id === shareId);
    if (target) {
      var res = await target.resource.workDefineColl.loadResult({
        options: {
          project: {
            resource: 0,
          },
          match: {
            primaryId: id,
            isDeleted: false,
            applicationId: {
              _gt_: '0',
            },
          },
        },
      });
      if (res.success && res.data && res.data.length > 0) {
        for (var app of await target.directory.loadAllApplication()) {
          const work = await app.findWork(res.data[0].id, res.data[0].applicationId);
          if (work) {
            return work;
          }
        }
      }
      message.warn('未找到该关联办事!');
    } else {
      message.warn('未找到办事对应组织!');
    }
  }
  async findWorkById(id: string, shareId: string): Promise<IWork | undefined> {
    var target = this.user.targets.find((i) => i.id === shareId);
    if (target) {
      var res = await target.resource.workDefineColl.loadResult({
        options: {
          project: {
            resource: 0,
          },
          match: {
            id: id,
            isDeleted: false,
          },
        },
      });
      if (res.success && res.data && res.data.length > 0) {
        if (res.data[0].applicationId.length > 10) {
          for (var app of await target.directory.loadAllApplication()) {
            const work = await app.findWork(res.data[0].id, res.data[0].applicationId);
            if (work) {
              return work;
            }
          }
        } else {
          return new Work(res.data[0], { directory: target.directory } as IApplication);
        }
      }
      message.warn('未找到该关联办事!');
    } else {
      message.warn('未找到办事对应组织!');
    }
  }

  async approvalTask(
    status: number,
    comment: string,
    fromData: Map<string, model.FormEditData>,
    gateways?: Map<string, string[]>,
    backId?: string,
    isSkip?: boolean,
  ): Promise<boolean> {
    if (comment) {
      this.approvalRemark = comment;
    }
    if (this.taskdata.status < TaskStatus.ApprovalStart) {
      if (status === -1) {
        return await this.recallApply();
      }
      if (this.taskdata.taskType === '加用户') {
        return this.approvalJoinTask(status, this.approvalRemark);
      } else {
        fromData?.forEach((data, k) => {
          if (this.instanceData) {
            if (this.instanceData.data[k]) {
              this.instanceData.data[k].push(
                ...this.instanceData.data[k].filter((s) => s.nodeId != data.nodeId),
                data,
              );
            }
            this.instanceData.data[k] = [data];
          }
        });
        var gatewayInfos: model.WorkGatewayInfoModel[] = [];
        gateways?.forEach((v, k) => {
          gatewayInfos.push({
            nodeId: k,
            targetIds: v,
          });
        });
        const res = await kernel.approvalTask({
          backId,
          isSkip,
          id: this.taskdata.id,
          status: status,
          comment: this.approvalRemark,
          data: JSON.stringify(this.instanceData),
          gateways: JSON.stringify(gatewayInfos),
        });
        return res.data === true;
      }
    }
    return false;
  }

  async loadNextNodes(): Promise<model.ResultType<model.PageResult<schema.XWorkNode>>> {
    return await kernel.queryNextNodes({ id: this._metadata.id });
  }

  // 申请加用户审核
  private async approvalJoinTask(status: number, comment: string): Promise<boolean> {
    if (this.targets && this.targets.length === 2) {
      if (status < TaskStatus.RefuseStart) {
        const target = this.user.targets.find((a) => a.id == this.targets[1].id);
        if (target) {
          target.pullMembers([this.targets[0]]);
        } else {
          message.warn('组织加载中，请等待加载完成后再进行该任务审核');
          return false;
        }
      }
      const res = await kernel.approvalTask({
        id: this.taskdata.id,
        status: status,
        comment: comment,
        data: JSON.stringify(this.instanceData),
        gateways: '',
      });
      return res.success;
    }
    return false;
  }

  // 遍历流程节点，查找特定节点
  private searchNodeById(
    nodeId: string,
    node: model.WorkNodeModel | undefined,
  ): model.WorkNodeModel | undefined {
    if (node) {
      if (nodeId === node.id) return node;
      const find = this.searchNodeById(nodeId, node.children);
      if (find) return find;
      for (const subNode of node?.branches ?? []) {
        const find = this.searchNodeById(nodeId, subNode.children);
        if (find) return find;
      }
    }
  }
  //根据审核查询关联的流程实例（子流程任务查看子流程或根据起始节点查询主流程）
  async loadAllNodes(
    id: string,
    shareId: string = this.taskdata.shareId,
  ): Promise<model.RelationInstanceModel> {
    const res = await kernel.queryRelationInstance({
      id,
      shareId,
    });
    return res.data;
  }
  // 发送催办短信信息
  async sendTaskInfo(pressedParams?: IPressedParams): Promise<model.ResultType<model.RelationInstanceModel>> {
    const instanceId = pressedParams?.instanceId || this.instance?.id || ''
    const targetIds = pressedParams?.targetIds || [];
    const message = pressedParams?.message || '';
    const platName = getPlatFormName();
    return await kernel.urgeApproval({ platName, instanceId, targetIds, message });
  }

  // 判断是否有子流程
  private isExtraNode(tasks: model.AllTask[]): boolean {
    return !!tasks.find((task) => task.approveType === '子流程');
  }

  // 向上查找主流程
  async findMainProcess(
    _tasks: model.AllTask[],
    instance?: schema.XWorkInstance,
  ): Promise<model.AllTask[]> {
    if (!instance) return _tasks;
    const startTask = _tasks?.find((i) => i.approveType == '起始');
    if (startTask) {
      const res = await this.loadAllNodes(startTask?.id, instance.shareId);
      if (!res) {
        startTask.private = '主流程未开放';
        return _tasks;
      }
      if (!res.instance) {
        startTask.private = '主流程查询失败';
        return _tasks;
      }
      _tasks =
        res.instance.tasks?.map((task) => {
          return {
            ...task,
            tasks: task.id === instance.taskId ? _tasks : [],
            instance: res.instance,
          };
        }) || [];
      if (res.instance.taskId && res.instance.taskId.length > 10) {
        _tasks = await this.findMainProcess(_tasks, res.instance);
      }
    }
    return _tasks;
  }

  // 向下查找子流程
  async findSubProcess(
    _tasks: model.AllTask[],
    instance?: schema.XWorkInstance,
  ): Promise<model.AllTask[]> {
    _tasks = await Promise.all(
      _tasks.map(async (task) => {
        if (task.approveType === '子流程') {
          const res = await this.loadAllNodes(task?.id, instance?.shareId);
          if (!res) {
            return {
              ...task,
              private: '子流程未开放',
            };
          } else if (!res.instance) {
            return {
              ...task,
              private: '子流程未提交',
            };
          } else {
            let childrenTasks: model.AllTask[] = res.instance?.tasks?.map((task) => {
              return {
                ...task,
                instance: res.instance,
              };
            }) || [];
            if (childrenTasks?.length) {
              if (this.isExtraNode(childrenTasks)) {
                childrenTasks = await this.findSubProcess(childrenTasks, res.instance);
              }
              return {
                ...task,
                tasks: childrenTasks,
                instance: res.instance,
              };
            }
            return task;
          }
        }
        return {
          ...task,
          instance
        };
      }),
    );
    return _tasks;
  }

  async loadTasksData(): Promise<model.AllTask[]> {
    let _tasks: model.AllTask[] = this.instance?.tasks || [];
    if (!_tasks || !this.instance) return [];
    _tasks = await this.findSubProcess(_tasks, this.instance);
    if (this.instance.taskId && this.instance.taskId.length > 10) {
      _tasks = await this.findMainProcess(_tasks, this.instance);
    }
    return _tasks || [];
  }

  getSortedRecords(tasks: model.AllTask[]): model.WorkRecordView[] {
    let inApprovalRecord: model.WorkRecordView[] = [];
    const records = this.getAllRecords(tasks, inApprovalRecord).sort((a, b) =>
      a.createTime < b.createTime ? -1 : 1,
    );
    records.push(...inApprovalRecord);
    return records;
  }

  private getAllRecords(
    tasks: model.AllTask[],
    inApprovalRecord: model.WorkRecordView[],
    flag: string = '',
  ) {
    const records: model.WorkRecordView[] = [];
    tasks?.forEach((task) => {
      if (task.tasks?.length ?? 0 > 0) {
        records.push(...this.getAllRecords(task.tasks!, inApprovalRecord, '子流程-'));
      } else {
        const node = getNodeByNodeId(task.nodeId, this.instanceData?.node);
        if (task.records) {
          task.records.forEach((item) => {
            records.push({
              ...item,
              destName:
                flag +
                (item.status >= 200
                  ? '[驳回重批]-' + node?.destName
                  : task.title || node?.destName || ''),
              approveType: task.approveType,
            });
          });
        }
        if (task.status === TaskStatus.InApproval) {
          inApprovalRecord.push({
            ...task,
            destName: flag + task.title,
            taskId: task.id,
          } as any);
        }
      }
    });
    return records;
  }
  async loadMembers(identityId: string): Promise<schema.XTarget[]> {
    const res = await kernel.queryIdentityTargets({
      id: identityId,
      page: PageAll,
    })
    if (res.success) {
      return res.data.result;
    }
    return [];
  }
}
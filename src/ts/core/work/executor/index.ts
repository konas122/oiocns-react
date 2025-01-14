import { Command, model } from '@/ts/base';
import { IWorkTask } from '../..';

export type FormData = Map<string, model.FormEditData>;

// 执行器
export interface IExecutor<T extends model.Executor = model.Executor> {
  // 控制器
  command: Command;
  // 元数据
  metadata: T;
  // 当前任务
  task: IWorkTask;
  // 进度
  progress: number;
  // 执行
  execute(data: FormData): Promise<boolean>;
  // 改变状态
  changeProgress(p: number): void;
}

export abstract class Executor<T extends model.Executor> implements IExecutor<T> {
  constructor(metadata: T, task: IWorkTask) {
    this.command = new Command();
    this.metadata = metadata;
    this.task = task;
    this.progress = 0;
  }
  command: Command;
  metadata: T;
  task: IWorkTask;
  progress: number;
  abstract execute(data: FormData): Promise<boolean>;
  changeProgress(p: number) {
    this.progress = p;
    this.command.emitter('all', 'progress', p);
  }
}

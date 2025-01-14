import { ReceptionChangeExecutor } from '@/ts/base/model';
import { Executor } from '.';
import { IReception, Reception } from '../assign/reception';
import { IBelong, IGroup, IWorkTask } from '../..';
import { XReception } from '@/ts/base/schema';

export class ReceptionChange extends Executor<ReceptionChangeExecutor> {

  isMySpace: boolean;
  constructor(metadata: ReceptionChangeExecutor, task: IWorkTask, isMySpace = true) {
    super(metadata, task);
    this.isMySpace = isMySpace;
  }

  findSpace(reception: XReception) {
    // 查找发起单位
    const belongs: IBelong[] = [this.task.user.user!, ...this.task.user.user!.companys];
    if (this.isMySpace) {
      return belongs.find(t => t.id == this.task.taskdata.applyId);
    }

    // 审核人，查找群的单位
    const group = this.task.user.targets.find(t => t.id == reception.sessionId) as IGroup;
    if (!group) {
      return;
    }
    return group.space as IBelong;
  }

  async createReception(reception: XReception, belong: IBelong): Promise<IReception | undefined> {
    let svc = new Reception(reception, belong, this.isMySpace);
    // 找出最新的reception，流程实例里面的是旧的
    let [newReception] = await svc.publicReceptionColl?.find([reception.id]) ?? [];
    if (!newReception) {
      console.warn('找不到最新的任务接收，可能已被删除');
    } else {
      svc = new Reception(newReception, belong, this.isMySpace);
    }
    return svc;
  }

  async execute(): Promise<boolean> {
    // const { reception, data } = this.task.instanceData!;
    // if (!reception) {
    //   return false;
    // }
    // const belong = this.findSpace(reception);
    // if (belong) {
    //   const svc = await this.createReception(reception, belong);
    //   if (!svc) {
    //     return false;
    //   }

    //   const thingId: Dictionary<string[]> = {};
    //   for (const [formId, value] of Object.entries(data)) {
    //     thingId[formId] = value.at(-1)!.after.map((d) => d.id);
    //   }
    //   await svc.complete(thingId);
    //   return true;
    // }
    console.warn('执行器已过时，不会执行任何逻辑');
    return false;
  }

  async reject(): Promise<boolean> {
    // const { reception } = this.task.instanceData!;
    // if (!reception) {
    //   return false;
    // }
    // const belong = this.findSpace(reception);
    // if (belong) {
    //   const svc = await this.createReception(reception, belong);
    //   if (!svc) {
    //     return false;
    //   }

    //   await svc.reject();
    //   return true;
    // }
    console.warn('执行器已过时，不会执行任何逻辑');
    return false;
  }
}

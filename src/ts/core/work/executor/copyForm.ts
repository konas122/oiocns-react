import { Executor } from '.';
import { FormData } from './index';
import { CopyFormExecutor } from '@/ts/base/model';
import lodash from 'lodash';
import { kernel } from '@/ts/base';

/**
 * 复制数据到子表
 */
export class CopyForm extends Executor<CopyFormExecutor> {
  async execute(data: FormData): Promise<boolean> {
    const instance = this.task.instanceData;
    if (!instance) {
      return false;
    }
    this.metadata.copyForm.forEach((executor) => {
      const originData = instance.data[executor[0].id];
      const targetData = instance.data[executor[1].id];
      const originFields = instance.fields[executor[0].id];
      const targetFields = instance.fields[executor[1].id];
      const fields = originFields.filter((origin) => {
        return !targetFields.find((target) => {
          return target.propId === origin.propId;
        });
      });
      originData[0].after.forEach(async (data, index) => {
        if (executor[0].id === executor[1].id) {
          const res = await kernel.createThing(this.task.metadata.belongId, [], targetData[0].formName);
          const _copyData: any = res.data[0]
          targetFields.forEach((field) => {
            if (data[field.id]) {
              _copyData[field.id] = data[field.id]
            }
          })
          targetData[0].after[index] = _copyData
        } else {
          const _copyData: any = lodash.cloneDeep(data);
          fields.forEach((field) => {
            if (data[field.id]) {
              delete _copyData[field.id];
            }
          });
          targetData[0].after.push(_copyData);
        }
      });
    });
    return true;
  }
}

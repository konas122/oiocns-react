import { MallOrderSyncExecutor } from '@/ts/base/model';
import orgCtrl from '@/ts/controller';
import { Executor } from '.';
import { FormData } from './index';

/**
 * 商城订单同步
 */
export class MallOrderSync extends Executor<MallOrderSyncExecutor> {
  /**
   * 执行商城订单同步任务
   * @param data 表单数据
   */
  async execute(data: FormData): Promise<boolean> {
    // 当前实例数据
    const instance = this.task.instanceData;
    const { forms, collName, identifier } = this.metadata.mallOrderSyncForm;

    if (!instance || !Array.isArray(forms)) return false;

    const primaryForms = instance?.node.primaryForms || [];
    const primaryData: any[] = [];
    let value:any = '';
    let attr: any;

    // 提取主表单数据和字段
    const fields = primaryForms.flatMap((pForm) => {
      const field = instance.fields[pForm.id];
      const data = instance.data[pForm.id];
      if (data) primaryData.push(data);
      return field || [];
    });

    // 查找属性并解析数据
    try {
      attr = fields.find((item) => item.propId === identifier.propId);
      if (attr) {
        primaryData.flat().forEach((item) =>
          item.after.forEach((item1: any) => {
            const match = Object.entries(item1).find(([key]) => key === attr.id);
            if (match) value = match[1];
          }),
        );
      }
    } catch (error) {
      console.error('Error parsing primary data:', error);
    }

    // 获取当前工作空间
    const shareId = this.task.instance?.shareId;
    const currentSpace = orgCtrl.targets.find((item) => item.id === shareId);
    if (!currentSpace) return false;

    // 获取集合对象
    const coll = currentSpace.resource.genColl(collName ?? '-public-gwc');
    const pattern = /^\d{18}$/;

    // 批量处理表单数据
    const tasks = forms.map(async (form) => {
      const formId = form.id.replace('_', '');
      const formData = instance.data[formId] || [];
      const fields = instance.fields[formId] || [];

      if (Array.isArray(formData) && formData.length > 0) {
        const updatedData:any = formData.flatMap((item) => {
          const originData = item.after || [];
          return originData.map((record: any) => {
            // 更新字段代码
            Object.keys(record).forEach((key) => {
              if (pattern.test(key)) {
                const field = fields.find((f) => f.id === key);
                if (field) {
                  record[field.code] = record[key];
                  delete record[key];
                }
              }
            });
            // 设置属性值
            if (attr?.code) record[attr.code] = value;
            return record;
          });
        });

        // 替换集合数据
        if (updatedData.length > 0) {
          await coll.replace(updatedData);
        }
      }
    });

    await Promise.all(tasks);

    return true;
  }
}
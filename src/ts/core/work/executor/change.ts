import { model } from '@/ts/base';
import { deepClone } from '@/ts/base/common';
import { Executor } from '.';
import { FormData } from './index';
import { FieldsChangeExecutor } from '@/ts/base/model';
import { formatDate } from 'devextreme/localization';

/**
 * 字段变更
 */
export class FieldsChange extends Executor<FieldsChangeExecutor> {
  /**
   * 执行
   * @param data 表单数据
   */
  async execute(data: FormData): Promise<boolean> {
    const instance = this.task.instanceData;
    if (instance) {
      for (const change of this.metadata.changes) {
        for (const form of [
          ...instance.node.primaryForms,
          ...instance.node.detailForms,
        ]) {
          if (change.id == form.id) {
            const editData: model.FormEditData[] = instance.data[change.id];
            if (editData && editData.length > 0) {
              const edit = deepClone(editData[editData.length - 1]);
              edit.after.forEach((item) => {
                for (const fieldChange of change.fieldChanges) {
                  switch (fieldChange.id) {
                    case 'belongId':
                      item.belongId = this.task.taskdata.belongId;
                      break;
                    default:
                      // if (fieldChange.before) {
                      //   if (item[fieldChange.id] != fieldChange.before) {
                      //     throw new Error(
                      //       `当前字段${fieldChange.name}不为${fieldChange.beforeName}，变更失败`,
                      //     );
                      //   }
                      // }
                      if (fieldChange.name == '审核时间') {
                        let auditTime = new Date();
                        console.log(auditTime, fieldChange.id);
                        let formatAuditTime = formatDate(
                          auditTime,
                          'yyyy-MM-dd HH:mm:ss.SSS',
                        );
                        item['T' + fieldChange.id] = formatAuditTime;
                        const fileds = instance.node.primaryForms[0].attributes;
                        let targetId;
                        for (const field of fileds) {
                          if (field.propId == fieldChange.id) {
                            targetId = field.id;
                          }
                        }
                        if (targetId) {
                          item['T' + fieldChange.id] = formatAuditTime;
                          item[targetId] = formatAuditTime;
                          console.log(item[targetId], fieldChange.id);
                        }
                      } else if (fieldChange.options?.defaultType === 'currentPeriod') {
                        item[fieldChange.id] = this.task.belong.financial.current;
                      } else {
                        item[fieldChange.id] = fieldChange.after ?? '';
                      }
                      break;
                  }
                }
              });
              data.set(change.id, edit);
            }
          }
        }
      }
    }
    return false;
  }
}

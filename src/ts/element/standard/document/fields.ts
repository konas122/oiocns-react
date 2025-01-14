import { FieldModel } from '@/ts/base/model';
import { TaskStatusZhMap } from '@/ts/core/public/enums';

export const taskFields = [
  {
    id: 'belongId',
    name: '审批单位',
    code: 'belongId',
    valueType: '用户型',
    remark: '审批单位',
  },
  {
    id: 'applyId',
    name: '发起单位',
    code: 'applyId',
    valueType: '用户型',
    remark: '发起单位',
  },


  {
    id: 'title',
    name: '任务标题',
    code: 'title',
    valueType: '描述型',
    remark: '任务标题',
  },
  {
    id: 'status',
    code: 'status',
    name: '审批状态',
    valueType: '选择型',
    remark: '状态',
    /** 字典(字典项/分类项) */
    lookups: Object.entries(TaskStatusZhMap).map(([value, text]) => ({
      id: value,
      text,
      value: parseInt(value),
    })),
  },
  {
    id: 'comment',
    code: 'comment',
    name: '审批意见',
    valueType: '描述型',
    remark: '审批意见',
  },
  {
    id: 'createUser',
    name: '审批人',
    code: 'createUser',
    valueType: '用户型',
    remark: '提交人',
  },
  {
    id: 'createTime',
    name: '审批时间',
    code: 'createTime',
    valueType: '时间型',
    remark: '提交时间',
  },
] as FieldModel[];

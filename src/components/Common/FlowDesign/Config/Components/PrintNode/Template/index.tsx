import React, { FC, useState } from 'react';
import './index.less';
import Template1 from './Template1';
import { IWork, IWorkTask, TaskStatusZhMap } from '@/ts/core';
import { model, schema } from '@/ts/base';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { Form } from '@/ts/core/thing/standard/form';
import { isSnowflakeId } from '@/ts/base/common';
import orgCtrl from '@/ts/controller';
import { formatZhDate } from '@/utils/tools';
import LoadingView from '@/components/Common/Loading';

interface IProps {
  work: IWork | IWorkTask;
  printType: string;
  primaryForms: schema.XForm[];
  detailForms: schema.XForm[];
  print: schema.XPrint;
  resource: any;
  type?: string;
}
interface FormMapping extends schema.XForm {
  xform: model.MappingData;
}
const Templates: FC<IProps> = ({
  work,
  primaryForms,
  detailForms,
  printType,
  print,
  resource,
  type,
}) => {
  //表单属性列表
  const [fields, setFields] = useState<any>([]);
  //可选表单列表
  const [forms, setForms] = useState<any>([]);
  const [loaded] = useAsyncLoad(async () => {
    const fields: any = [];
    const tgs: FormMapping[] = [];
    const directory =
      work.cacheFlag == 'worktask' ? work.belong.directory : work.directory;
    for (const xform of [...primaryForms, ...detailForms]) {
      const form = new Form({ ...xform, id: xform.id + '_' }, directory);
      const xfields = await form.loadFields(false);
      xform.attributes.forEach((a) => {
        xfields.forEach((xfield) => {
          if (a.id == xfield.id) {
            if (!a.valueType) {
              a.valueType = xfield.valueType;
            }
          }
        });
      });
      fields.push(
        ...xfields.map((a) => {
          const name = `${form.name}--${a.name}`;
          switch (a.valueType) {
            case '数值型':
            case '货币型':
              return {
                ...a,
                xfield: {
                  name: xform.id + '-' + a.id,
                  caption: name,
                  formId: xform.id,
                  dataField: a.code,
                  dataType: 'number',
                },
              };
            case '日期型':
              return {
                ...a,
                xfield: {
                  name: xform.id + '-' + a.id,
                  caption: name,
                  dataField: a.code,
                  dataType: 'date',
                },
              };
            case '时间型':
              return {
                ...a,
                xfield: {
                  name: xform.id + '-' + a.id,
                  caption: name,
                  formId: xform.id,
                  dataField: a.code,
                  dataType: 'datetime',
                },
              };
            case '选择型':
            case '分类型':
              return {
                ...a,
                xfield: {
                  name: xform.id + '-' + a.id,
                  formId: xform.id,
                  caption: name,
                  dataField: a.code,
                  dataType: 'string',
                  lookup: {
                    displayExpr: 'text',
                    valueExpr: 'value',
                    allowClearing: true,
                    dataSource: a.lookups,
                  },
                },
              };
            default:
              return {
                ...a,
                xfield: {
                  name: xform.id + '-' + a.id,
                  caption: name,
                  dataField: xform.id + '-' + a.id,
                  dataType: 'string',
                },
              };
          }
        }),
      );
    }
    fields.push({
      id: '888',
      name: '办事流程时间',
      value: type == 'work' && formatZhDate(work.updateTime, 'YYYY年MM月DD日 HH:mm:ss'),
      valueType: '输出型',
      shouldReassignValue: type == 'design' && true,
      field: 'workflowDuration',
      xfield: {
        name: '888-888',
        caption: '办事流程时间',
        dataField: '888-888',
        dataType: 'datetime',
      },
    });
    if (type == 'work' && work.cacheFlag == 'worktask') {
      let tasks: any[] = [];
      const instanceTasks = (work as IWorkTask).instance?.tasks;
      if (Array.isArray(instanceTasks) && instanceTasks.length > 0) {
        tasks = instanceTasks;
      } else {
        tasks = await (work as IWorkTask).loadTasksData();
      }
      if (tasks && tasks.length > 0) {
        const tasksData = tasks!.filter((a) => a.records && a.records.length > 0);
        tasksData.forEach((a) => {
          if (a.tasks && a.tasks.length > 0) {
            a.tasks.forEach((b) => {
              if (b.approveType == '审批') {
                const createUser = orgCtrl.user.findMetadata<schema.XEntity>(
                  b.records![0].createUser,
                );
                fields.push({
                  name: b.title + '---------------' + '审核人',
                  value: createUser && createUser.name,
                  valueType: '输出型',
                  xfield: {
                    name: '111-111',
                    caption: a.title + '---------------' + '审核人',
                    dataField: '111-111',
                    dataType: 'string',
                  },
                });
                fields.push({
                  name: b.title + '---------------' + '审核结果',
                  value: TaskStatusZhMap[b.records![0].status] ?? '审核中',
                  valueType: '输出型',
                  xfield: {
                    name: '222-222',
                    caption: a.title + '---------------' + '审核结果',
                    dataField: '222-222',
                    dataType: 'string',
                  },
                });
                fields.push({
                  name: b.title + '---------------' + '审核意见',
                  value:
                    b.records![0].comment ??
                    (b.records![0].status >= 200 ? '驳回' : '同意'),
                  valueType: '输出型',
                  xfield: {
                    name: '333-333',
                    caption: a.title + '---------------' + '审核意见',
                    dataField: '333-333',
                    dataType: 'string',
                  },
                });
                fields.push({
                  name: b.title + '---------------' + '审核时间',
                  value: formatZhDate(b.records![0].updateTime, 'YYYY年MM月DD日'),
                  valueType: '输出型',
                  xfield: {
                    name: '444-444',
                    caption: a.title + '---------------' + '审核时间',
                    dataField: '444-444',
                    dataType: 'string',
                  },
                });
              }
            });
          } else {
            if (a.records![0].createUser && isSnowflakeId(a.records![0].createUser)) {
              const createUser = orgCtrl.user.findMetadata<schema.XEntity>(
                a.records![0].createUser,
              );
              fields.push({
                name: a.title + '---------------' + '审核人',
                value: createUser && createUser.name,
                valueType: '输出型',
                xfield: {
                  name: '111-111',
                  caption: a.title + '---------------' + '审核人',
                  dataField: '111-111',
                  dataType: 'string',
                },
              });
            }
            fields.push({
              name: a.title + '---------------' + '审核结果',
              value: TaskStatusZhMap[a.records![0].status] ?? '审核中',
              valueType: '输出型',
              xfield: {
                name: '222-222',
                caption: a.title + '---------------' + '审核结果',
                dataField: '222-222',
                dataType: 'string',
              },
            });
            fields.push({
              name: a.title + '---------------' + '审核意见',
              value:
                a.records![0].comment ?? (a.records![0].status >= 200 ? '驳回' : '同意'),
              valueType: '输出型',
              xfield: {
                name: '333-333',
                caption: a.title + '---------------' + '审核意见',
                dataField: '333-333',
                dataType: 'string',
              },
            });
            fields.push({
              name: a.title + '---------------' + '审核时间',
              value: formatZhDate(a.records![0].updateTime, 'YYYY年MM月DD日'),
              valueType: '输出型',
              xfield: {
                name: '444-444',
                caption: a.title + '---------------' + '审核时间',
                dataField: '444-444',
                dataType: 'string',
              },
            });
          }
        });
      }
    } else if (type === 'design') {
      const workNode: any[] = [];
      const convertProcessNode = (data: any) => {
        if (data.id && data.type === '审批') {
          workNode.push({
            id: data.primaryId,
            name: data.name,
            type: data.type,
            destId: data?.destId,
            destType: data?.destType,
            destName: data?.destName,
          });
        }
        if (data.children) {
          convertProcessNode(data.children);
        }
      };
      convertProcessNode(resource);
      workNode.forEach((item) => {
        const prefix_text = `[${item.type}：${item.destType} - ${item.destName}]`;
        fields.push({
          name: prefix_text + '---------------' + '审核人',
          valueType: '输出型',
          shouldReassignValue: true,
          field: 'createUser',
          xfield: {
            name: '111-111',
            caption: prefix_text + '---------------' + '审核人',
            dataField: '111-111',
            dataType: 'string',
          },
          extra: {
            ...item,
          },
        });

        fields.push({
          name: prefix_text + '---------------' + '审核结果',
          valueType: '输出型',
          shouldReassignValue: true,
          field: 'status',
          xfield: {
            name: '222-222',
            caption: prefix_text + '---------------' + '审核结果',
            dataField: '222-222',
            dataType: 'string',
          },
          extra: {
            ...item,
          },
        });
        fields.push({
          name: prefix_text + '---------------' + '审核意见',
          valueType: '输出型',
          shouldReassignValue: true,
          field: 'comment',
          xfield: {
            name: '333-333',
            caption: prefix_text + '---------------' + '审核意见',
            dataField: '333-333',
            dataType: 'string',
          },
          extra: {
            ...item,
          },
        });
        fields.push({
          name: prefix_text + '---------------' + '审核时间',
          valueType: '输出型',
          shouldReassignValue: true,
          field: 'updateTime',
          xfield: {
            name: '444-444',
            caption: prefix_text + '---------------' + '审核时间',
            dataField: '444-444',
            dataType: 'string',
          },
          extra: {
            ...item,
          },
        });
      });
    }
    fields.push({
      name: '办事单位',
      value: type == 'work' && work.belong._metadata.name,
      shouldReassignValue: type == 'design' && true,
      valueType: '输出型',
      field: 'company',
      xfield: {
        name: '555-555',
        caption: '办事单位',
        dataField: '555-555',
        dataType: 'string',
      },
    });
    tgs.push(
      ...detailForms.map((a) => {
        return {
          ...a,
          xform: {
            type: '子表',
            id: a.id,
            formId: a.id,
            key: a.id,
            formName: a.name,
            typeName: '表单',
            trigger: a.id,
            code: '',
            name: `[子表]${a.name}`,
          },
        };
      }),
      ...primaryForms.map((a) => {
        return {
          ...a,
          xform: {
            type: '主表',
            id: a.id,
            formId: a.id,
            key: a.id,
            formName: a.name,
            typeName: '表单',
            trigger: a.id,
            code: '',
            name: `[主表]${a.name}`,
          },
        };
      }),
    );
    setForms(tgs);
    setFields(fields);
  }, [primaryForms, detailForms]);
  if (!loaded)
    return (
      <div className="loading-page">
        <LoadingView text="信息加载中..." />
      </div>
    );
  return (
    <>
      <Template1
        resource={resource}
        printType={printType}
        fields={fields}
        forms={forms}
        print={print}
      />
    </>
  );
};
export default Templates;

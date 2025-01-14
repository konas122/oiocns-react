import { command, kernel, model, parseAvatar, schema } from '../../../ts/base';
import { useEffect, useRef, useState } from 'react';
import React from 'react';
import { InputNumber, Modal, Tabs, message } from 'antd';
import { EditModal } from '../editModal';
import GenerateThingTable from '../generate/thingTable';
import {
  Uploader,
  generating,
  showErrors,
  matching,
  insertData,
  directImport,
} from '../uploadTemplate';
import * as el from '@/utils/excel';
import { XThing } from '@/ts/base/schema';
import { AiFillCopy, AiFillEdit, AiFillRest } from 'react-icons/ai';
import { deepClone, getAsyncTime } from '@/ts/base/common';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import { DetailOperationType } from '@/ts/scripting/core/types/service';
import _, { cloneDeep } from 'lodash';
import { Form } from '@/ts/core/thing/standard/form';
import OpenFileDialog from '@/components/OpenFileDialog';
import { Theme } from '@/config/theme';
import { MdPrint } from 'react-icons/md';
import { Workbook } from 'exceljs';
import saveAs from 'file-saver';
import { IBelong } from '@/utils/excel';
import { Sequence } from '@/ts/core/thing/standard/sequence';
import { FormChangeEvent } from '@/ts/scripting/core/types/rule';
import type { TabBarExtraContent } from 'rc-tabs/lib/interface';
import CustomStore from 'devextreme/data/custom_store';
import ArrayStore from 'devextreme/data/array_store';
import { ITarget } from '@/ts/core';
import orgCtrl from '@/ts/controller';

const pattern = /^T\d+$/;
interface FormProps {
  allowEdit: boolean;
  form: schema.XForm;
  info: model.FormInfo;
  allowLabelPrint?: boolean;
  service: WorkFormService;
  node: model.WorkNodeModel;
  instanceData?: model.InstanceDataModel;
}

const DetailTable: React.FC<FormProps> = (props) => {
  const form = props.form;
  const info = props.info;
  if (!props.service.model.fields[form.id]) return <></>;
  const lock = useRef(false);
  const fields = props.service.model.fields[form.id];
  const operateRule = {
    allowAdd: info?.allowAdd ?? true,
    allowEdit: info?.allowEdit ?? true,
    allowSelect: info?.allowSelect ?? true,
    allowSelectFile: info?.allowSelectFile ?? false,
    autoFill: info?.autoFill ?? false,
  };
  const formData = useRef(props.service.getFormData(props.form, props.node.id, '子表'));
  const [data, setData] = useState(formData.current);
  const [selectKeys, setSelectKeys] = useState<string[]>([]);
  const [differences, setDifferences] = useState<any[]>([]);
  const [center, setCenter] = useState(<></>);

  useEffect(() => {
    var after = formData?.current.after.at(-1);
    if (after) {
      after.name = props.form.name;
    }
    const model = props.service.model;
    const formId = props.form.id;
    if (model.data[formId]) {
      const temp =
        model.data[formId]?.filter((a) => a.nodeId != formData?.current.nodeId) ?? {};
      model.data[formId] = [...temp, formData.current];
    } else {
      model.data[formId] = [formData.current];
    }
    props.service.onDetailDataChanged(props.form.id, 'all', model.data[formId][0].after);
    if (info?.allowShowChangeData) {
      if (
        (formData.current.after as any[])?.length > 0 &&
        (formData.current.before as any[])?.length > 0
      ) {
        let arr: any[] = [
          ...differences,
          ...findDifferentValues(
            formData.current.after as any[],
            formData.current.before as any[],
          ),
        ];
        if (arr.length > 0) {
          let newArr = info.showChangeData?.map((item: any) => item.id) ?? [];
          newArr.filter((item) => !arr.includes(item));
          arr.push(...newArr);
        }

        setDifferences(arr);
      }
    }
  }, [data]);

  useEffect(() => {
    const id = props.service?.command.subscribe((type, cmd, args) => {
      if (args.formId == props.form?.id) {
        switch (type) {
          case 'change':
            switch (cmd) {
              case 'result':
                switch (args.type) {
                  case 'add':
                    formData.current.after.push(args.value);
                    break;
                  case 'update':
                    formData.current.after = formData.current.after.map((item) => {
                      if (item.id === args.destId) {
                        return args.value;
                      } else {
                        return item;
                      }
                    });
                    break;
                }
                break;
              case 'combination':
                formData.current.after = args.data;
                break;
              case 'assignment':
                formData.current.after = args.data;
                formData.current.before = args.data;
                break;
            }
            break;
        }
        setData({ ...formData.current });
      }
    });
    operateRule.autoFill && loadAutoFillData();
    return () => {
      props.service?.command.unsubscribe(id!);
    };
  }, []);

  useEffect(() => {
    if (props.instanceData) {
      const data =
        props.instanceData.node.detailForms.length > 0
          ? props.instanceData.data[props.instanceData.node.detailForms[0].id][0].after
          : [];
      insertData(props.service.belong, fields, data, formData.current, () =>
        setData({ ...formData.current }),
      );
    }
  }, [props.instanceData]);

  const loadAutoFillData = async () => {
    const metaForm = new Form(form, props.service.belong.directory);
    const loadOptions = {
      take: 100,
      skip: 0,
      userData: [],
      filter: metaForm.parseFilter([]),
      isCountQuery: false,
      options: {},
    };
    let res = await metaForm.loadThing(loadOptions);
    const resData = res.data.map((item: { [s: string]: any }) => {
      let newItem: any = {};
      Object.entries(item).forEach(([_key, value]) => {
        if (pattern.test(_key)) {
          _key = _key.replace('T', '');
        }
        newItem[_key] = value;
      });
      return newItem;
    });

    formData.current.after = resData;
    setData({ ...formData.current });
  };

  const findDifferentValues = (arr1: any, arr2: any) => {
    const result: any[] = []; // 存储结果的数组
    arr1.forEach((obj1: any) => {
      arr2.forEach((obj2: any) => {
        if (obj1.id === obj2.id) {
          const allKeys = new Set(Object.keys(obj1).concat(Object.keys(obj2)));
          allKeys.forEach((key) => {
            if (obj1[key] !== obj2[key] && key != 'name') {
              if (!result.includes(key)) {
                result.push(key);
              }
            }
          });
        }
      });
    });
    return result;
  };

  if (!formData) {
    return <></>;
  }

  async function addOrUpdate(type: 'add' | 'update', data?: XThing) {
    try {
      const formDataClone = _.cloneDeep(formData);
      const values = await EditModal.showFormEdit({
        form: form,
        fields: fields,
        belong: props.service.belong,
        create: type === 'add',
        initialValues: data,
        formData: formDataClone,
      });

      if (type === 'update') {
        const index = formData.current.after.findIndex((a) => a.id == values.id);
        console.assert(index >= 0, '找不到修改前的数据 ' + values.id);
        formData.current.after[index] = values;
        let changeItems = [...(props.service.model.changeItems || []), values.id];
        props.service.model.changeItems = changeItems;
      } else {
        formData.current.after.push(values);
      }
      setData({ ...formData.current });
    } catch (error) {
      if (error != 'close') {
        console.error(error);
      }
    }
  }

  async function setCopyData(
    thing: schema.XThing,
    fields: model.FieldModel[],
    belong: IBelong,
  ) {
    const changes: Omit<FormChangeEvent, 'formId'>[] = [];

    function onChange(destId: string, value: any) {
      changes.push({ destId, value });
    }
    for (const field of fields) {
      if (field.options?.asyncGeneateConditions?.length) {
        let ret = '';
        for (const rule of field.options.asyncGeneateConditions.sort(
          (pre: { order: any }, next: { order: any }) =>
            Number(pre.order) - Number(next.order),
        )) {
          switch (rule.encodeType.label) {
            case '常量':
              ret += rule.encodeValue;
              break;
            case '时间':
              ret += getAsyncTime(rule.dimensionalAccuracy.label);
              break;
            case '流水':
              var se = await new Sequence(rule.sequence, belong.directory).genValue();
              if (se == '') {
                console.error('生成序号失败!');
              }
              ret += se;
              break;
            default:
              break;
          }
        }
        thing[field.id] = ret;
        onChange(field.id, ret);
      }
    }
  }

  async function copyModal(data: XThing) {
    let num = 0;
    Modal.confirm({
      icon: <></>,
      okText: `确认`,
      cancelText: '关闭',
      onCancel: () => {
        close();
        num = 0;
      },
      content: (
        <div
          style={{
            maxHeight: '20vh',
            width: '100%',
          }}>
          复制数量：
          <InputNumber
            min={0}
            precision={0}
            max={100}
            placeholder="Outlined"
            style={{ width: 200 }}
            onChange={(e) => {
              num = parseInt(e);
            }}
            defaultValue={num}
          />
        </div>
      ),
      onOk: async () => {
        if (num > 0) {
          const res = await kernel.createThing(data?.belongId, [], data.name, num);
          res.data.forEach(async (item: XThing) => {
            await setCopyData(item, fields, props.service.belong);
            formData.current.before.unshift({ ...data, ...item });
            formData.current.after.unshift({ ...data, ...item });
            setData({ ...formData.current });
          });
          num = 0;
        }
      },
    });
  }

  // 限额规则计算可更新数
  const quotaRuleSummery = async (
    metaForm: Form,
    feilds: model.FieldModel[],
    values: schema.XThing[],
    quotaRule: model.Rule<model.RuleType>[],
  ) => {
    const curSpecies = feilds.filter((field) => field.options?.species)[0];
    const selectSpeciesIds = values.map((val) => val[curSpecies.id]);

    const loadOptions: any = {};
    loadOptions.filter = metaForm.parseFilter(loadOptions.filter);
    const classify = metaForm.parseClassify();
    if (loadOptions.filter.length == 0 && Object.keys(classify).length == 0) {
      return { data: [], totalCount: 0 };
    }
    loadOptions.userData = [];
    if (!quotaRule[0].quota) return message.error('请完善配置限额规则');
    const results: any = await metaForm.loadAssetClassQuotaSummary(
      loadOptions,
      curSpecies.code,
      selectSpeciesIds,
      quotaRule[0].quota,
    );
    if (results && results.length > 0) {
      results.map((item: any) => {
        const newItem: any = {};
        for (let key in item) {
          if (item.hasOwnProperty(key)) {
            if (key.startsWith('T')) {
              const newKey = key.slice(1);
              newItem[newKey] = item[key];
            }
          }
        }
        values.forEach((val) => {
          if (newItem[curSpecies.id] === val[curSpecies.id]) {
            if (formData.current.after.every((i) => i.id !== val.id)) {
              formData.current.after.unshift({ ...val, ...newItem });
            }
            if (formData.current.before.every((i) => i.id !== val.id)) {
              formData.current.before.unshift({ ...val, ...newItem });
            }
            setData({ ...formData.current });
          }
        });
      });
    }
  };

  const detailToDetail = async (
    values: schema.XThing[],
    detailToDetailRule: model.Rule<model.RuleType>,
    actionType: 'add' | 'remove',
  ) => {
    let mergeArr: schema.XThing[] = [];
    if (actionType === 'add') {
      mergeArr = _.unionBy(formData.current.after, values, 'id');
    } else if (actionType === 'remove') {
      mergeArr = [...values];
    }
    const loadOptions: model.LoadOptions = {
      options: {
        match: {
          isDeleted: false,
          id: { $in: mergeArr.map((item) => item.id) },
        },
      },
    };

    const metaForm = new Form(form, props.service.belong.directory);
    const result = await metaForm.loadArchives(loadOptions);
    const resultData = result.data || [];

    const mergedResult = _.mergeWith(
      _.keyBy(mergeArr, 'id'),
      _.keyBy(resultData, 'id'),
      (a, b) => ({ archives: Object.values(b.archives)[0] || {}, ...a }),
    );

    const details: any[] = [];
    const instanceDetails = _.values(mergedResult).map(async (instance: any) => {
      const { archives } = instance;
      const detail = await orgCtrl.work.loadInstanceDetail(
        archives.id || archives._id,
        archives.shareId,
        archives.belongId,
      );
      const data = detail?.data ? JSON.parse(detail.data) : {};
      const billsField = instance[detailToDetailRule.detailToDetail!.billsField!.id];
      const newDetails = data.node.detailForms.flatMap((detailForm: schema.XForm) =>
        data.data[detailForm.id][0].after.map((item: any) => ({
          [detailToDetailRule.detailToDetail!.detailField!.id]: billsField,
          ...item,
        })),
      );
      details.push(...newDetails);
    });
    await Promise.all(instanceDetails);
    props.service.command.emitter('change', 'combination', {
      formId: detailToDetailRule.detailToDetail!.forms![0].id,
      data: details,
    });
  };

  async function updateModal(info: model.operationButtonInfo) {
    const metaForm = new Form(info.form?.metadata, props.service.belong.directory);
    const fields = await metaForm.loadFields();
    let FormProps = {
      form: info.form?.metadata,
      fields: fields,
      belong: props.service.belong,
      onSave: (values: schema.XThing[]) => {
        const hasQuotaRule = props.node.formRules.filter(
          (i) => i.type === 'assignment' && i.ruleType === 'quota',
        );
        if (hasQuotaRule.length > 0) {
          quotaRuleSummery(metaForm, fields, values, hasQuotaRule);
        } else {
          values.forEach((item) => {
            if (formData.current.after.every((i) => i.id !== item.id)) {
              formData.current.after.unshift(item);
            }
            if (formData.current.before.every((i) => i.id !== item.id)) {
              formData.current.before.unshift({ ...item });
            }
          });
          setData({ ...formData.current });
        }
      },
    };
    if (info.type === 'choice') {
      EditModal.showFormSelect(FormProps);
    } else if (info.type === 'syncData') {
      EditModal.showSyncModal(FormProps);
    } else {
      EditModal.SummaryFormModal(FormProps);
    }
  }

  const showBtn = () => {
    let arr: any[] = [];
    if (info.operationButton && info.operationButton.length > 0) {
      info.operationButton.forEach((item) => {
        if (item?.scene !== 'mobile') {
          arr.push({
            name: 'add',
            location: 'after',
            widget: 'dxButton',
            options: {
              text: item.name,
              icon: 'add',
              onClick: async () => {
                await updateModal(item);
              },
            },
            visible: props.allowEdit,
          });
          if (item?.code === 'code') {
            arr.push({
              name: 'add',
              location: 'after',
              widget: 'dxButton',
              options: {
                text: '分类存量导入',
                icon: 'add',
                onClick: async () => {
                  const values = deepClone(fields);
                  values.unshift({
                    id: 'id',
                    name: '唯一标识',
                    code: 'id',
                    valueType: '描述型',
                    remark: '唯一标识',
                  } as model.FieldModel);
                  const excel = new el.Excel(
                    props.service.belong,
                    el.getAnythingSheets(form, values, 'id'),
                  );
                  const modal = Modal.info({
                    icon: <></>,
                    okText: '关闭',
                    width: 610,
                    title: form.name + '导入',
                    className: 'uploader-model',
                    maskClosable: true,
                    content: (
                      <Uploader
                        templateName={form.name}
                        excel={excel}
                        fields={fields}
                        finished={(_, errors) => {
                          modal.destroy();
                          if (errors.length > 0) {
                            showErrors(errors);
                            return;
                          }
                          directImport(
                            excel.handlers[0].sheet.data,
                            formData.current,
                            () => setData({ ...formData.current }),
                          );
                        }}
                      />
                    ),
                  });
                },
              },
              visible: props.allowEdit,
            });
          }
        }
      });
    }
    return arr;
  };

  const loadMenus = () => {
    if (props.allowEdit) {
      var items = [
        {
          key: 'remove',
          label: '移除',
          icon: <AiFillRest fontSize={22} />,
        },
      ];
      if (form.isCopy) {
        items.unshift({
          key: 'copy',
          label: '复制数据',
          icon: <AiFillCopy fontSize={22} />,
        });
      }
      if (operateRule.allowEdit) {
        items.unshift({
          key: 'update',
          label: '更新',
          icon: <AiFillEdit fontSize={22} />,
        });
      }
      return {
        items: items,
        async onMenuClick(key: string, data: XThing) {
          switch (key as DetailOperationType) {
            case 'update':
              addOrUpdate('update', data);
              break;
            case 'copy':
              copyModal(data);
              break;
            case 'remove':
              formData.current.before = formData.current.before.filter(
                (i) => i.id != data.id,
              );
              formData.current.after = formData.current.after.filter(
                (i) => i.id != data.id,
              );
              const detailToDetailRule = props.node.formRules.find(
                (i) => i.ruleType === 'detailToDetail',
              );
              if (detailToDetailRule) {
                detailToDetail(formData.current.after, detailToDetailRule, 'remove');
              }
              setSelectKeys([]);
              setData({ ...formData.current });
              break;
          }
        },
      };
    } else {
      return {
        items: [
          {
            key: 'detail',
            label: '详情',
            icon: <AiFillEdit fontSize={22} />,
          },
          {
            key: 'printEntity',
            label: '标签打印',
            icon: <MdPrint fontSize={22} color={Theme.FocusColor} />,
            hide:
              !props.allowLabelPrint || !form?.print ? true : form.print?.config?.hide,
          },
        ],
        onMenuClick(key: string, data: XThing) {
          switch (key as DetailOperationType) {
            case 'detail':
              command.emitter(
                'executor',
                'open',
                {
                  ...data,
                  fields: fields,
                  formId: form.id,
                  typeName: '物详情',
                  key: data.id,
                },
                'preview',
              );
              break;
            case 'printEntity':
              command.emitter(
                'executor',
                'printEntity',
                { metadata: form, fields },
                'multiple',
                [data],
              );
              break;
          }
        },
      };
    }
  };
  const findTextWithParent = (value: string, data: any[]) => {
    let currentItem = data.find((item) => item.value === value);
    let texts = [];

    // 开始从当前项开始收集 text
    while (currentItem) {
      texts.unshift(currentItem.text); // 将当前文本添加到开头
      // 找到父项
      currentItem = data.find((item) => item.id === currentItem.parentId);
    }

    return texts.join('/'); // 用 '/' 分隔返回的文本
  };
  const handleHeightLight = (things: XThing[]) => {
    let filterRedRowExp = form.options?.dataRange?.filterRedRowExp;
    if (!things.length) return [];
    if (!filterRedRowExp) return things;
    const after = cloneDeep(
      things.map((v) => {
        delete v.redRowFlag;
        return v;
      }),
    );
    return new CustomStore({
      key: 'id',
      async load() {
        let redRowRule = '';
        try {
          if (filterRedRowExp) {
            form.attributes.forEach((item) => {
              if (filterRedRowExp!.includes(item.property!.id)) {
                filterRedRowExp = filterRedRowExp!.replaceAll(
                  `T${item.property!.id}`,
                  item.id,
                );
              }
            });
            redRowRule = JSON.parse(filterRedRowExp);
          }
          // eslint-disable-next-line no-empty
        } catch (_e) {}
        if (after && after.length > 0 && redRowRule) {
          const d = await new ArrayStore({ data: after }).load({ filter: redRowRule });
          d.forEach((item) => {
            const index = after.findIndex((j) => j.id === item.id);
            if (index > -1) after[index]['redRowFlag'] = true;
          });
        }
        return { data: after ?? [], totalCount: after.length };
      },
    });
  };
  return (
    <>
      <GenerateThingTable
        form={props.form}
        fields={fields}
        height={500}
        dataIndex={'attribute'}
        selection={
          props.allowEdit
            ? {
                mode: 'multiple',
                allowSelectAll: true,
                selectAllMode: 'allPages',
                showCheckBoxesMode: 'always',
              }
            : undefined
        }
        differences={differences}
        onSelectionChanged={(e) => setSelectKeys(e.selectedRowKeys)}
        onExporting={async (e) => {
          if (lock.current) {
            message.error('正在导出数据，请稍后再试!');
            return;
          }
          lock.current = true;
          try {
            if (e.format === 'xlsx') {
              e.component.beginCustomLoading('正在导出数据...');
              const workbook = new Workbook();
              const worksheet = workbook.addWorksheet(form.name);
              const columns = e.component.getVisibleColumns();
              worksheet.columns = e.component
                .getVisibleColumns()
                .filter((it) => it.name !== '操作')
                .map((column) => {
                  return { header: column.caption, key: column.dataField };
                });
              let result: any = await e.component.getDataSource().store().load();
              let data: schema.XThing[] = Array.isArray(result)
                ? (deepClone(result) as schema.XThing[])
                : (deepClone(result.data) as schema.XThing[]);
              const categoricalList = props.form.attributes.filter((i) =>
                i.property ? i.property.valueType === '分类型' : i.valueType === '分类型',
              );

              if (e.selectedRowsOnly) {
                const selectedRowKeys: string[] = e.component.getSelectedRowKeys();
                data = data.filter((item) => selectedRowKeys.includes(item.id));
              }
              data.forEach((item) => {
                for (const column of columns) {
                  const categorical = categoricalList.find(
                    (i) => i.id === column.dataField,
                  );
                  const valueMap = (column.lookup as any)?.valueMap;
                  const items = (column.lookup as any)?.items;
                  if (categorical) {
                    //分类型需要返回xxx/xxx/xxx的格式
                    if (valueMap && column.dataField) {
                      item[column.dataField] = findTextWithParent(
                        item[column.dataField],
                        items,
                      );
                    }
                  } else {
                    if (valueMap && column.dataField) {
                      item[column.dataField] = valueMap[item[column.dataField]];
                    }
                  }
                }
                worksheet.addRow(item);
              });
              workbook.xlsx.writeBuffer().then((buffer) => {
                saveAs(
                  new Blob([buffer], { type: 'application/octet-stream' }),
                  form.name + '.xlsx',
                );
              });
              e.component.endCustomLoading();
            }
          } finally {
            lock.current = false;
          }
        }}
        toolbar={{
          visible: true,
          items: [
            ...showBtn(),
            {
              name: 'add',
              location: 'after',
              widget: 'dxButton',
              options: {
                text: '新增',
                icon: 'add',
                onClick: () => {
                  addOrUpdate('add');
                },
              },
              visible: props.allowEdit && operateRule['allowAdd'],
            },
            {
              name: 'import',
              location: 'after',
              widget: 'dxButton',
              options: {
                text: '导入匹配',
                icon: 'add',
                onClick: async () => {
                  const values = deepClone(fields);
                  values.unshift({
                    id: 'id',
                    name: '唯一标识',
                    code: 'id',
                    valueType: '描述型',
                    remark: '唯一标识',
                  } as model.FieldModel);
                  const excel = new el.Excel(
                    props.service.belong,
                    el.getAnythingSheets(
                      form,
                      values.filter((i) => i.name === form.matchImport || ''),
                      'code',
                    ),
                  );
                  const modal = Modal.info({
                    icon: <></>,
                    okText: '关闭',
                    width: 610,
                    title: form.name + '导入',
                    className: 'uploader-model',
                    maskClosable: true,
                    content: (
                      <Uploader
                        templateName={form.name}
                        excel={excel}
                        fields={fields}
                        finished={(_, errors) => {
                          modal.destroy();
                          if (errors.length > 0) {
                            showErrors(errors);
                            return;
                          }
                          matching(
                            props.service.belong,
                            form,
                            excel.handlers[0].sheet.data,
                            formData.current,
                            fields,
                            () => setData({ ...formData.current }),
                          );
                        }}
                      />
                    ),
                  });
                },
              },
              visible:
                props.allowEdit &&
                operateRule['allowSelect'] &&
                fields.filter((i) => i.name === form.matchImport || '').length > 0,
            },
            {
              name: 'import',
              location: 'after',
              widget: 'dxButton',
              options: {
                text: '导入变更',
                icon: 'add',
                onClick: async () => {
                  const values = deepClone(fields);
                  values.unshift({
                    id: 'id',
                    name: '唯一标识',
                    code: 'id',
                    valueType: '描述型',
                    remark: '唯一标识',
                  } as model.FieldModel);
                  const excel = new el.Excel(
                    props.service.belong,
                    el.getAnythingSheets(form, values, 'code'),
                  );
                  const modal = Modal.info({
                    icon: <></>,
                    okText: '关闭',
                    width: 610,
                    title: form.name + '导入',
                    className: 'uploader-model',
                    maskClosable: true,
                    content: (
                      <Uploader
                        templateName={form.name}
                        excel={excel}
                        fields={fields}
                        belondId={props.service.belong.id}
                        finished={(_, errors) => {
                          modal.destroy();
                          if (errors.length > 0) {
                            showErrors(errors);
                            return;
                          }
                          matching(
                            props.service.belong,
                            form,
                            excel.handlers[0].sheet.data,
                            formData.current,
                            fields,
                            () => setData({ ...formData.current }),
                            'matchChange',
                          );
                        }}
                      />
                    ),
                  });
                },
              },
              visible:
                props.allowEdit &&
                operateRule['allowSelect'] &&
                fields.filter((i) => i.name === form.matchImport || '').length > 0,
            },
            {
              name: 'selectFile',
              location: 'after',
              widget: 'dxButton',
              options: {
                text: '选择文件',
                icon: 'add',
                onClick: async () => {
                  setCenter(
                    <OpenFileDialog
                      accepts={['目录']}
                      rootKey={props.service.belong.directory.key}
                      multiple
                      onOk={(files) => {
                        files.forEach((item) => {
                          let thing = item.metadata as any as schema.XThing;
                          if (formData.current.after.every((i) => i.id !== item.id)) {
                            thing = { ...thing };
                            let avatar = parseAvatar(thing.icon);
                            if (avatar) {
                              thing.icons = JSON.stringify([avatar]);
                            }
                            for (const key of Object.keys(thing)) {
                              if (Array.isArray(thing[key])) {
                                thing[key] = undefined;
                              }
                            }
                            formData.current.after.unshift({ ...thing });
                          }
                        });
                        setData({ ...formData.current });
                        setCenter(<></>);
                      }}
                      onCancel={() => setCenter(<></>)}
                    />,
                  );
                },
              },
              visible: props.allowEdit && operateRule.allowSelectFile,
            },
            {
              name: 'import',
              location: 'after',
              widget: 'dxButton',
              options: {
                text: '导入新增',
                icon: 'add',
                onClick: async () => {
                  const values = deepClone(fields);
                  values.unshift({
                    id: 'id',
                    name: '唯一标识',
                    code: 'id',
                    valueType: '描述型',
                    remark: '唯一标识',
                  } as model.FieldModel);
                  const excel = new el.Excel(
                    props.service.belong,
                    el.getAnythingSheets(form, values, 'id'),
                  );
                  const modal = Modal.info({
                    icon: <></>,
                    okText: '关闭',
                    width: 610,
                    className: 'uploader-model',
                    title: form.name + '导入',
                    maskClosable: true,
                    content: (
                      <Uploader
                        templateName={form.name}
                        excel={excel}
                        belondId={form.shareId}
                        finished={(_, errors, conditions, cardconditions) => {
                          modal.destroy();
                          if (errors.length > 0) {
                            showErrors(errors);
                            return;
                          }
                          generating(
                            props.service.belong,
                            form.name,
                            fields,
                            excel.handlers[0].sheet.data,
                            formData.current,
                            () => setData({ ...formData.current }),
                            conditions,
                            cardconditions,
                          );
                        }}
                        type="add"
                      />
                    ),
                  });
                },
              },
              visible: props.allowEdit && operateRule['allowAdd'],
            },
            {
              name: 'edit',
              location: 'after',
              widget: 'dxButton',
              options: {
                text: '变更',
                icon: 'edit',
                onClick: async () => {
                  const values = await EditModal.showFormEdit({
                    form: form,
                    fields: fields,
                    belong: props.service.belong,
                    create: false,
                  });

                  formData.current.after = formData.current.after.map((item) => {
                    if (selectKeys.includes(item.id)) {
                      Object.keys(values).forEach((k) => {
                        item[k] = values[k];
                      });
                    }
                    return item;
                  });
                  setData({ ...formData.current });
                },
              },
              visible:
                props.allowEdit && operateRule['allowEdit'] && selectKeys.length > 0,
            },
            {
              name: 'select',
              location: 'after',
              widget: 'dxButton',
              options: {
                text: '选择',
                icon: 'bulletlist',
                onClick: () => {
                  let space: ITarget = props.service.belong;
                  if (props.info.selectBelong) {
                    space = props.service.target;
                  }
                  EditModal.showFormSelect({
                    form: form,
                    fields: fields,
                    belong: space,
                    onSave: async (values) => {
                      const detailToDetailRule = props.node.formRules.find(
                        (i) => i.ruleType === 'detailToDetail',
                      );
                      if (detailToDetailRule) {
                        detailToDetail(values, detailToDetailRule, 'add');
                      }
                      await props.service.beforeSelectedData(values, fields);
                      if (props.info.allowGenerate) {
                        const result = await kernel.createThing(
                          props.service.belong.id,
                          [props.service.belong.id],
                          form.name,
                          values.length,
                        );
                        for (let index = 0; index < values.length; index++) {
                          const value = values[index];
                          const thing = result.data[index];
                          for (const key of Object.keys(value)) {
                            if (!thing[key]) {
                              thing[key] = value[key];
                            }
                          }
                          formData.current.after.push(thing);
                        }
                      } else {
                        values.forEach((item) => {
                          if (formData.current.after.every((i) => i.id !== item.id)) {
                            formData.current.after.unshift(item);
                          }
                          if (formData.current.before.every((i) => i.id !== item.id)) {
                            formData.current.before.unshift({ ...item });
                          }
                        });
                      }
                      setData({ ...formData.current });
                    },
                  });
                },
              },
              visible: props.allowEdit && operateRule['allowSelect'],
            },
            {
              name: 'remove',
              location: 'after',
              widget: 'dxButton',
              options: {
                text: '移除',
                icon: 'remove',
                onClick: () => {
                  formData.current.before = formData.current.before.filter(
                    (i) => !selectKeys.includes(i.id),
                  );
                  formData.current.after = formData.current.after.filter(
                    (i) => !selectKeys.includes(i.id),
                  );
                  setSelectKeys([]);
                  setData({ ...formData.current });
                },
              },
              visible: props.allowEdit && selectKeys.length > 0,
            },
            {
              name: 'exportButton',
              location: 'after',
            },
            {
              name: 'print',
              location: 'after',
              widget: 'dxButton',
              visible:
                props.allowLabelPrint &&
                form?.print &&
                (form.print.config?.hide === void 0 || form.print.config?.hide === false),
              options: {
                icon: 'print',
                onClick: () => {
                  if (!form.print) return message.error('请先配置打印模板');
                  if (formData.current.after.length === 0)
                    return message.error('请选择需要打印的数据');
                  command.emitter(
                    'executor',
                    'printEntity',
                    { metadata: form, fields },
                    'multiple',
                    formData.current.after,
                  );
                },
              },
            },
            {
              name: 'columnChooserButton',
              location: 'after',
            },
            {
              name: 'searchPanel',
              location: 'after',
            },
          ],
        }}
        dataMenus={loadMenus()}
        dataSource={handleHeightLight(data.after)}
        beforeSource={data.before}
      />
      {center}
    </>
  );
};

interface IProps {
  service: WorkFormService;
  node: model.WorkNodeModel;
  allowLabelPrint?: boolean;
  splitDetailFormId?: string;
  tabBarExtraContent?: TabBarExtraContent;
  instanceData?: model.InstanceDataModel;
}

const DetailForms: React.FC<IProps> = (props) => {
  if (props.node.detailForms.length < 1) return <></>;
  const [activeTabKey, setActiveTabKey] = useState(
    props.splitDetailFormId || props.node.detailForms[0].id,
  );
  const loadItems = () => {
    const items = [];
    const detailForms = props.splitDetailFormId
      ? props.node.detailForms.filter((i) => i.id === props.splitDetailFormId)
      : props.node.detailForms;
    for (const form of detailForms) {
      let info =
        props.node.forms.find((item) => item.id == form.id) ?? ({} as model.FormInfo);
      if (
        props.service.model.rules?.find(
          (a) => a.destId == form.id && a.typeName == 'visible' && !a.value,
        )
      ) {
        continue;
      }
      items.push({
        key: form.id,
        forceRender: true,
        label: form.name,
        children: (
          <DetailTable
            allowEdit={props.service.allowEdit}
            info={info}
            form={form}
            allowLabelPrint={props.allowLabelPrint}
            node={props.node}
            service={props.service}
            instanceData={props.instanceData}
          />
        ),
      });
    }
    return items;
  };
  return (
    <Tabs
      items={loadItems()}
      activeKey={activeTabKey}
      tabBarExtraContent={props.tabBarExtraContent}
      onChange={(key) => setActiveTabKey(key)}
    />
  );
};

export default DetailForms;

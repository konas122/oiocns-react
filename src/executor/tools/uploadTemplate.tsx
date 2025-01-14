import { command, kernel, model, schema } from '@/ts/base';
import { sleep } from '@/ts/base/common';
import { IBelong, IDirectory } from '@/ts/core';
import { formatDate } from '@/utils';
import * as el from '@/utils/excel';
import { tryParseJson } from '@/utils/tools';
import { ProTable } from '@ant-design/pro-components';
import { FullThingColumns } from '@/config/column';
import {
  Button,
  Modal,
  Progress,
  Space,
  Spin,
  Tabs,
  Upload,
  message,
  Select,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import { setDefaultField } from '@/ts/scripting/core/services/FormService';

/** 上传业务导入模板 */
export const uploadBusiness = (dir: IDirectory) => {
  initialize('业务模板', dir, el.getBusinessSheets(dir.target.directory));
};

/** 上传标准导入模板 */
export const uploadStandard = (dir: IDirectory) => {
  initialize('标准模板', dir, el.getStandardSheets(dir.target.directory));
};

export const initialize = (
  templateName: string,
  dir: IDirectory,
  sheets: el.ISheetHandler<any>[],
) => {
  dir = dir.target.directory;
  const excel = new el.Excel(dir.target.space, sheets);
  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    width: 610,
    title: '导入' + templateName,
    maskClosable: true,
    content: (
      <Progressing
        dir={dir}
        excel={excel}
        finished={() => {
          modal.destroy();
          openUploader(templateName, dir, excel);
        }}
      />
    ),
  });
};

interface ProgressingProps {
  dir: IDirectory;
  excel: el.IExcel;
  finished: () => void;
}

export const Progressing = ({ dir, excel, finished }: ProgressingProps) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    excel.context.initialize(dir, setProgress).then(async () => {
      await sleep(500);
      finished();
    });
  }, []);
  return (
    <div style={{ marginTop: 20 }}>
      <Progress percent={progress} showInfo={false} />
      <span>正在初始化数据中...</span>
    </div>
  );
};

export function openUploader(templateName: string, dir: IDirectory, excel: el.IExcel) {
  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    width: 610,
    title: '导入模板',
    maskClosable: true,
    content: (
      <Uploader
        templateName={templateName}
        excel={excel}
        finished={(file: File) => {
          modal.destroy();
          showData(
            excel,
            (modal) => {
              modal.destroy();
              generate(dir, file.name, excel);
            },
            '开始导入',
          );
        }}
      />
    ),
  });
}

interface IProps {
  templateName: string;
  excel: el.IExcel;
  fields?: model.FieldModel[];
  type?: string;
  belondId?: string;
  finished: (
    file: File,
    errors: el.Error[],
    conditions: ConditionsType,
    cardConditions: CardConditionsType,
  ) => void;
}

export type ConditionsType = 'allnew' | 'partnew';
export type CardConditionsType = 'allnew' | 'partnew';

export const Uploader: React.FC<IProps> = ({
  templateName,
  excel,
  finished,
  type,
  belondId,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectItem, setSelectItem] = useState<ConditionsType>('allnew');
  const [selectCardItem, setSelectCardItem] = useState<CardConditionsType>('allnew');
  return (
    <Space direction="vertical">
      <div
        style={{
          marginTop: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}>
        <Button onClick={async () => el.generateXlsx(excel, templateName)}>
          {templateName}下载
        </Button>
        {type && type === 'add' && (
          <div style={{ marginTop: '20px' }}>
            资产编号配置：
            <Select
              value={selectItem}
              style={{ width: 190 }}
              onChange={(e) => {
                setSelectItem(e);
              }}
              options={[
                { value: 'allnew', label: '全部采用新增资产编号' },
                { value: 'partnew', label: '仅新增资产编号空白项' },
              ]}
            />
          </div>
        )}
        {type && type === 'add' && (
          <div style={{ marginTop: '20px' }}>
            卡片编号配置：
            <Select
              value={selectCardItem}
              style={{ width: 190 }}
              onChange={(e) => {
                setSelectCardItem(e);
              }}
              options={[
                { value: 'allnew', label: '全部采用新增卡片编号' },
                { value: 'partnew', label: '仅新增卡片编号空白项' },
              ]}
            />
          </div>
        )}
      </div>
      <Spin spinning={loading}>
        <Upload
          type={'drag'}
          showUploadList={false}
          accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          style={{ width: 550, height: 300, marginTop: 20 }}
          customRequest={async (options) => {
            setLoading(true);
            let errors: el.Error[] = [];
            try {
              await el.readXlsx(options.file as Blob, excel, belondId);
            } catch (error: any) {
              errors = error;
            } finally {
              setLoading(false);
            }
            finished(options.file as File, errors, selectItem, selectCardItem);
          }}>
          <div style={{ color: 'limegreen', fontSize: 22 }}>点击或拖拽至此处上传</div>
        </Upload>
      </Spin>
    </Space>
  );
};

/** 展示数据 */
export const showData = (
  excel: el.IExcel,
  confirm: (modal: any) => void,
  okText: string,
) => {
  const modal = Modal.info({
    icon: <></>,
    okText: okText,
    onOk: () => confirm(modal),
    width: 1344,
    title: '数据',
    maskClosable: true,
    content: (
      <Tabs
        items={excel.handlers.map((item) => {
          return {
            label: item.sheet.name,
            key: item.sheet.name,
            children: (
              <ProTable
                key={item.sheet.name}
                dataSource={item.sheet.data}
                cardProps={{ bodyStyle: { padding: 0 } }}
                scroll={{ y: 400 }}
                options={false}
                search={false}
                columns={[
                  {
                    title: '序号',
                    valueType: 'index',
                    width: 50,
                  },
                  ...item.sheet.columns,
                ]}
              />
            ),
          };
        })}
      />
    ),
  });
};

/** 开始导入 */
const generate = async (dir: IDirectory, name: string, excel: el.IExcel) => {
  let errors = excel.handlers.flatMap((item) => item.checkData(excel));
  if (errors.length > 0) {
    showErrors(errors);
    return;
  }
  command.emitter('executor', 'taskList', dir);
  const task: model.TaskModel = {
    name: name,
    size: 0,
    finished: 0,
    createTime: new Date(),
  };
  dir.taskList.push(task);
  excel.dataHandler = {
    initialize: (totalRows) => {
      task.size = totalRows;
      dir.taskEmitter.changCallback();
    },
    onItemCompleted: () => {
      task.finished += 1;
      dir.taskEmitter.changCallback();
    },
    onCompleted: () => {
      task.finished = task.size;
      dir.taskEmitter.changCallback();
      message.success(`模板导入成功！`);
      showData(
        excel,
        (modal) => {
          modal.destroy();
          let fileName = `数据导入模板(${formatDate(new Date(), 'yyyy-MM-dd HH:mm')})`;
          el.generateXlsx(excel, fileName);
        },
        '生成数据模板',
      );
      const dirSheet = excel.handlers.find((item) => item.sheet.name == '目录');
      if (dirSheet) {
        dir.notify('reload', { ...dir.metadata, directoryId: dir.id });
      }
    },
    onReadError: (errors) => {
      showErrors(errors);
    },
  };
  excel.handling();
};

/** 错误数据 */
export const showErrors = (errors: el.Error[]) => {
  Modal.info({
    icon: <></>,
    okText: '关闭',
    width: 1000,
    title: '错误信息',
    maskClosable: true,
    content: (
      <ProTable
        dataSource={errors}
        cardProps={{ bodyStyle: { padding: 0 } }}
        scroll={{ y: 500 }}
        options={false}
        search={false}
        columns={[
          {
            title: '序号',
            valueType: 'index',
            width: 50,
          },
          {
            title: '表名',
            dataIndex: 'name',
          },
          {
            title: '行数',
            dataIndex: 'row',
            render: (_: any, data: el.Error) => {
              if (typeof data.row == 'number') {
                return <>{data.row}</>;
              }
              return <>{data.row.join(',')}</>;
            },
          },
          {
            title: '错误信息',
            dataIndex: 'message',
            width: 460,
          },
        ]}
      />
    ),
  });
};

export const generating = (
  belong: IBelong,
  formName: string,
  fields: model.FieldModel[],
  data: el.schema.XThing[],
  formData: model.FormEditData,
  finished: () => void,
  conditions: ConditionsType,
  cardconditions: CardConditionsType,
) => {
  const Progressing = () => {
    const counting = useRef(0);
    const [progress, setProgress] = useState(0);
    useEffect(() => {
      createThings(data, () => {
        counting.current += 1;
        setProgress((counting.current * 100) / data.length);
      }).then(() => {
        modal.destroy();
        finished();
      });
    }, []);
    return (
      <div style={{ marginTop: 20 }}>
        <Progress percent={progress} showInfo={false} />
        <span>正在生成数据中...</span>
      </div>
    );
  };
  const createThings = async (data: el.schema.XThing[], onAdd: () => void) => {
    const existIds = data.filter((item) => item.id).map((item) => item.id);
    const existThings: { [key: string]: el.schema.XThing } = {};
    if (existIds.length > 0) {
      const res = await kernel.loadThing(belong.id, belong.id, [belong.id], {
        options: { match: { id: { _in_: existIds } } },
      });
      if (res.success) {
        res.data.forEach((item) => {
          for (const field of fields) {
            item[field.id] = item[field.code];
          }
          existThings[item.id] = item;
        });
      }
    }
    const generatedNum = data.length - Object.keys(existThings).length;
    const generatedThing = await kernel.createThing(
      belong.id,
      [belong.id],
      formName,
      generatedNum,
    );
    let offset = 0;
    for (const item of data) {
      let merge: el.schema.XThing;
      if (existThings[item.id]) {
        merge = { ...existThings[item.id], ...item };
      } else {
        merge = { ...item, ...generatedThing.data[offset] };
        await setDefaultField(merge, fields, belong, conditions, cardconditions);
        offset += 1;
      }
      formData.before.push(merge);
      formData.after.push(merge);
      onAdd();
    }
  };
  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    width: 610,
    title: '导入数据中',
    maskClosable: true,
    content: <Progressing />,
  });
};

// 导入匹配
export const matching = (
  belong: IBelong,
  form: schema.XForm,
  data: el.schema.XThing[],
  formData: model.FormEditData,
  fieldsData: model.FieldModel[],
  finished: () => void,
  type: 'match' | 'matchChange' = 'match',
) => {
  let matched: number = 0;
  const Progressing = () => {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
      if (data.length > 0) {
        loadThings().then((result) => {
          importData(result, matched, setProgress);
          modal.destroy();
          finished();
        });
      } else {
        message.error('数据格式不正确');
        modal.destroy();
      }
    }, []);
    return (
      <div style={{ marginTop: 20 }}>
        <Progress percent={progress} showInfo={false} />
        <span>数据导入中...</span>
      </div>
    );
  };
  /** 加载数据 */
  const loadThings = async () => {
    const assetNumberField = fieldsData.find((i) => i.name === form.matchImport || '');
    const assetNumberCodes = data.map((item) => item[assetNumberField?.code!]);
    const classifyExp = tryParseJson(form.options?.dataRange?.classifyExp);
    const filterExp = tryParseJson(form.options?.dataRange?.filterExp);
    let resultData: schema.XForm[] = [];
    const loadOptions: any = {};
    loadOptions.userData = [];
    loadOptions.options = {
      match: {
        ...(classifyExp || {}),
        [assetNumberField?.code as string]: {
          _in_: assetNumberCodes.filter(Boolean),
        },
        isDeleted: false,
      },
    };
    if (filterExp) {
      loadOptions.filter = filterExp;
    }
    const formColl = belong.resource.genColl<schema.XForm>(
      form.collName ?? '_system-things',
    );
    const res = await formColl.loadResult(loadOptions);
    if (res.success && !Array.isArray(res.data)) {
      res.data = [];
    }
    const deepCloneData = _.cloneDeep(res.data);
    if (type === 'matchChange') {
      const changeData = analysisData(data) as el.schema.XThing[];
      const fields = FullThingColumns(fieldsData);
      for (const item of deepCloneData) {
        const newData: any = {};
        fields.forEach((c) => {
          if (item[c.code]) {
            newData[c.id] = item[c.code];
          }
        });
        if (formData.before.every((i) => i.id !== newData.id)) {
          formData.before.unshift({ ...newData });
        }
      }
      const result = modifyData(res.data, changeData, assetNumberField);
      resultData = result;
    } else {
      resultData = res.data;
    }
    return resultData;
  };
  /** 数据导入 */
  const importData = (
    matchData: schema.XForm[],
    matched: number,
    setProgress: (num: number) => void,
  ) => {
    const fields = FullThingColumns(fieldsData);
    for (const item of matchData) {
      const newData: any = {};
      fields.forEach((c) => {
        if (item[c.code]) {
          newData[c.id] = item[c.code];
        }
      });
      matched++;
      setProgress((matched / data.length) * 100);
      if (formData.after.every((i) => i.id !== newData.id)) {
        formData.after.unshift(newData);
      }
    }
  };

  // 解析数据过滤
  const analysisData = (data: el.schema.XThing[]) => {
    return data.map((item) => {
      const { labels, ...rest } = item;
      return rest;
    });
  };

  // 变更字段
  const modifyData = (
    data: schema.XForm[],
    changeData: el.schema.XThing[],
    assetNumberField: model.FieldModel | undefined,
  ) => {
    return data.map((item) => {
      const curItem = changeData.find(
        (i) => i[assetNumberField!.code] === item[assetNumberField!.code],
      );
      if (curItem) {
        return {
          ...item,
          ...curItem,
        };
      }
      return item;
    });
  };

  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    width: 610,
    title: '导入数据中',
    maskClosable: true,
    content: <Progressing />,
  });
};

// 直接导入
export const directImport = (
  data: el.schema.XThing[],
  formData: model.FormEditData,
  finished: () => void,
) => {
  const Progressing = () => {
    const counting = useRef(0);
    const [progress, setProgress] = useState(0);
    useEffect(() => {
      importData(data, () => {
        counting.current += 1;
        setProgress((counting.current * 100) / data.length);
      }).then(() => {
        modal.destroy();
        finished();
      });
    }, []);
    return (
      <div style={{ marginTop: 20 }}>
        <Progress percent={progress} showInfo={false} />
        <span>正在生成数据中...</span>
      </div>
    );
  };
  const importData = async (data: el.schema.XThing[], onAdd: () => void) => {
    if (data.length > 0) {
      formData.before.push(...data);
      formData.after.push(...data);
      onAdd();
    }
  };
  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    width: 610,
    title: '导入数据中',
    maskClosable: true,
    content: <Progressing />,
  });
};

// 插入台账数据
export const insertData = (
  belong: IBelong,
  fieldsData: model.FieldModel[],
  data: el.schema.XThing[],
  formData: model.FormEditData,
  finished: () => void,
) => {
  let matched: number = 0;
  const Progressing = () => {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
      if (data.length > 0) {
        loadThings().then((result) => {
          for (const _item of result) {
            matched++;
            setProgress((matched * 100) / result.length);
          }
          modal.destroy();
          finished();
        });
      } else {
        message.error('数据格式不正确');
        modal.destroy();
      }
    }, []);
    return (
      <div style={{ marginTop: 20 }}>
        <Progress percent={progress} showInfo={false} />
        <span>数据导入中...</span>
      </div>
    );
  };
  // 合并数据
  const mergeData = (data: schema.XForm[], changeData: el.schema.XThing[]) => {
    return data.map((item) => {
      const curItem = changeData.find((i) => i['id'] === item['id']);
      if (curItem) {
        return {
          ...item,
          ...curItem,
        };
      }
      return item;
    });
  };
  /** 加载数据 */
  const loadThings = async () => {
    let resultData: schema.XForm[] = [];
    const loadOptions: any = {};
    loadOptions.userData = [];
    loadOptions.options = {
      match: {
        id: { _in_: data.map((item) => item.id) },
        isDeleted: false,
      },
    };
    const formColl = belong.resource.genColl<schema.XForm>('_system-things');
    const res = await formColl.loadResult(loadOptions);
    if (res.success && !Array.isArray(res.data)) {
      res.data = [];
    }
    const deepCloneData = _.cloneDeep(res.data);
    const fields = FullThingColumns(fieldsData);
    for (const item of deepCloneData) {
      const newData: any = {};
      fields.forEach((c) => {
        if (item[c.code]) {
          newData[c.id] = item[c.code];
        }
      });
      if (formData.after.every((i) => i.id !== newData.id)) {
        formData.after.unshift({ ...newData });
      }
    }
    const result = mergeData(res.data, data);
    resultData = result;
    return resultData;
  };
  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    width: 610,
    title: '导入数据中',
    maskClosable: true,
    content: <Progressing />,
  });
};

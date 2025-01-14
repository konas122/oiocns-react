import orgCtrl from '@/ts/controller';
import { Borders, Workbook, Worksheet } from 'exceljs';
import { MemberFilter, departmentTypes } from '@/ts/core/public/consts';
import { ITarget } from '@/ts/core';
import saveAs from 'file-saver';
import moment from 'moment';
import * as i from '../impl';
import * as t from '../type';
import { DirContext } from './context';

/**
 * 生成一份 Excel 文件
 * @param excel 表格信息
 * @param filename 文件信息
 */
export const generateXlsx = async (excel: t.IExcel, filename: string) => {
  try {
    let workbook = new Workbook();
    for (let sheet of excel.handlers.map((item) => item.sheet)) {
      const worksheet = workbook.addWorksheet(sheet.name);
      const headers = sheet.getHeaders();
      worksheet.addRows(headers);
      if (sheet.extract) {
        await sheet.stream((data) => worksheet.addRows(data));
      } else {
        worksheet.addRows(sheet.getRows(sheet.data));
      }
      // sheet.getMerges().forEach((item) => worksheet.mergeCells(item));
      // 合并单元格前去重，以避免重复合并
      const merges = Array.from(new Set(sheet.getMerges()));
      merges.forEach((mergeRange) => {
        try {
          worksheet.mergeCells(mergeRange);
        } catch (error) {
          console.warn(`Failed to merge cells ${mergeRange}: ${error}`);
        }
      });
      sheet.append?.(worksheet);
      setStyle(worksheet, sheet, headers);
    }
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), filename + '.xlsx');
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

/**
 * 设置 Excel 样式
 * @param workSheet 工作簿
 * @param headers 表头
 */
const setStyle = (workSheet: Worksheet, sheet: i.BaseSheet, headers: string[][]) => {
  const leaves = sheet.recursionColumn(sheet.columns);
  const borders: Partial<Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };
  for (let i = 1; i <= headers.length; i++) {
    workSheet.getRow(i).eachCell((cell, index) => {
      cell.font = { bold: true, size: 16 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      cell.border = borders;
      const column = leaves[index - 1];
      if (column.options?.isRequired) {
        cell.font = { ...cell.font, color: { argb: 'FFFF0000' } };
      }
    });
  }
  for (let i = headers.length + 1; i <= workSheet.rowCount; i++) {
    workSheet.getRow(i).eachCell((cell, index) => {
      const column = leaves[index - 1];
      cell.font = { size: 12 };
      cell.alignment = { horizontal: column.style?.align ?? 'left', vertical: 'middle' };
      cell.border = borders;
    });
  }
  for (let i = 1; i <= leaves.length; i++) {
    const column = leaves[i - 1];
    workSheet.getColumn(i).width = column.style?.width ?? 30;
  }
};

/**
 * 收集 Excel 数据
 */
export const readXlsx = (
  file: Blob,
  excel: t.IExcel,
  belongId?: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = async (e) => {
      const errors: t.Error[] = [];
      try {
        const workbook = new Workbook();
        await workbook.xlsx.load(e.target?.result as ArrayBuffer);

        for (const sheet of workbook.worksheets) {
          for await (let error of collecting(sheet, excel, belongId)) {
            errors.push(error);
          }
        }
        if (errors.length == 0) {
          resolve();
        } else {
          reject(errors);
        }
      } catch (error) {
        console.error('read xlsx errors: ', error);
        reject([
          {
            name: '',
            message: error instanceof Error ? error.message : String(error),
            row: [],
          },
        ] as t.Error[]);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 数据收集，将中文名称转换为英文名称
 */
export async function* collecting(
  worksheet: Worksheet,
  excel: t.IExcel,
  belondId?: string,
): AsyncGenerator<t.Error> {
  const space = orgCtrl.user.companys.find((item) => item.id == excel.space.id);
  const personCache = new Map();
  const companyCache = new Map();
  const groupCache = new Map();
  const cohortCache = new Map();

  function onError(handler: t.ISheetHandler<any>, e: t.Error, data: any): t.Error {
    if (handler.onError) {
      e = handler.onError(e, data);
    }
    return e;
  }

  for (let handler of excel.handlers) {
    let sheet = handler.sheet;

    if (sheet.name == worksheet.name) {
      let converted: any[] = [];
      const header = worksheet.getRow(1);
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const rowData: any = {};
        header.eachCell((cell, colNumber) => {
          if (cell.value) {
            rowData[cell.value.toString()] = row.getCell(colNumber).text;
          }
        });
        if (Object.values(rowData).some((item) => item)) {
          converted.push(rowData);
        }
      }
      let ansData: any[] = [];
      for (let index = 0; index < converted.length; index++) {
        let row = converted[index];
        let ansItem: any = { labels: [] };
        for (const column of sheet.columns) {
          let value = row[column.title];
          if (column.options?.isRequired) {
            if (!value && value !== 0) {
              yield onError(
                handler,
                {
                  name: sheet.name,
                  row: index + 2,
                  message: column.title + '必填项不能为空',
                },
                row,
              );
              continue;
            }
          }
          if (value || value === 0) {
            switch (column.valueType) {
              case '选择型':
              case '分类型':
                if (column.lookups) {
                  const map: Map<String, t.model.FiledLookup> = new Map();
                  column.lookups.forEach((item) => map.set(item.id, item));
                  for (const item of column.lookups) {
                    if (item.text == value) {
                      ansItem[column.dataIndex] = item.value;
                      ansItem.labels.push(item.value);
                      let temp = item;
                      while (temp.parentId && map.has(temp.parentId)) {
                        const parent = map.get(temp.parentId)!;
                        ansItem.labels.push(parent.value);
                        temp = map.get(temp.parentId)!;
                      }
                      break;
                    }
                  }
                  if (!ansItem[column.dataIndex]) {
                    yield onError(
                      handler,
                      {
                        name: sheet.name,
                        row: index + 2,
                        message:
                          column.title +
                          `找不到 ${column.valueType == '分类型' ? '分类项' : '字典项'}` +
                          value,
                      },
                      row,
                    );
                    continue;
                  }
                }
                break;
              case '日期型':
              case '时间型': {
                let result: Date;
                switch (typeof value) {
                  case 'object':
                    if (value instanceof Date) {
                      result = value;
                      break;
                    }
                    continue;
                  case 'string':
                    try {
                      const converted = moment(value);
                      if (converted.isValid()) {
                        result = converted.toDate();
                        break;
                      }
                      continue;
                    } catch (e) {
                      continue;
                    }
                  default:
                    continue;
                }
                if (column.valueType == '日期型') {
                  ansItem[column.dataIndex] = moment(result, 'YYYY-MM-DD');
                } else {
                  ansItem[column.dataIndex] = moment(result, 'YYYY-MM-DD HH:mm:ss');
                }
                break;
              }
              case '数值型':
              case '货币型':
                ansItem[column.dataIndex] = Number(value);
                break;
              case '用户型':
                switch (column.widget ?? '人员搜索框') {
                  case '操作人':
                    ansItem[column.dataIndex] = excel.space.userId;
                    break;
                  case '操作组织':
                    ansItem[column.dataIndex] = excel.space.id;
                    break;
                  case '成员选择框': {
                    let target: ITarget | undefined = undefined;
                    if (column.options?.teamId === MemberFilter.id) {
                      target = orgCtrl.targets.find((i) => i.id === belondId);
                    } else {
                      target = orgCtrl.targets.find(
                        (i) => i.id === column.options?.teamId,
                      );
                    }

                    let result: t.schema.XTarget | undefined = undefined;
                    if (target && target?.members.length > 0) {
                      result = target?.members.find(
                        (item) => item.code == value || item.name == value,
                      );
                    } else {
                      const res = await target?.loadMembers();
                      result = res?.find(
                        (item) => item.code == value || item.name == value,
                      );
                    }
                    if (result) {
                      ansItem[column.dataIndex] = result.id;
                    } else {
                      yield onError(
                        handler,
                        {
                          name: sheet.name,
                          row: index + 2,
                          message: column.title + '找不到成员 ' + value,
                        },
                        row,
                      );
                      continue;
                    }
                    break;
                  }
                  case '内部机构选择框':
                    if (space) {
                      const result = space.targets.filter(
                        (target) =>
                          departmentTypes.indexOf(target.typeName as t.TargetType) > -1,
                      );
                      const find = result.find(
                        (item) => item.code == value || item.name == value,
                      );
                      if (find) {
                        ansItem[column.dataIndex] = find.id;
                      } else {
                        yield onError(
                          handler,
                          {
                            name: sheet.name,
                            row: index + 2,
                            message: column.title + '找不到部门 ' + value,
                          },
                          row,
                        );
                        continue;
                      }
                      continue;
                    }
                    break;
                  case '人员搜索框': {
                    const types = [t.TargetType.Person];
                    const result = await loadTargetId(personCache, types, value);
                    if (result) {
                      ansItem[column.dataIndex] = result;
                    } else {
                      yield onError(
                        handler,
                        {
                          name: sheet.name,
                          row: index + 2,
                          message: column.title + '找不到用户 ' + value,
                        },
                        row,
                      );
                      continue;
                    }
                    break;
                  }
                  case '单位搜索框': {
                    const types = [t.TargetType.Company];
                    const result = await loadTargetId(companyCache, types, value);
                    if (result) {
                      ansItem[column.dataIndex] = result;
                    } else {
                      yield onError(
                        handler,
                        {
                          name: sheet.name,
                          row: index + 2,
                          message: column.title + '找不到单位 ' + value,
                        },
                        row,
                      );
                      continue;
                    }
                    break;
                  }
                  case '组织群搜索框': {
                    const types = [t.TargetType.Group];
                    const result = await loadTargetId(groupCache, types, value);
                    if (result) {
                      ansItem[column.dataIndex] = result;
                    } else {
                      yield onError(
                        handler,
                        {
                          name: sheet.name,
                          row: index + 2,
                          message: column.title + '找不到组织群 ' + value,
                        },
                        row,
                      );
                      continue;
                    }
                    break;
                  }
                  case '群组搜索框': {
                    const types = [t.TargetType.Cohort];
                    const result = await loadTargetId(cohortCache, types, value);
                    if (result) {
                      ansItem[column.dataIndex] = result;
                    } else {
                      yield onError(
                        handler,
                        {
                          name: sheet.name,
                          row: index + 2,
                          message: column.title + '找不到群聊 ' + value,
                        },
                        row,
                      );
                      continue;
                    }
                    break;
                  }
                }
                break;
              case '描述型':
                ansItem[column.dataIndex] = String(value);
                break;
            }
          }
        }
        ansData.push(ansItem);
      }
      sheet.data = ansData;
    }
  }
}

const loadTargetId = async (
  cache: Map<string, t.schema.XTarget | undefined>,
  types: t.TargetType[],
  value: string,
): Promise<string | undefined> => {
  if (!cache.has(value)) {
    const target = await orgCtrl.user.searchTargets(value.toString(), types);
    if (target.length > 0) {
      cache.set(value, target[0]);
    } else {
      cache.set(value, undefined);
    }
  }
  return cache.get(value)?.id;
};

export class Excel implements t.IExcel {
  handlers: t.ISheetHandler<i.BaseSheet<any>>[];
  dataHandler?: t.DataHandler;
  context: t.Context;
  space: t.IBelong;

  constructor(
    space: t.IBelong,
    sheets?: t.ISheetHandler<i.BaseSheet<any>>[],
    handler?: t.DataHandler,
  ) {
    this.space = space;
    this.handlers = [];
    this.dataHandler = handler;
    this.context = new DirContext();
    sheets?.forEach((item) => this.appendHandler(item));
  }

  getHandler(name: string) {
    return this.handlers.filter((item) => item.sheet.name == name)[0];
  }

  appendHandler(handler: t.ISheetHandler<any>): void {
    const judge = (item: any) => item.sheet.name == handler.sheet.name;
    const index = this.handlers.findIndex(judge);
    if (index == -1) {
      this.handlers.push(handler);
    } else {
      this.handlers[index] = handler;
    }
  }

  async handling(): Promise<void> {
    try {
      let totalRows = this.handlers
        .map((item) => item.sheet)
        .map((item) => item.data.length)
        .reduce((f, s) => f + s);
      this.dataHandler?.initialize?.(totalRows);

      for (const handler of this.handlers) {
        await handler.operating(this, () => this.dataHandler?.onItemCompleted?.());
        handler.completed?.(this);
      }
      this.dataHandler?.onCompleted?.();
    } catch (error: any) {
      this.dataHandler?.onError?.('数据处理异常');
    }
  }
}

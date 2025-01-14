import * as el from '@/utils/excel';
import { TargetType, IDepartment, ITeam, ICompany, departmentTypes } from '@/ts/core';
import { Modal, message } from 'antd';
import { Uploader, showErrors, showData } from '@/executor/tools/uploadTemplate';
import React from 'react';
import { TargetModel } from '@/ts/base/model';
interface INewBathDepartment {
  name: string;
  id: string;
  valueType: string;
  options: {
    isRequired: boolean;
  };
}

interface IExcelData extends TargetModel {
  parentCode: string;
  typeName: TargetType;
}

const values: INewBathDepartment[] = [
  {
    name: '父级代码',
    id: 'parentCode',
    valueType: '描述型',
    options: {
      isRequired: false,
    },
  },
  {
    name: '名称',
    id: 'name',
    valueType: '描述型',
    options: {
      isRequired: true,
    },
  },
  {
    name: '代码',
    id: 'code',
    valueType: '描述型',
    options: {
      isRequired: true,
    },
  },
  {
    name: '简介',
    id: 'remark',
    valueType: '描述型',
    options: {
      isRequired: true,
    },
  },
  {
    name: '类型',
    id: 'typeName',
    valueType: '描述型',
    options: {
      isRequired: true,
    },
  },
];

const name = '批量设立部门';

// 处理部门数据
const getDepartmentData = (excelData: IExcelData[]) => {
  let data = {} as any;
  excelData.forEach((item: IExcelData) => {
    if (data && data[item.parentCode]) {
      data[item.parentCode].push(item);
    } else {
      data = {
        ...data,
        [item.parentCode]: [item],
      };
    }
  });

  const dataAtExcel = new Map<string, IExcelData[]>();
  const dataNoAtExcel = new Map<string, IExcelData[]>();
  excelData.forEach((item: IExcelData) => {
    if (data[item.code]) {
      dataAtExcel.set(item.code, data[item.code]);
      dataNoAtExcel.set(item.parentCode, data[item.parentCode]);
    } else if (!dataAtExcel.get(item.parentCode)) {
      dataNoAtExcel.set(item.parentCode, data[item.parentCode]);
    }
  });
  return { dataAtExcel, dataNoAtExcel };
};

// 获取当前点击下的部门列表
const getDepartments = (departments: IDepartment[]) => {
  const data: IDepartment[] = [];
  if (departments) {
    departments.forEach((item) => {
      if (item.children.length) {
        data.push(...getDepartments(item.children));
      }
      data.push(item);
    });
  }
  return data;
};

// 通过父code找到对应的current
const getCurrentDepartment = (departments: IDepartment[], parentCode: string) => {
  const target = getDepartments(departments).filter((item) => {
    return item.code === parentCode;
  });
  return target[0];
};

export const BathNewDepartment = (current: ICompany) => {
  openUploader(
    current,
    el.getAnythingSheets(
      {
        id: current.belongId,
        name,
      } as any,
      values as any,
      'id',
    ),
  );
};
const openUploader = (current: ICompany, sheets: el.ISheetHandler<any>[]) => {
  const excel = new el.Excel(current as any, sheets);
  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    width: 610,
    className: 'uploader-model',
    title: name + '导入',
    maskClosable: true,
    content: (
      <Uploader
        templateName={name}
        excel={excel}
        finished={(_) => {
          modal.destroy();
          showData(
            excel,
            (modal) => {
              modal.destroy();
              generate(current, excel);
            },
            '开始导入',
          );
        }}
      />
    ),
  });
};

const generate = (current: ICompany, excel: el.IExcel) => {
  checkData(current, excel);
};

const checkData = (current: ICompany, excel: el.IExcel) => {
  let errors: el.Error[] = [];
  let currentCreateDepartment: ITeam | undefined;
  const data: IExcelData[] = excel.handlers[0].sheet.data;
  const { dataAtExcel } = getDepartmentData(data);
  const uploadData = [];
  data.forEach(async (item, index: number) => {
    // 判断是否已存在相同数据
    let isExist = false;
    if (!item.name) {
      errors.push({ row: index + 2, name, message: '名称不能为空！' });
    }
    if (!item.code) {
      errors.push({ row: index + 2, name, message: '代码不能为空！' });
    }
    if (!item.remark) {
      errors.push({ row: index + 2, name, message: '简介不能为空！' });
    }
    if (!item.typeName) {
      errors.push({ row: index + 2, name, message: '类型不能为空！' });
    }
    if (!departmentTypes.includes(item.typeName)) {
      errors.push({ row: index + 2, name, message: '公司类型错误！' });
    }
    const existDepartment = getCurrentDepartment(current.departments, item.code);
    if (existDepartment) {
      isExist =
        existDepartment.metadata.code === item.code &&
        existDepartment.metadata.name === item.name;
    }
    if (isExist) {
      errors.push({ row: index + 2, name, message: '代码不允许重复' });
    }
    if (item.parentCode) {
      const currentDepartment = getCurrentDepartment(
        current.departments,
        item.parentCode,
      );
      if (!(dataAtExcel.get(item.parentCode) || currentDepartment)) {
        errors.push({ row: index + 2, name, message: '父级代码不存在' });
      } else if (currentDepartment && !isExist) {
        uploadData.push(item);
        currentCreateDepartment = await currentDepartment.createTarget(item);
      }
    }
    if (
      item.name &&
      item.code &&
      item.remark &&
      item.typeName &&
      !item.parentCode &&
      !isExist
    ) {
      uploadData.push(item);
      currentCreateDepartment = await current.createTarget(item);
    }
    // 处理父级code是在表格还未创建的情况
    const atExcelData = dataAtExcel.get(item.code);
    if (atExcelData && !isExist) {
      atExcelData.forEach((Data) => {
        uploadData.push(item);
        currentCreateDepartment &&
          (currentCreateDepartment as IDepartment).createTarget(Data);
      });
    }
  });
  if (uploadData.length) {
    message.success(!errors.length ? '批量上传部门成功' : '批量上传部门部分成功');
  }
  if (errors.length) {
    showErrors(errors);
  }
};
import { CellSettings } from 'handsontable/settings';
import { CellInfo, ReportSettingInfo, XFloatRowsInfo } from '../types';
import { kernel, model, schema } from '@/ts/base';
import Handsontable from 'handsontable';
import { textRenderer } from 'handsontable/renderers';
import { NodeType } from '@/ts/base/enum';
import { getWidget } from '../../WorkForm/Utils';
import { orgAuth, IForm } from '@/ts/core';
import { XAttribute } from '@/ts/base/schema';

/** 数字转字母 */
export const numberToLetters = (number: any) => {
  let result = '';
  while (number > 0) {
    number--; // 调整偏移
    let remainder = number % 26;
    let letter = String.fromCharCode(65 + remainder);
    result = letter + result;
    number = Math.floor(number / 26);
  }
  return result;
};

/** 解析坐标 */
export const parseCoordinate = (str: any) => {
  let columnLetters = str.match(/[A-Z]+/)[0];
  let rowNumber = Number(str.match(/\d+/)[0]);
  let columnNumber = 0;
  for (let i = 0; i < columnLetters.length; i++) {
    columnNumber *= 26;
    columnNumber += columnLetters.charCodeAt(i) - 'A'.charCodeAt(0);
  }
  return [columnNumber, rowNumber - 1];
};

export const parseRanges = (ranges: string[]) => {
  const result: any[] = [];

  ranges.forEach((range) => {
    const [startCell, endCell] = range.split(':');
    const [startCol, startRow] = startCell.split('');
    const [endCol, endRow] = endCell.split('');
    const startColNum = getColumnNumber(startCol);
    const endColNum = getColumnNumber(endCol);
    const colspan = endColNum - startColNum + 1;
    const rowspan =
      parseInt(startRow, 10) === parseInt(endRow, 10)
        ? 1
        : Number(parseInt(endRow, 10)) - Number(parseInt(startRow, 10));
    result.push({
      row: Number(parseInt(startRow, 10)) - 1,
      col: startColNum - 1,
      rowspan: rowspan,
      colspan: colspan,
    });
  });

  return result;
};

const getColumnNumber = (colStr: any) => {
  let result = 0;
  for (let i = 0; i < colStr.length; i++) {
    result = result * 26 + (colStr.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return result;
};

export const convertARGBToCSSColor = (argb: string, includeAlpha = false) => {
  if (typeof argb !== 'string' || argb.length !== 8) {
    throw new Error('Invalid ARGB format. Expected a string of length 8.');
  }

  const alpha = parseInt(argb.substring(0, 2), 16) / 255;
  const rgbHex = argb.substring(2);
  const rgbColorHex = '#' + rgbHex;
  if (includeAlpha) {
    return `rgba(${parseInt(rgbHex.substring(0, 2), 16)}, ${parseInt(
      rgbHex.substring(2, 4),
      16,
    )}, ${parseInt(rgbHex.substring(4, 6), 16)}, ${alpha.toFixed(2)})`;
  } else {
    return rgbColorHex;
  }
};

export const capitalizeFirstLetter = (string: string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const converBorder = (border: any) => {
  let borderCss: any = {};
  ['right', 'bottom', 'top', 'left'].forEach((side) => {
    if (border[side]) {
      let style =
        border[side].style === 'thin'
          ? '.5px solid'
          : border[side].style === 'thick'
          ? '2px solid'
          : 'solid';
      let color = border[side].color
        ? convertARGBToCSSColor(border[side].color.argb)
        : '#000';
      const newSide = capitalizeFirstLetter(side);
      borderCss[`border${newSide}`] = `${style} ${color}`;
    }
  });

  return borderCss;
};

// 根据选中区域获取坐标
export const getRanges = (range: any) => {
  let cellsRanges: any[] = [];
  for (let y = range.yMin; y <= range.yMax; y++) {
    for (let x = range.xMin; x <= range.xMax; x++) {
      cellsRanges.push([x, y]);
    }
  }
  return cellsRanges;
};

// 判断坐标是否属于该区域
export const isPointInRange = (point: any, range: any) => {
  const { row: x, col: y } = point;
  return x >= range.xMin && x <= range.xMax && y >= range.yMin && y <= range.yMax;
};

// 获取选中单元格区域
export const getSelected = (selected: number[] | undefined) => {
  if (!selected) {
    return {
      xMin: 0,
      yMin: 0,
      xMax: 0,
      yMax: 0,
      unselected: true,
    };
  }
  /** 因为会从不同的方向选择，需要重新排序 */
  const xMin = Math.min(selected[0], selected[2]);
  const xMax = Math.max(selected[0], selected[2]);
  const yMin = Math.min(selected[1], selected[3]);
  const yMax = Math.max(selected[1], selected[3]);
  return {
    xMin,
    xMax,
    yMin,
    yMax,
  };
};

const getCellSetting = (cells: CellSettings[], row: number, col: number) => {
  let cell = cells.find((c) => c.col == col && c.row == row);
  if (!cell) {
    cell = { col, row };
  }
  return cell;
};

const setData = (data: any[][], row: number, col: number, value: any) => {
  if (!data[row]) {
    data[row] = [];
  }
  return (data[row][col] = value);
};

export const updataCells = (
  setting: ReportSettingInfo,
  data: any[][],
  attrMap: Dictionary<schema.XAttribute>,
  fields: model.FieldModel[],
  readonly: boolean | undefined,
  reportStatus: model.ReceptionContentBase<model.TaskContentType> | null,
) => {
  const cells: CellSettings[] = [];
  const styleList: any[] = setting?.styleList || [];
  const classList: any[] = setting?.classList || [];

  styleList.forEach((item: any) => {
    const cell = getCellSetting(cells, item.row, item.col);
    cell.renderer = (
      instance: Handsontable.Core,
      TD: HTMLTableCellElement,
      row: number,
      col: number,
      prop: string | number,
      value: any,
      cellProperties: Handsontable.CellProperties,
    ) => {
      textRenderer(instance, TD, row, col, prop, value, cellProperties);
      const items = setting.styleList.find((it: any) => it.row === row && it.col === col);
      if (items) {
        for (let key in items.styles) {
          if (key === 'paddingLeft') {
            TD.style[key] = items.styles[key] + 'px';
          } else {
            TD.style[key as any] = items.styles[key];
          }
        }
      }
    };
    cells.push(cell);
  });
  classList.forEach((item: any) => {
    const cell = getCellSetting(cells, item.row, item.col);
    cells.push(cell);
    let arr = [];
    for (let k in item.class) {
      arr.push(item.class[k]);
    }
    cell.className = arr.join(' ');
  });

  const isSummary = reportStatus?.treeNode.nodeType == NodeType.Summary;

  setting.cells?.forEach((item: CellInfo) => {
    const cell = getCellSetting(cells, item.row, item.col);
    cells.push(cell);
    const prop = attrMap[item.prop.id];

    if (!readonly) {
      cell.readOnly = prop.options?.readOnly;
    }
    cell.renderer = 'customStylesRenderer';
    if ((prop.rule && JSON.parse(prop.rule).id) || prop.options?.isComputed) {
      cell.renderType = 'computed';
    } else {
      cell.renderType = 'input';
    }
    switch (getWidget(prop.valueType, prop.widget)) {
      case '数字框':
        cell.type = 'numeric';
        cell.numericFormat = {
          pattern: {
            // 传undefined也会报错，逆天
            // mantissa: prop.options?.accuracy,
            thousandSeparated: true,
          },
          culture: 'zh-CN',
        };
        if (typeof prop.options?.accuracy === 'number') {
          (cell.numericFormat.pattern as any).mantissa = prop.options?.accuracy;
        }
    }
    fields.forEach((field) => {
      if (prop.id === field.id) {
        if (field.options!.readOnly && readonly) {
          cell.readOnly = true;
        } else if (!field.options?.readOnly && readonly) {
          cell.readOnly = true;
        }
        if (field.options!.defaultValue) {
          if (field.lookups!.length > 0) {
            const items = field.lookups!.find(
              (it: any) => it.value === field.options!.defaultValue,
            );
            data = setData(data, item.row, item.col, items?.text);
          } else {
            data = setData(data, item.row, item.col, field.options!.defaultValue);
          }
        }

        if (isSummary && field.options?.isSummary) {
          cell.readOnly = true;
          cell.className = 'is-readonly';
        }
      }
    });

    cells.push(cell);
  });

  return {
    cells: cells,
    data: data,
  };
};

function isAllDigits(str: string) {
  return /^\d+$/.test(str);
}

export const refreshFormData = async (
  formData: model.FormEditData | undefined,
  attrMap: Dictionary<schema.XAttribute>,
  cellList: CellInfo[],
  type: string,
) => {
  const data: [number, number, any][] = [];
  if (formData?.after) {
    for (let key in formData.after[0]) {
      for (let item of cellList) {
        let value = formData?.after[0][key];
        let pass = false;
        if (key === item.prop?.propId) {
          pass = true;
        } else if (key.includes('.')) {
          const [leftPart, rightPart] = key.split('.');
          if (leftPart === type) {
            const coords = rightPart.split(',').map((v) => parseInt(v));
            if (coords[0] == item.row && coords[1] == item.col) {
              pass = true;
            }
          }
        } else if (key.includes(',') && type === 'primary') {
          const coords = key.split(',').map((v) => parseInt(v));
          if (coords[0] == item.row && coords[1] == item.col) {
            pass = true;
          }
        }
        if (pass) {
          const prop = attrMap[item.prop.id];
          switch (getWidget(prop.valueType, prop.widget)) {
            case '操作人':
            case '操作组织':
              if (value) {
                if (isAllDigits(value)) {
                  let result = await kernel.queryEntityById({ id: value });
                  if (result.success && result.data) {
                    value = result.data.name;
                  }
                }
              }
              break;
          }
          data.push([item.row, item.col, value]);
        }
      }
    }
  }

  return data;
};

export const isSelectWidget = (widgetType: string): boolean => {
  const specificWidgets = [
    '选择框',
    '单选框',
    '引用选择框',
    '多级选择框',
    '人员搜索框',
    '单位搜索框',
    '群组搜索框',
    '组织群搜索框',
    '成员选择框',
    '内部机构选择框',
    '日期选择框',
    '时间选择框',
  ];
  return specificWidgets.includes(widgetType);
};

export const generateProperties = async (
  metaForm: IForm,
  floatSetting: XFloatRowsInfo,
  tempCells: any[],
  subDataLength?: number,
) => {
  let arrs: any[] = [];
  let subData: any[] = [];
  let cells: any[] = [...tempCells];
  let dataLength = subDataLength || 0;
  for (let i = 0; i < 10; i++) {
    let rowData: any[] = [];
    for (let k = 0; k < floatSetting.rowsInfo.length; k++) {
      if (floatSetting.rowsInfo[k].isLineNumber) {
        rowData.push(i + dataLength + 1);
      } else {
        rowData.push(undefined);
      }
    }
    subData.push(rowData);
  }
  const fields = await metaForm.loadFields();

  return {
    arrs: arrs,
    subData: subData,
    cells: cells,
    fields: fields || [],
  };
};

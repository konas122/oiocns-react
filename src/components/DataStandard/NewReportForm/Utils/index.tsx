import { CellSettings } from 'handsontable/settings';
import { kernel, model } from '@/ts/base';
import Handsontable from 'handsontable';
import { textRenderer } from 'handsontable/renderers';
import { getWidget } from '../../WorkForm/Utils';
import { XCells, XFloatRowsInfo, XSheet, XSheetCells } from '@/ts/base/schema';
import { IBelong } from '@/ts/core';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';

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

// 坐标{col, row}转成坐标A1
export const excelCellRef = (obj: { row: number; col: number }) => {
  const row = obj.row + 1;
  const col = obj.col + 1;

  function colNumToLetter(num: number): string {
    let letter = '';
    while (num > 0) {
      const temp = (num - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      num = Math.floor((num - 1 - temp) / 26);
    }
    return letter || 'A';
  }
  const columnLetter = colNumToLetter(col);
  const cellReference = `${columnLetter}${row}`;
  return cellReference;
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

export const updataCells = (
  sheetCell: XSheetCells,
  readonly: boolean | undefined,
  _reportStatus: model.ReceptionContentBase<model.TaskContentType> | null,
) => {
  const cells: CellSettings[] = [];
  Object.keys(sheetCell).forEach(async (key) => {
    const cell = getCellSetting(cells, sheetCell[key].row, sheetCell[key].col);
    if (sheetCell[key].style) {
      cell.style = sheetCell[key].style;
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
        const styles = cellProperties.style;
        const td: any = TD.style;
        if (styles) {
          for (let key in styles) {
            if (key === 'paddingLeft') {
              td[key] = styles[key] + 'px';
            } else {
              td[key] = styles[key];
            }
          }
        }
      };
      cells.push(cell);
    }
    if (sheetCell[key].class) {
      let arr = [];
      for (let k in sheetCell[key].class) {
        arr.push(sheetCell[key].class[k]);
      }
      cell.className = arr.join(' ');
      cells.push(cell);
    }
    if (
      (sheetCell[key]?.rule.value?.type === '函数型' &&
        !sheetCell[key]?.rule.isVariableData &&
        sheetCell[key]?.rule.value?.valueString) ||
      sheetCell[key]?.rule?.isSummary
    ) {
      cell.renderType = 'computed';
    } else {
      cell.renderType = 'input';
    }
    if (sheetCell[key].rule.value?.type) {
      switch (sheetCell[key].valueType) {
        case '数字框':
          cell.type = 'numeric';
          cell.numericFormat = {
            pattern: {
              thousandSeparated: true,
              mantissa: Number(sheetCell[key]?.accuracy),
            },
            culture: 'zh-CN',
          };
          break;
        case '日期型':
          cell.type = 'date';
          cell.dateFormat = 'YYYY-MM-DD';
          break;
        default:
          break;
      }
      switch (sheetCell[key].rule.value?.type) {
        case '输入型':
          if (!readonly) {
            cell.readOnly = readonly;
          }
          cell.renderer = 'customStylesRenderer';
          break;
        case '属性型':
          if (
            ['货币型', '数值型', '描述型'].includes(
              sheetCell[key].rule.value?.valueString.valueType,
            )
          ) {
            if (!readonly) {
              cell.readOnly = readonly;
            }
          }
          cell.renderer = 'customStylesRenderer';
          break;
        case '函数型':
          if (sheetCell[key]?.rule.isVariableData === true) {
            if (!readonly) {
              cell.readOnly = readonly;
            }
          }
          cell.renderer = 'customStylesRenderer';
          break;
        case '取数型':
          if (!readonly) {
            cell.readOnly = readonly;
          }
          cell.renderer = 'customStylesRenderer';
          break;
        default:
          break;
      }
      cells.push(cell);
    }
  });
  return cells;
};

export const getAggregationDate = async (rule: any, belong: IBelong) => {
  if (typeof rule === 'string') {
    rule = rule.replaceAll('$belongId', belong.id);
    rule = JSON.parse(rule);
  }
  let { collName, group, queryOptionsCode, filterCode } = rule;
  if (!collName || !queryOptionsCode || !filterCode) return;
  const target = group
    ? belong.targets.find((target) => target.id === group) ?? belong
    : belong;
  if (typeof queryOptionsCode === 'string') {
    queryOptionsCode = JSON.parse(queryOptionsCode);
  }
  const options = [
    {
      match: queryOptionsCode?.options?.match || {
        isDeleted: false,
      },
    },
  ];
  const extra = queryOptionsCode?.options?.extra;
  if (Array.isArray(extra) && extra.length > 0) {
    options.push(...extra);
  }
  const data = await kernel.collectionAggregate(
    target.id,
    target.belongId,
    target.relations,
    collName,
    options,
    queryOptionsCode?.filter,
  );
  const filter = new Function('data', filterCode);
  const result = filter(data.data);
  return result;
};

export const refreshFormData = async (
  formData: model.FormEditData | undefined,
  sheet: XSheet,
  type: string,
) => {
  const data: [number, number, any][] = [];
  const cells = sheet.cells;
  if (formData?.after && type === 'primary') {
    if (formData?.after[0][sheet.attributeId!]) {
      const dataSource = formData?.after[0][sheet.attributeId!];
      for (const cellKey in dataSource) {
        if (cells[cellKey]) {
          const cell = cells[cellKey];
          let value = dataSource[cellKey];
          data.push([cell.row, cell.col, value]);
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

export const convertArrayToObject = (data: any[] | undefined) => {
  const result: any = {};
  data?.forEach((item, index) => {
    Object.keys(item).forEach((key) => {
      if (item[key] !== '') {
        let newKey: string;
        if (key.includes('_')) {
          let parts = key.split('_');
          newKey = `${parts[0]}${index + 1}_${parts[1]}`;
        } else {
          newKey = `${key}${index + 1}`;
        }
        result[newKey] = item[key];
      }
    });
  });
  return result;
};

export const getDefaultValue = async (cell: XCells, service: WorkFormService) => {
  let value: any;
  switch (
    getWidget(cell.rule.value?.valueString.valueType, cell.rule.value?.valueString.widget)
  ) {
    case '操作组织':
      if (service.reception) {
        const res = await kernel.queryEntityById({
          id: service.reception.content.treeNode.belongId,
        });
        value = res.data.name;
      } else {
        service.belong.metadata.name;
      }
      break;
    default:
      break;
  }
  return value;
};

function splitKey(str: string): { letter: string; number: number } | null {
  const matches = str.match(/[A-Z]+|[0-9]+/g);
  if (matches && matches.length === 2) {
    let letter = matches[0];
    if (str.includes('_')) {
      letter = letter + '_code';
    }
    const number = parseInt(matches[1], 10);
    return { letter, number };
  }
  return null;
}

export const getSubData = (setting: XFloatRowsInfo, data: any) => {
  const dataJson = data[setting.attributeId!] ?? {};
  const maxKeyNumber = Math.max(
    ...Object.keys(dataJson).map((key) => {
      const match = key.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    }),
    0,
  );

  const resultArrayLength = Math.ceil(maxKeyNumber / 10) * 10;
  let jsonTemplate: any = {};
  setting.rowsInfo.forEach((item: any) => {
    if (item.rule.value.type === '属性型') {
      jsonTemplate[item.name + '_code'] = undefined;
    }
    jsonTemplate[item.name] = undefined;
  });
  const resultArray = new Array(resultArrayLength)
    .fill(null)
    .map(() => ({ ...jsonTemplate }));

  Object.keys(dataJson).forEach((key) => {
    let value = dataJson[key];
    const result = splitKey(key);
    if (result) {
      const info = setting.rowsInfo.find((rowInfo) => rowInfo.name === result.letter);
      if (info?.valueType === '数字框') {
        const factor: number = Math.pow(10, info.accuracy ?? 2);
        value = Math.round(value * factor) / factor;
      }
      resultArray[result.number - 1][result.letter] = value;
    } else {
      console.warn(`Invalid key format: ${key}`);
    }
  });

  return resultArray;
};

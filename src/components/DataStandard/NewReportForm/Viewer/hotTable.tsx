import { ReceptionContext } from '@/components/DataPreview/task';
import { kernel, model, schema } from '@/ts/base';
import { IBelong } from '@/ts/core';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.min.css';
import { registerLanguageDictionary, zhCN } from 'handsontable/i18n';
import { registerAllModules } from 'handsontable/registry';
import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getWidget, isDirectEditCell } from '../../../DataStandard/WorkForm/Utils';
import { floatInfo, floatRowsData, cellsDataType, coord } from '../types';
import CellItem from './cellItem';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import Toolbar, { Item } from 'devextreme-react/toolbar';
import { EditModal } from '@/executor/tools/editModal';
import {
  XAttribute,
  XCells,
  XFloatRowsInfo,
  XRowsInfo,
  XSheet,
  XSheetCells,
  XSheetConfig,
  XThing,
} from '@/ts/base/schema';
import { CellChange, ChangeSource } from 'handsontable/common';
import {
  refreshFormData,
  isSelectWidget,
  updataCells,
  excelCellRef,
  convertArrayToObject,
  getAggregationDate,
  getDefaultValue,
  getSubData,
} from './../Utils';
import { ReportReception } from '@/ts/core/work/assign/reception/report';
import { ReportStatus } from '@/ts/base/model';
import { Modal, Table, Tag, message } from 'antd';
import { formatNumber } from '@/utils';
import { deepClone } from '@/ts/base/common';
import { useFixedCallback } from '@/hooks/useFixedCallback';
import { FormChangeEvent } from '@/ts/scripting/core/types/rule';
registerLanguageDictionary(zhCN);
registerAllModules();

const HotTableView: React.FC<{
  data: { [key: string]: any };
  allowEdit: boolean;
  belong: IBelong;
  form: schema.XReport;
  info?: model.FormInfo;
  readonly?: boolean;
  showTitle?: boolean;
  fields: model.FieldModel[];
  rules: model.RenderRule[];
  formData?: model.FormEditData;
  primary: {
    [id: string]: any;
  };
  onValuesChange?: (fieldId: string, value: any, data: any, coord?: any) => void;
  activeTabKey?: string;
  height?: string;
  service: WorkFormService;
  sheet: XSheet;
  variablesData: any;
}> = (props) => {
  props.data.name = props.form.name;
  const [editMode, setEditMode] = useState<boolean>(false);
  const [field, setField] = useState<model.FieldModel>(props.fields[0]);
  const [coordinate, setCoordinate] = useState<coord>({ row: 0, col: 0 });
  const [selectValue, setSelectValue] = useState<any>();
  const [cells, setCells] = useState<XSheetCells>({});
  const hotRef = useRef<{ hotInstance: Handsontable }>(null!);
  const [floatInfo, setFloatInfo] = useState<floatInfo>();
  const [reportType, setReportType] = useState<string>('primary');
  const [floatRowsData, setFloatRowsData] = useState<floatRowsData | undefined>(
    undefined,
  );
  const [cellsData, setCellsData] = useState<cellsDataType>({});
  const [fieldId, setFieldId] = useState<string>(props.sheet.attributeId!);

  const [ready, setReady] = useState(false);
  const [currentCell, setCurrentCell] = useState<XCells | null>(null);

  const attrMap = useMemo(() => {
    return props.form.attributes.reduce<Dictionary<XAttribute>>((a, v) => {
      a[v.id] = v;
      return a;
    }, {});
  }, [props.form.attributes]);
  const fieldMap = useMemo(() => {
    return props.fields.reduce<Dictionary<model.FieldModel>>((a, v) => {
      a[v.id] = v;
      return a;
    }, {});
  }, [props.fields]);

  const reception = useContext(ReceptionContext) as ReportReception | null;
  const reportStatus = useMemo(() => {
    if (!reception) {
      return null;
    }
    return reception.metadata.content as ReportStatus;
  }, [reception]);

  const onValueChange = useCallback((fieldId: string, value: any) => {
    const checkHasChanged = (fieldId: string, value: any) => {
      if (value instanceof Object) {
        return true;
      }
      const oldValue = props.data[fieldId];
      if (oldValue) {
        return value != oldValue || value === undefined || value === null;
      } else {
        return value !== undefined && value !== null;
      }
    };
    if (checkHasChanged(fieldId, value)) {
      if (value === undefined || value === null) {
        delete props.data[fieldId];
      } else {
        props.data[fieldId] = value;
      }
      props.onValuesChange?.apply(this, [fieldId, value, props.data]);
    }
  }, []);
  const writeData = (text: string, value: string, fieldId: string) => {
    const hot = hotRef.current.hotInstance;
    const key = excelCellRef(coordinate);
    const cellMeta = hot.getCellMeta(coordinate.row, coordinate.col);
    if (cellMeta.subTable) {
      let rowData = floatRowsData?.[cellMeta.floatSetting.attributeId];
      let subData = rowData?.data;
      if (subData && floatInfo) {
        subData[floatInfo.row][floatInfo.name] = text;
        subData[floatInfo.row][floatInfo.name + '_code'] = value;
      }
      const data = convertArrayToObject(subData);
      props.onValuesChange?.apply(this, [
        cellMeta.floatSetting.attributeId,
        data,
        props.data,
      ]);
    } else {
      const data: cellsDataType = deepClone(cellsData);
      data[key] = text;
      setCellsData(data);
      hot.setDataAtCell(coordinate.row, coordinate.col, text, 'writeData');
      props.onValuesChange?.apply(this, [fieldId, value, props.data]);
    }
  };

  const onBatchUpdate = useFixedCallback(async (changeEvents: FormChangeEvent[]) => {
    const hot = hotRef.current.hotInstance;
    let changeArray: [number, number, any][] = [];
    for (const item of changeEvents) {
      let change: [number, number, any] | null = null;
      if (item.formId === props.form.id) {
        if (item.sheet && item.sheet != props.sheet.code) {
          continue;
        }
        let cell = cells[item.destId];
        if (item.value || item.value == 0) {
          if (cell.rule.value?.type === '属性型') {
            const field = fieldMap[cell.rule.value.valueString.id];
            switch (field?.valueType) {
              case '分类型': {
                const value = field.lookups?.find(
                  (lookup) => lookup.value === item.value,
                );
                change = [cell.row, cell.col, value?.text];
                break;
              }
              case '用户型':
                switch (field.widget) {
                  case '操作人':
                  case '操作组织':
                    // 自动生成的，不赋值
                    continue;
                  case '人员搜索框':
                  case '单位搜索框':
                  case '群组搜索框':
                  case '组织群搜索框':
                  case '成员选择框':
                  case '内部机构选择框': {
                    const result = await kernel.queryEntityById({ id: item.value });
                    change = [cell.row, cell.col, result.data?.name];
                    break;
                  }
                }
                break;
              default:
                change = [cell.row, cell.col, item.value];
                break;
            }
          } else {
            change = [cell.row, cell.col, item.value];
          }
        }

        if (change) {
          changeArray.push(change);
        }
      }
    }

    const hotData = hot.getData();
    const data: cellsDataType = deepClone(cellsData);
    changeArray.forEach((change) => {
      const [row, col, value] = change;
      hotData[row][col] = value;
      if (!props.readonly) {
        const coord = excelCellRef({ row: row, col: col });
        data[coord] = value;
      }
    });
    onValueChange(props.sheet.attributeId!, data);
    setCellsData(data);

    hot.updateSettings({
      data: hotData,
    });
  });

  const updateHot = useCallback(async (setting: XSheetConfig, sheetCell: XSheetCells) => {
    const hot = hotRef.current.hotInstance;

    const changes = await refreshFormData(props.formData, props.sheet, 'primary');

    let mergeCells = setting.mergeCells ? [...setting.mergeCells] : [];
    setting?.floatRowsSetting?.forEach((infos) => {
      if (infos.isFloatRows && infos.attributeId) {
        const mergeCell = infos.mergeCells;
        mergeCells.push({
          row: mergeCell.xMin,
          col: mergeCell.yMin,
          rowspan: 1,
          colspan:
            mergeCell.yMin > 0 ? mergeCell.yMax - mergeCell.yMin + 1 : mergeCell.yMax + 1,
          removed: false,
        });
      }
    });

    // 初始化对象坐标
    hot.batch(() => {
      const data: cellsDataType = deepClone(cellsData);
      Object.keys(sheetCell).forEach(async (key) => {
        const cell = sheetCell[key];
        const coord = excelCellRef({ row: cell.row, col: cell.col });
        const rule: any = sheetCell[key].rule.value?.valueString || {};
        let value: any;
        if (cell.rule.value?.type === '固定型') {
          hot.setDataAtCell(cell.row, cell.col, cell.rule.value?.valueString);
        } else if (
          cell.rule.value?.type === '函数型' &&
          cell.rule.isVariableData === true &&
          !props.readonly
        ) {
          value = rule
            .split('.')
            .reduce((acc: any, key: string) => acc?.[key], props.variablesData);
          hot.setDataAtCell(cell.row, cell.col, value);
          data[coord] = value;
          onValueChange(props.sheet.attributeId!, data);
        } else if (cell.rule.value?.type === '取数型' && !props.readonly) {
          value = await getAggregationDate(JSON.parse(rule), props.belong);
          hot.setDataAtCell(cell.row, cell.col, value);
          data[coord] = value;
          onValueChange(props.sheet.attributeId!, data);
        } else if (cell.rule.value?.type === '属性型' && !props.readonly) {
          value = await getDefaultValue(cell, props.service);
          if (value) {
            data[coord] = value;
            hot.setDataAtCell(cell.row, cell.col, value);
            onValueChange(props.sheet.attributeId!, data);
          }
        }
      });

      const hotData = hot.getData();
      changes.forEach((change) => {
        const [row, col, value] = change;
        hotData[row][col] = value;
        if (!props.readonly) {
          const coord = excelCellRef({ row: row, col: col });
          data[coord] = value;
          onValueChange(props.sheet.attributeId!, data);
        }
      });
      setCellsData(data);

      hot.updateSettings({
        data: hotData,
        minCols: setting.col_w ? setting.col_w.length : 5,
        minRows: setting.row_h ? setting.row_h.length : 5,
        rowHeights: setting.row_h,
        colWidths: setting.col_w,
        cell: updataCells(sheetCell, props.readonly, reportStatus),
        mergeCells: mergeCells,
      });
    });

    const floatRowsData = setting.floatRowsSetting?.reduce((acc: any, item: any) => {
      if (item.attributeId) {
        acc[item.attributeId] = {
          data: [],
          currentPage: 1,
          limit: 10,
          pageNum: 1,
        };
      }
      return acc;
    }, {});

    setFloatRowsData(floatRowsData);

    function adjustColumnWidths() {
      const containerWidth = document.getElementById('hot-container')?.offsetWidth || 0;
      const columnCount = hot.countCols();
      const minColumnWidth = 50;
      const totalMinWidth = minColumnWidth * columnCount;

      if (totalMinWidth <= containerWidth) {
        hot.updateSettings({
          colWidths: Array.from({ length: columnCount }, () => minColumnWidth),
        });
      } else {
        let newColWidth = Math.floor((containerWidth - 20) / columnCount);
        newColWidth = Math.max(newColWidth, minColumnWidth);
        hot.updateSettings({
          colWidths: Array.from({ length: columnCount }, () => newColWidth),
        });
      }
    }

    // 调整列宽
    adjustColumnWidths();

    // 设置准备状态
    setTimeout(() => {
      setReady(true);
    }, 20);
  }, []);

  useEffect(() => {
    let handles: (() => void)[] = [];
    if (props.service) {
      handles = (['afterCalculate', 'batchUpdate'] as const).map((type) =>
        props.service!.onScoped(type, onBatchUpdate),
      );
    }
    const setting = props.sheet.sheetConfig ?? {};
    setCells(props.sheet.cells);
    updateHot(setting, props.sheet.cells);

    return () => {
      handles.forEach((dispose) => dispose());
    };
  }, [props.sheet, updateHot]);

  useEffect(() => {
    if (!ready) {
      return;
    }
  }, [cells]);

  useEffect(() => {
    if (floatRowsData) {
      const hot = hotRef.current.hotInstance;
      const floatRowsSetting = props.sheet.sheetConfig.floatRowsSetting || [];
      hot.batch(() => {
        floatRowsSetting.forEach((infos: XFloatRowsInfo) => {
          if (infos.isFloatRows && infos.attributeId) {
            const mergeCells = infos.mergeCells;
            hot.getCellMeta(mergeCells.xMin, mergeCells.yMin).floatSetting = infos;
            hot.getCellMeta(mergeCells.xMin, mergeCells.yMin).renderer = customRenderer;
          }
        });
      });
    }
  }, [floatRowsData]);

  const customRenderer = async (
    _instance: Handsontable.Core,
    TD: HTMLTableCellElement,
    _row: number,
    _col: number,
    _prop: string | number,
    value: any,
    cellProperties: Handsontable.CellProperties,
  ) => {
    const floatSetting = cellProperties.floatSetting;
    TD.style.padding = '0';
    while (TD.firstChild) {
      TD.removeChild(TD.firstChild);
    }
    if (!cellProperties.subTableInstance && floatRowsData) {
      let floatSet = floatRowsData[floatSetting.attributeId];
      let subData: any[] = floatSet.data; // 表格数据
      let tableData: any[] = []; // 展示数据
      let currentPage: number = floatSet.currentPage || 1;
      let limit: number = floatSet.limit;
      let pageNum: number = Math.ceil(subData.length / limit) || 1;

      const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;
        return subData.slice(startIndex, endIndex);
      };
      if (props.readonly) {
        subData = getSubData(floatSetting, props.data);
        tableData = getCurrentPageData();
        currentPage = 1;
        pageNum = Math.ceil(subData.length / limit) || 1;
      } else {
        if (subData.length >= 10) {
          tableData = getCurrentPageData();
        } else {
          for (var i = 0; i < 10; i++) {
            let dataJson: any = {};
            floatSetting.rowsInfo.forEach((info: XRowsInfo) => {
              if (info.isLineNumber) {
                dataJson[info.name] = i + 1;
              } else if (info.rule.value?.type === '属性型') {
                dataJson[info.name] = undefined; // 值
                dataJson[info.name + '_code'] = undefined; // 值得code
              } else {
                dataJson[info.name] = undefined;
              }
            });
            tableData.push(dataJson);
            subData.push(dataJson);
          }
        }
      }
      const columns: any[] = [];
      floatSetting.rowsInfo.forEach((info: XRowsInfo) => {
        columns.push({
          data: info.name,
          readOnly: info.isOnlyRead,
          renderer: 'customStylesRenderer',
        });
      });

      const prevPage = () => {
        if (currentPage > 1) {
          currentPage--;
          currentPageSpan.textContent = currentPage + '/' + pageNum;
          const data = getCurrentPageData();
          value.updateSettings({
            data: data,
          });
        }
      };

      const nextPage = () => {
        if (currentPage < pageNum) {
          currentPage++;
          currentPageSpan.textContent = currentPage + '/' + pageNum;
          const data = getCurrentPageData();
          value.updateSettings({
            data: data,
          });
        }
      };

      let subContainer = document.createElement('div');
      subContainer.style.width = '100%';
      subContainer.style.height = '235px';
      subContainer.style.overflowY = 'auto';

      let paginationContainer = document.createElement('div');
      paginationContainer.id = 'paginationContainer';
      paginationContainer.style.display = 'flex';
      paginationContainer.style.flexWrap = 'nowrap';

      let prevButton = document.createElement('button');
      prevButton.textContent = '上一页';
      prevButton.className = 'ogo-btn ogo-btn-default ogo-btn-sm';
      prevButton.style.marginRight = '8px';
      prevButton.onclick = prevPage;

      let nextButton = document.createElement('button');
      nextButton.textContent = '下一页';
      nextButton.className = 'ogo-btn ogo-btn-default ogo-btn-sm';
      nextButton.style.marginRight = '8px';
      nextButton.onclick = nextPage;

      let currentPageSpan = document.createElement('span');
      currentPageSpan.id = 'currentPage';
      currentPageSpan.textContent = currentPage + '/' + pageNum;
      currentPageSpan.style.marginRight = '8px';
      let currentPageParagraph = document.createElement('p');
      currentPageParagraph.textContent = '当前页: ';
      currentPageParagraph.appendChild(currentPageSpan);

      paginationContainer.appendChild(currentPageParagraph);
      paginationContainer.appendChild(prevButton);
      paginationContainer.appendChild(nextButton);
      TD.appendChild(subContainer);
      TD.appendChild(paginationContainer);

      value = new Handsontable(subContainer, {
        data: tableData,
        readOnly: props.readonly,
        columns: columns,
        width: '100%',
        stretchH: 'all',
        colWidths: floatSetting.colWidths,
        licenseKey: 'non-commercial-and-evaluation',
        renderAllRows: false,
        viewportRowRenderingOffset: 10,
      });
      value.batch(async () => {
        if (!props.readonly) {
          value.updateSettings({
            contextMenu: {
              items: {
                custom_item: {
                  name: '增加行',
                  callback: function (_key: any, _options: any) {
                    insertRows();
                  },
                },
              },
            },
          });
        }
      });

      const insertRows = async () => {
        const subDataLength = subData.length;
        for (var i = 0; i < 10; i++) {
          let dataJson: any = {};
          floatSetting.rowsInfo.forEach((info: XRowsInfo) => {
            if (info.isLineNumber) {
              dataJson[info.name] = i + 1 + subDataLength;
            } else if (info.rule.value?.type === '属性型') {
              dataJson[info.name] = '';
              dataJson[info.name + '_code'] = '';
            } else {
              dataJson[info.name] = '';
            }
          });
          subData.push(dataJson);
        }
        message.success('插入成功');
        pageNum = Math.ceil(subData.length / limit);
        currentPageSpan.textContent = currentPage + '/' + pageNum;
      };

      value.addHook(
        'afterChange',
        function (changes: CellChange[] | null, source: ChangeSource) {
          if (
            (source === 'edit' ||
              source === 'CopyPaste.paste' ||
              source === 'Autofill.fill') &&
            !props.readonly
          ) {
            changes?.forEach((change: CellChange) => {
              subData[change[0] + (currentPage - 1) * limit][change[1]] = change[3];
            });
            const data = convertArrayToObject(subData);
            onValueChange(floatSetting.attributeId, data);
          }
        },
      );
      value.addHook(
        'afterOnCellMouseDown',
        function (_event: MouseEvent, coords: Handsontable.CellCoords) {
          if (!props.readonly) {
            for (var i = 0; i < floatSetting.rowsInfo.length; i++) {
              if (i === coords.col) {
                const cell = floatSetting.rowsInfo[i];
                if (cell.rule.value.type === '属性型') {
                  if (
                    isSelectWidget(
                      getWidget(
                        cell.rule.value.valueString.valueType,
                        cell.rule.value.valueString.widget,
                      ),
                    )
                  ) {
                    const newDataStructure = { ...floatRowsData };
                    floatSet.data = subData;
                    floatSet.currentPage = currentPage;
                    floatSet.pageNum = pageNum;
                    newDataStructure[floatSetting.id] = floatSet;
                    setFloatRowsData(newDataStructure);
                    setCoordinate({
                      row: floatSetting.mergeCells.xMin,
                      col: floatSetting.mergeCells.yMin,
                    });
                    setFloatInfo({
                      code: floatSetting.code,
                      col: coords.col,
                      row: coords.row + (currentPage - 1) * limit,
                      name: cell.name,
                    });
                    setFieldId(floatSetting.id);
                    setReportType('floatForm');
                    setEditMode(true);
                    setSelectValue(undefined);
                    props.fields.map((it) => {
                      if (it.propId == cell.rule.value.valueString.propId) {
                        setField(it);
                      }
                    });
                  }
                }
              }
            }
          }
        },
      );
      cellProperties.subTable = {
        instance: value,
      };
    }
  };

  const afterOnCellMouseDown = (_event: MouseEvent, coords: Handsontable.CellCoords) => {
    if (props.readonly) return;
    const key = excelCellRef({ row: coords.row, col: coords.col });
    const cell = cells?.[key];
    if (cell && cell.rule.value?.type === '属性型') {
      const widget = getWidget(
        cell.rule.value?.valueString.valueType,
        cell.rule.value?.valueString.widget,
      );
      if (isSelectWidget(widget)) {
        const field = props.fields.find(
          (it) => it.propId === cell.rule.value?.valueString?.propId,
        );
        if (field) {
          setCoordinate({ row: cell.row, col: cell.col });
          setEditMode(true);
          setFieldId(props.sheet.attributeId!);
          setReportType('primary');
          setSelectValue(undefined);
          setField(field);
        }
      }
    }
  };

  function afterSelection(row: number, col: number, _row2: number, _col2: number) {
    const key = excelCellRef({ row: row, col: col });
    const cell = cells[key];
    if (cell) {
      setCurrentCell(cell);
    } else {
      setCurrentCell(null);
    }
  }

  const afterChange = (changes: CellChange[] | null, source: ChangeSource) => {
    if (!ready) {
      return;
    }
    if (
      (source === 'edit' || source === 'CopyPaste.paste' || source === 'Autofill.fill') &&
      !props.readonly &&
      changes
    ) {
      const data: cellsDataType = deepClone(cellsData);
      changes?.forEach((change: CellChange) => {
        let [row, col, _value, label] = change;
        const key = excelCellRef({ row: row, col: col as number });
        const cell = cells[key];

        let canChange = false;
        if (isDirectEditCell(cell)) {
          if (
            (cell.rule.value?.type == '输入型' &&
              cell.valueType == '数字框' &&
              typeof label === 'string') ||
            (cell.rule.value?.type == '函数型' &&
              cell.rule.isVariableData &&
              typeof label === 'string')
          ) {
            label = parseFloat(label);
            if (!isNaN(label)) {
              canChange = true;
            }
          } else {
            canChange = true;
          }
        }
        if (canChange) {
          data[key] = label;
          if (cell.rule.value?.type === '属性型') {
            onValueChange(cell.rule.value?.valueString.id, label);
          }
        }
      });
      onValueChange(props.sheet.attributeId!, data);
      setCellsData(data);
    }
  };

  async function propSummaryTree() {
    if (!currentCell) {
      message.warning('请先选择有属性的单元格');
      return;
    }
    const attr = attrMap[currentCell.prop.id];
    if (!attr?.options?.isSummary) {
      message.warning('当前属性不可汇总');
      return;
    }

    if (attr.widget != '数字框') {
      message.warning('请选择数值型的属性');
      return;
    }

    let res: model.ReportSummaryTreeNodeView;
    try {
      res = await reception!.propertySummaryTree(attr, props.form);
    } catch (error) {
      console.error(error);
      message.error(error instanceof Error ? error.message : String(error));
      return;
    }

    Modal.info({
      width: 800,
      title: '属性值汇总穿透',
      content: (
        <div style={{ height: '60vh' }}>
          <Table
            size="small"
            bordered
            pagination={false}
            scroll={{ y: '50vh' }}
            columns={[
              {
                title: '节点名称',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: '节点类型',
                dataIndex: 'nodeTypeName',
                key: 'nodeTypeName',
                width: 120,
                render: (value) => <Tag color="success">{value}</Tag>,
              },
              {
                title: attr.name,
                dataIndex: 'value',
                key: 'value',
                width: 200,
                align: 'right',
                render: (value) => {
                  if (value == null) {
                    return '';
                  }
                  return formatNumber(value, attr.options?.accuracy ?? null, true);
                },
              },
            ]}
            dataSource={[res]}
          />
        </div>
      ),
    });
  }

  function onDataSelect(form: XThing) {
    const fieldUpdates: FormChangeEvent[] = [];
    const sheetKey = props.sheet.attributeId!;
    if (sheetKey in form) {
      const sheet = form[sheetKey] || {};
      for (const [cell] of Object.entries(props.sheet.cells)) {
        fieldUpdates.push({
          formId: props.form.id,
          sheet: props.sheet.code,
          destId: cell,
          value: sheet[cell],
        });
      }
    }
    onBatchUpdate(fieldUpdates);
  }

  const buttons: ReactNode[] = [];
  if (props.allowEdit && props.info?.allowSelect) {
    buttons.push(
      <Item
        location="after"
        locateInMenu="never"
        widget="dxButton"
        visible
        options={{
          text: '数据选择',
          type: 'default',
          stylingMode: 'outlined',
          onClick: () => {
            EditModal.showFormSelect({
              form: props.form,
              fields: props.fields,
              belong: props.service.target.space,
              multiple: false,
              onSave: (values) => {
                if (values.length > 0) {
                  const form = values[0];
                  onDataSelect(form);
                }
              },
            });
          },
        }}
      />,
    );
  }

  return (
    <div className="report-form-viewer">
      <Toolbar height={60} visible={buttons.length > 0}>
        {buttons}
      </Toolbar>
      <HotTable
        ref={hotRef as any}
        readOnly={true}
        customBorders={true}
        rowHeaders={true}
        colHeaders={true}
        manualColumnResize={true}
        manualRowResize={true}
        height={props?.height ?? '100%'}
        language={zhCN.languageCode}
        persistentState={true}
        stretchH="all"
        outsideClickDeselects={false}
        renderAllRows={false}
        viewportRowRenderingOffset={30}
        afterChange={afterChange}
        licenseKey="non-commercial-and-evaluation"
        afterOnCellMouseDown={afterOnCellMouseDown}
        afterSelection={afterSelection}
      />
      {editMode && (
        <CellItem
          data={props.data}
          belong={props.belong}
          rules={[...(props.formData?.rules ?? []), ...(props?.rules ?? [])].filter(
            (a) => a.destId == field.id,
          )}
          readonly={props.readonly}
          field={field}
          type={reportType}
          onValuesChange={onValueChange}
          writeData={writeData}
          selectValue={selectValue}
          cellsData={cellsData}
          coordinate={coordinate}
          fieldId={fieldId}
          onCancel={() => {
            setEditMode(false);
          }}
        />
      )}
    </div>
  );
};

export default HotTableView;

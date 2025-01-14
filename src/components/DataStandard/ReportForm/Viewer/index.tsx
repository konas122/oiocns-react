import { ReceptionContext } from '@/components/DataPreview/task';
import { kernel, model, schema } from '@/ts/base';
import { IBelong } from '@/ts/core';
import { FormChangeEvent } from '@/ts/scripting/core/types/rule';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.min.css';
import { registerLanguageDictionary, zhCN } from 'handsontable/i18n';
import { registerAllModules } from 'handsontable/registry';
import { CellSettings } from 'handsontable/settings';
import React, {
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getWidget, isDirectEditable } from '../../../DataStandard/WorkForm/Utils';
import {
  CellInfo,
  ReportInfo,
  ReportSettingInfo,
  XFloatRowsInfo,
  XRowsInfo,
  stagDataInfo,
  floatInfo,
  floatRowsData,
} from '../types';
import CellItem from './cellItem';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import Toolbar, { Item } from 'devextreme-react/toolbar';
import { EditModal } from '@/executor/tools/editModal';
import { XAttribute } from '@/ts/base/schema';
import { CellChange, ChangeSource } from 'handsontable/common';
import { Form } from '@/ts/core/thing/standard/form';
import { updataCells, refreshFormData, isSelectWidget } from './../Utils';
import { ReportReception } from '@/ts/core/work/assign/reception/report';
import { useFixedCallback } from '@/hooks/useFixedCallback';
import { ReportStatus } from '@/ts/base/model';
import { Modal, Table, Tag, message } from 'antd';
import { formatNumber } from '@/utils';
import { NodeType } from '@/ts/base/enum';
registerLanguageDictionary(zhCN);
registerAllModules();

const WorkReportViewer: React.FC<{
  data: { [key: string]: any };
  allowEdit: boolean;
  belong: IBelong;
  form: schema.XForm;
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
}> = (props) => {
  props.data.name = props.form.name;
  const [editMode, setEditMode] = useState<boolean>(false);
  const [field, setField] = useState<model.FieldModel>(props.fields[0]);
  const [coordinate, setCoordinate] = useState<any>();
  const [stagData, setStagData] = useState<stagDataInfo[]>([]);
  const [selectValue, setSelectValue] = useState<any>();
  const [cells, setCells] = useState<CellInfo[]>([]);
  const hotRef = useRef<{ hotInstance: Handsontable }>(null!);
  const [floatInfo, setFloatInfo] = useState<floatInfo>();
  const [reportType, setReportType] = useState<string>('primary');
  const [floatRowsData, setFloatRowsData] = useState<floatRowsData | undefined>(
    undefined,
  );

  const [ready, setReady] = useState(false);
  let metaForm = new Form(props.form, props.belong.directory);
  const [currentCell, setCurrentCell] = useState<CellInfo | null>(null);

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

  const isSummary = reportStatus?.treeNode.nodeType == NodeType.Summary;

  const onValueChange = (fieldId: string, value: any) => {
    const hot = hotRef.current.hotInstance;
    if (coordinate?.row) {
      const cellMeta = hot.getCellMeta(coordinate.row, coordinate.col);
      if (!cellMeta.subTable) {
        setStagData([
          ...stagData,
          { row: coordinate.row, col: coordinate.col, fieldId: fieldId, value: value },
        ]);
      }
    }
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
  };
  const writeData = (text: string, fieldId: string) => {
    const hot = hotRef.current.hotInstance;
    const cellMeta = hot.getCellMeta(coordinate.row, coordinate.col);
    if (cellMeta.subTable) {
      const prop = props.fields.filter((field: model.FieldModel) => {
        return field.info == cellMeta.floatSetting.code;
      });
      let rowData = floatRowsData?.[prop[0].id];
      let subData = rowData?.data;
      if (subData && floatInfo) {
        subData[floatInfo.row][fieldId] = text;
      }
      props.onValuesChange?.apply(this, [prop[0].id, subData, props.data]);
    } else {
      hot.setDataAtCell(coordinate.row, coordinate.col, text, 'writeData');
      const coordinateId = [coordinate.row, coordinate.col].toString();
      props.onValuesChange?.apply(this, [coordinateId, text, props.data]);
    }
  };

  const onBatchUpdate = useFixedCallback(async (changeEvents: FormChangeEvent[]) => {
    const hot = hotRef.current.hotInstance;
    let changeArray: [number, number, any][] = [];
    for (const item of changeEvents) {
      let change: [number, number, any] | null = null;
      let needText = false;

      let prop = cells.find((value) => {
        return value.prop.id === item.destId;
      });
      if (!prop) {
        continue;
      }

      if (item.value || item.value == 0) {
        const field = fieldMap[prop.prop.id];
        switch (field?.valueType) {
          case '选择型':
          case '分类型': {
            const value = field.lookups?.find((lookup) => lookup.value === item.value);
            change = [prop.row, prop.col, value?.text];
            needText = true;
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
                change = [prop.row, prop.col, result.data?.name];
                needText = true;
                break;
              }
            }
            break;
          default:
            change = [prop.row, prop.col, item.value];
            break;
        }
      }

      // 给表单赋值
      props.data[item.destId] = item.value;
      // 居然没有地方通知更新，依赖Bug运行？？？
      onValueChange(item.destId, item.value);

      if (change) {
        changeArray.push(change);
        if (needText) {
          const coordinateId = [prop.row, prop.col].join(',');
          props.data[coordinateId] = change[2];
        }
      }
    }
    // 更新handsontable并阻止afterChange事件
    hot.setDataAtCell(changeArray, 'writeData');
  });

  useEffect(() => {
    let handles: (() => void)[] = [];
    if (props.service) {
      handles = (['afterCalculate', 'batchUpdate'] as const).map((type) =>
        props.service!.onScoped(type, onBatchUpdate),
      );
    }

    const sheetListData: any = JSON.parse(props.form?.reportDatas ?? '{}');
    const selectItem = Object.values(sheetListData)[0] as ReportInfo;
    const setting = selectItem?.data?.setting || {};
    const datas = selectItem?.data?.data || [[]];
    updateHot(setting, datas, setting.floatRowsSetting || []);

    return () => {
      handles.forEach((dispose) => dispose());
    };
  }, []);

  async function onCellsChange() {
    const hot = hotRef.current.hotInstance;
    const changes = await refreshFormData(props.formData, attrMap, cells, 'primary');
    hot.setDataAtCell(changes);
  }

  useEffect(() => {
    if (!ready) {
      return;
    }
    onCellsChange();
  }, [cells]);

  const updateHot = async (
    setting: ReportSettingInfo,
    data: any[][],
    floatRowsSetting: XFloatRowsInfo[],
  ) => {
    const hot = hotRef.current.hotInstance;
    const result = updataCells(
      setting,
      data,
      attrMap,
      props.fields,
      props.readonly,
      reportStatus,
    );
    const cells: CellSettings[] = result.cells;
    data = result.data;

    floatRowsSetting.forEach((infos) => {
      if (infos.isFloatRows && infos.id) {
        const mergeCells = infos.mergeCells;
        setting.mergeCells?.push({
          row: mergeCells.xMin,
          col: mergeCells.yMin,
          rowspan: 1,
          colspan:
            mergeCells.yMin > 0
              ? mergeCells.yMax - mergeCells.yMin + 1
              : mergeCells.yMax + 1,
          removed: false,
        });
      }
    });
    setCells(setting?.cells || []);

    hot.updateSettings({
      // cell: cells,
      data,
      minCols: setting.col_w.length,
      minRows: setting.row_h.length,
      mergeCells: setting.mergeCells || [],
      rowHeights: setting.row_h,
      colWidths: setting.col_w,
    });

    const changes = await refreshFormData(
      props.formData,
      attrMap,
      setting?.cells || [],
      'primary',
    );
    // 这种写法会报错，但下面的不会？？
    // hot.setDataAtCell(changes);

    hot.batch(() => {
      for (const change of changes) {
        hot.setDataAtCell(...change);
      }
    });

    hot.updateSettings({
      cell: cells,
    });

    const floatRowsData = floatRowsSetting.reduce((acc: any, item: any) => {
      if (item.id) {
        acc[item.id] = {
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

    adjustColumnWidths();

    setTimeout(() => {
      setReady(true);
    }, 20);
  };

  useEffect(() => {
    if (floatRowsData) {
      const hot = hotRef.current.hotInstance;
      const sheetListData: any = JSON.parse(props.form?.reportDatas);
      const selectItem = Object.values(sheetListData)[0] as ReportInfo;
      const setting = selectItem?.data?.setting || {};
      const floatRowsSetting = setting.floatRowsSetting || [];
      hot.batch(() => {
        floatRowsSetting.forEach((infos: XFloatRowsInfo) => {
          if (infos.isFloatRows && infos.id) {
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
    let fields = await metaForm.loadFields();
    while (TD.firstChild) {
      TD.removeChild(TD.firstChild);
    }
    // 如果value不是一个Handsontable实例，则创建一个新的
    if (!cellProperties.subTableInstance && floatRowsData) {
      let floatSet = floatRowsData[floatSetting.id];
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
        const prop = fields.filter((field: model.FieldModel) => {
          return field.info == floatSetting.code;
        });
        subData = prop.length > 0 ? props.data[prop[0].propId] : floatSetting.subData;
        tableData = getCurrentPageData();
        currentPage = 1;
        pageNum = Math.ceil(props.data[prop[0].propId].length / limit) || 1;
      } else {
        if (subData.length >= 10) {
          tableData = getCurrentPageData();
        } else {
          for (var i = 0; i < 10; i++) {
            let json: any = {};
            floatSetting.rowsInfo.forEach((info: XRowsInfo) => {
              if (info.isLineNumber) {
                json[info.propId] = i + 1;
              } else if (info.type === '引用型') {
                json[info.propId] = '';
                json[info.propId + '_code'] = '';
              } else {
                json[info.propId] = '';
              }
            });
            tableData.push(json);
            subData.push(json);
          }
        }
      }
      const columns: any[] = [];
      floatSetting.rowsInfo.forEach((info: XRowsInfo) => {
        columns.push({
          data: info.propId,
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
          let json: any = {};
          floatSetting.rowsInfo.forEach((info: XRowsInfo) => {
            if (info.isLineNumber) {
              json[info.propId] = i + 1 + subDataLength;
            } else if (info.type === '引用型') {
              json[info.propId] = '';
              json[info.propId + '_code'] = '';
            } else {
              json[info.propId] = '';
            }
          });
          subData.push(json);
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
            const prop = fields.filter((field: model.FieldModel) => {
              return field.info == floatSetting.code;
            });
            onValueChange(prop[0]?.propId, subData);
          }
        },
      );
      value.addHook(
        'afterOnCellMouseDown',
        function (_event: MouseEvent, coords: Handsontable.CellCoords) {
          if (!props.readonly) {
            for (var i = 0; i < floatSetting.rowsInfo.length; i++) {
              if (i === coords.col) {
                const prop = attrMap[floatSetting.rowsInfo[i].propId];
                if (isSelectWidget(getWidget(prop.valueType, prop.widget))) {
                  const newDataStructure = { ...floatRowsData };
                  floatSet.data = subData;
                  floatSet.currentPage = currentPage;
                  floatSet.pageNum = pageNum;
                  newDataStructure[floatSetting.id] = floatSet;
                  setFloatRowsData(newDataStructure);
                  setCoordinate({
                    col: floatSetting.mergeCells.yMin,
                    row: floatSetting.mergeCells.xMin,
                  });
                  setFloatInfo({
                    code: floatSetting.code,
                    col: coords.col,
                    row: coords.row + (currentPage - 1) * limit,
                  });
                  setReportType('floatForm');
                  setEditMode(true);
                  setSelectValue(undefined);
                  stagData.forEach((items: stagDataInfo) => {
                    if (items.col === coords.col && items.row === coords.row) {
                      setSelectValue(items.value);
                    }
                  });
                  fields.map((it) => {
                    if (it.id == prop.id) {
                      setField(it);
                    }
                  });
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
    if (!props.readonly) {
      cells.forEach((item: CellInfo) => {
        const prop = attrMap[item.prop.id];
        if (item.col === coords.col && item.row === coords.row) {
          if (isSelectWidget(getWidget(prop.valueType, prop.widget))) {
            setCoordinate({ col: item.col, row: item.row });
            setEditMode(true);
            setReportType('primary');
            setSelectValue(undefined);
            stagData.forEach((items: stagDataInfo) => {
              if (items.col === item.col && items.row === item.row) {
                setSelectValue(items.value);
              }
            });
            props.fields.map((it) => {
              if (it.id == prop.id) {
                setField(it);
              }
            });
          }
        }
      });
    }
  };

  function afterSelection(row: number, col: number, _row2: number, _col2: number) {
    const cell = cells.find((c) => c.col == col && c.row == row);
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
      !props.readonly
    ) {
      const hot = hotRef.current.hotInstance;
      changes?.forEach((change: CellChange) => {
        var row = change[0];
        var col = change[1];
        var newValue = change[3];
        for (var i = 0; i < cells.length; i++) {
          const cell = cells[i];
          if (cell.row == row && cell.col == col) {
            const prop = attrMap[cell.prop.id];

            let canChange = false;
            if (isDirectEditable(prop) || source === 'edit') {
              if (prop.widget == '数字框' && typeof newValue === 'string') {
                newValue = parseFloat(newValue);
                if (!isNaN(newValue)) {
                  canChange = true;
                }
              } else {
                canChange = true;
              }
            }

            if (canChange) {
              onValueChange(prop.propId, newValue);
            } else {
              // 阻止粘贴和自动填充分类型与用户型，还原值
              const key = `${row},${col}`;
              hot.setDataAtCell(row, col as number, props.formData?.after[0]?.[key]);
            }
            return;
          }
        }
      });
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
              belong: props.info?.selectBelong
                ? props.service.target.space
                : props.service.target,
              multiple: false,
              onSave: (values) => {
                if (values.length > 0) {
                  const form = values[0];
                  onBatchUpdate(
                    props.fields.map((f) => ({
                      formId: props.form.id,
                      destId: f.id,
                      value: form[f.id],
                    })),
                  );
                }
              },
            });
          },
        }}
      />,
    );
  }
  if (isSummary) {
    buttons.push(
      <Item
        location="after"
        locateInMenu="never"
        widget="dxButton"
        visible
        options={{
          text: '属性值穿透',
          type: 'default',
          stylingMode: 'outlined',
          onClick: propSummaryTree,
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
        renderAllRows={true}
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
          onCancel={() => {
            setEditMode(false);
          }}
        />
      )}
    </div>
  );
};

export default WorkReportViewer;

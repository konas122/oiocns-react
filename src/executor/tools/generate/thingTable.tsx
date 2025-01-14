import React, { MutableRefObject, ReactNode, useRef } from 'react';
import { model, schema } from '@/ts/base';
import { GenerateColumn } from './columns';
import {
  Column,
  DataGrid,
  IDataGridOptions,
  Selection,
  Export,
  Summary,
} from 'devextreme-react/data-grid';
import { Dropdown, message } from 'antd';
import { FullThingColumns } from '@/config/column';
import { ItemType } from 'antd/lib/menu/hooks/useItems';
import { AiOutlineEllipsis } from 'react-icons/ai';
import { Workbook } from 'exceljs';
import orgCtrl from '@/ts/controller';
import saveAs from 'file-saver';
import { isUndefined } from 'lodash';
import { formatDate } from '@/utils';

interface IProps extends IDataGridOptions {
  form?: schema.XForm | schema.XView;
  beforeSource?: schema.XThing[];
  fields: model.FieldModel[];
  dataIndex?: 'attribute' | 'property';
  dataMenus?: {
    items: Array<ItemType & { hide?: boolean }>;
    onMenuClick: (key: string, data: any) => void;
  };
  showIndex?: boolean;
  select?: boolean;
  differences?: any[];
  reference?: MutableRefObject<DataGrid<schema.XThing, string> | null>;
  metadata?: schema.XForm;
  selectToOrigin?: boolean;
  onLockCell?: (params: any) => ReactNode;
}

/** 使用form生成表单 */
const GenerateThingTable = (props: IProps) => {
  const lock = useRef(false);
  const fields = FullThingColumns(props.fields, props.form?.typeName);
  const needHideFieldIds = fields
    .filter((i) => i.options?.visible)
    .map((i) => i.id)
    .slice(18);
  fields.forEach((item) => {
    if (needHideFieldIds.includes(item.id)) {
      item.options!.visible = false;
    }
  });

  const findTextWithParent = (text: string, data: any[]) => {
    let currentItem = data.find((item) => item.text === text);
    let texts = [];

    // 开始从当前项开始收集 text
    while (currentItem) {
      texts.unshift(currentItem.text); // 将当前文本添加到开头
      // 找到父项
      currentItem = data.find((item) => item.id === currentItem.parentId);
    }

    return texts.join('/'); // 用 '/' 分隔返回的文本
  };

  return (
    <DataGrid<schema.XThing, string>
      keyExpr="id"
      width="100%"
      ref={props.reference}
      height={props.height ?? '100%'}
      columnMinWidth={props.columnMinWidth ?? 80}
      focusedRowEnabled
      allowColumnReordering
      allowColumnResizing
      columnAutoWidth
      showColumnLines
      onRowPrepared={(e) => {
        if (e.data?.redRowFlag) {
          e.rowElement.style.color = 'red';
        }
        if (e.data?.locks?.exclusion) {
          e.rowElement.style.backgroundColor = '#FFFFE0';
        }
      }}
      showRowLines
      rowAlternationEnabled
      hoverStateEnabled
      columnResizingMode={'widget'}
      headerFilter={{ visible: true }}
      onExporting={async (e) => {
        if (lock.current) {
          message.error('正在导出数据，请稍后再试!');
          return;
        }
        lock.current = true;
        try {
          if (e.format === 'xlsx') {
            e.component.beginCustomLoading('数据准备中...');
            let options: any = e.component.getDataSource().loadOptions();
            options.sort = [{ desc: false, selector: 'id' }];
            const workbook = new Workbook();
            const worksheet = workbook.addWorksheet(props.form?.name);
            const columns = e.component.getVisibleColumns();
            const filter = e.component.getCombinedFilter();
            worksheet.columns = e.component
              .getVisibleColumns()
              .filter((it) => it.name !== '操作')
              .map((column) => {
                return { header: column.caption, key: column.dataField };
              });
            let lastId = '';
            let totalCount = 0;
            let skip = 0;
            let pass = true;
            while (pass) {
              let result: model.LoadResult<any> = {
                data: [],
                groupCount: 0,
                summary: [],
                totalCount: 0,
                msg: '',
                success: true,
                code: 0,
              };
              if (!e.selectedRowsOnly) {
                options.take = 500;
                if (lastId) {
                  options = {
                    ...options,
                    take: 500,
                    requireTotalCount: false,
                    options: {
                      match: { id: { _gt_: lastId } },
                    },
                  };
                }
                result = (await e.component
                  .getDataSource()
                  .store()
                  .load({
                    skip: 0,
                    ...options,
                    filter,
                    isExporting: true,
                  })) as any;
              } else {
                result.data = e.component.getSelectedRowsData();
              }
              if (result.data.length == 0 || !Array.isArray(result?.data)) {
                pass = false;
                break;
              } else {
                let data = result.data;
                lastId = data.at(-1)!.id;
                totalCount ||= result.totalCount;
                const percentage = Math.round((skip / totalCount) * 10000) / 100;
                e.component.beginCustomLoading(`正在导出数据... ${percentage}%`);
                const userTypeList = fields.filter((i) => i.valueType === '用户型');
                const userTypeList2 = fields.filter((i) => i.valueType === '分类型');
                for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
                  let item = data[rowIndex];
                  for (const column of columns) {
                    const valueMap = (column.lookup as any)?.valueMap;
                    if (valueMap && column.dataField) {
                      item[column.dataField] = valueMap[item[column.dataField]];
                    }
                    if (column.dataType === 'date' && column.dataField) {
                      if (column.format && typeof column.format == 'string') {
                        let date = formatDate(item[column.dataField], column.format);
                        item[column.dataField] = date;
                      }
                    }
                    const user =
                      userTypeList.find((its) => its.code === column.dataField) ??
                      undefined;
                    const type =
                      userTypeList2.find((its) => its.code === column.dataField) ??
                      undefined;
                    const entity = user
                      ? await orgCtrl.user.findEntityAsync(item[user.code])
                      : undefined;

                    const regex = /^.*[\u4e00-\u9fa5]+.*$/;
                    if (
                      type &&
                      column.dataField &&
                      type.lookups &&
                      type.lookups.length > 0
                    ) {
                      item[type.code] = findTextWithParent(item[type.code], type.lookups);
                    }
                    if (
                      user &&
                      column.dataField &&
                      !regex.test(item[user.code]) &&
                      item[user.code]
                    ) {
                      if (entity == undefined) {
                        if (user.lookups && user.lookups.length > 0) {
                          item[user.code] =
                            user.lookups?.filter(
                              (i) => i.relevanceId == item[user.code],
                            )[0]?.text ??
                            user.lookups?.filter((i) => i.value == item[user.code])[0]
                              ?.text;
                        }
                      } else {
                        item[user.code] = entity?.name ?? item[user.code];
                      }
                    }
                  }
                  worksheet.addRow(item);
                  if (item.redRowFlag) {
                    // 在这里添加条件判断并设置字体颜色
                    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
                      const cell = worksheet.getCell(rowIndex + skip + 2, colIndex + 1);
                      cell.font = { color: { argb: 'FF0000' } };
                    }
                  }
                }
                skip += result.data.length;
                if (e.selectedRowsOnly) {
                  pass = false;
                }
              }
            }
            workbook.xlsx.writeBuffer().then((buffer) => {
              saveAs(
                new Blob([buffer], { type: 'application/octet-stream' }),
                (props.form?.name ?? '表单') + '.xlsx',
              );
            });
            e.component.endCustomLoading();
          }
        } finally {
          lock.current = false;
        }
      }}
      filterRow={{
        visible: Array.isArray(props.dataSource) ? !!props.dataSource?.length : true,
      }}
      columnFixing={{ enabled: true }}
      scrolling={{
        showScrollbar: 'onHover',
        mode: 'standard',
      }}
      columnChooser={{
        enabled: true,
        mode: 'select',
        height: 500,
        search: {
          enabled: true,
        },
      }}
      paging={{ enabled: true }}
      pager={{
        visible: true,
        showInfo: true,
        showNavigationButtons: true,
        showPageSizeSelector: true,
        allowedPageSizes: [20, 50, 100, 200, 500],
      }}
      searchPanel={{ width: 300, highlightCaseSensitive: true, visible: true }}
      showBorders={true}
      {...props}
      onSelectionChanged={(e) => {
        if (props.selectToOrigin && props.onSelectionChanged)
          return props.onSelectionChanged(e);
        const info = { ...e };
        info.selectedRowsData = e.selectedRowsData.map((data) => {
          const newData: any = {};
          let oldData: any = {};
          fields.forEach((c) => {
            if (props.dataIndex === 'attribute') {
              if (!isUndefined(data[c.id])) {
                newData[c.id] = data[c.id];
              }
            } else {
              if (!isUndefined(data[c.code])) {
                newData[c.id] = data[c.code];
                oldData[c.code] = data[c.code];
              }
            }
          });
          if (props.metadata && props.metadata.combination?.applyType === '拆分') {
            return { ...oldData, ...newData };
          } else {
            return newData;
          }
        });
        props.onSelectionChanged?.apply(this, [info]);
      }}
      onRowDblClick={
        props.onRowDblClick ||
        ((e) => {
          const existUpdateMenu = props.dataMenus?.items?.find(
            (item) => item?.key === 'update',
          );
          const existDetailMenu = props.dataMenus?.items?.find(
            (item) => item?.key === 'detail',
          );
          (existUpdateMenu || existDetailMenu) &&
            props.dataMenus?.onMenuClick(existUpdateMenu ? 'update' : 'detail', e.data);
        })
      }>
      {props.showIndex && (
        <Column
          caption="序号"
          width={50}
          fixed
          fixedPosition="left"
          cellRender={({ rowIndex }) => rowIndex + 1}
        />
      )}
      {fields.map((field) => {
        if (props.differences && props.differences.length > 0) {
          if (props.differences.includes(field.id) || field.id === 'id') {
            return GenerateColumn(field, props.beforeSource, props.dataIndex);
          }
        } else {
          return GenerateColumn(field, props.beforeSource, props.dataIndex);
        }
      })}
      {props.onLockCell && (
        <Column dataField="业务锁" type={'buttons'} cellRender={props.onLockCell} />
      )}
      {props.dataMenus && (
        <Column
          dataField="操作"
          type={'buttons'}
          width={30}
          cellRender={(row) => {
            return (
              <Dropdown
                menu={{
                  items: props.dataMenus?.items?.filter((item) => !item.hide),
                  onClick: (info) => props.dataMenus?.onMenuClick(info.key, row.data),
                }}
                placement="bottom">
                <div
                  style={{
                    cursor: 'pointer',
                    width: '50px',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                  <AiOutlineEllipsis fontSize={18} rotate={90} />
                  更多
                </div>
              </Dropdown>
            );
          }}></Column>
      )}
      {props.select && <Selection mode="multiple" showCheckBoxesMode={'always'} />}
      <Export
        enabled
        allowExportSelectedData={props.selection ? true : false}
        formats={['xlsx']}
      />
      <Summary {...props.summary} />
    </DataGrid>
  );
};

export default GenerateThingTable;

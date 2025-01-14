import React from 'react';
import { model, schema } from '@/ts/base';
import { Dropdown } from 'antd';
import { AiOutlineEllipsis } from 'react-icons/ai';
import { GenerateColumn } from './columns';
import {
  Column,
  DataGrid,
  IDataGridOptions,
  Selection,
} from 'devextreme-react/data-grid';
import { ItemType } from 'antd/lib/menu/hooks/useItems';

interface IProps extends IDataGridOptions {
  beforeSource?: schema.XThing[];
  fields: model.FieldModel[];
  dataIndex?: 'attribute' | 'property';
  dataMenus?: {
    items: ItemType[];
    onMenuClick: (key: string, data: any) => void;
  };
  select?: boolean;
}

/** 使用form生成表单 */
const GenerateFormTable = (props: IProps) => {
  const fields = [
    {
      id: 'id',
      code: 'id',
      name: '唯一标识',
      valueType: '描述型',
      remark: '由系统生成的唯一标记,无实义.',
      options: {
        fixed: true,
        visible: true,
      },
    },
    {
      id: 'name',
      code: 'name',
      name: '名称',
      valueType: '描述型',
      remark: '描述信息',
      options: {
        fixed: true,
        visible: true,
      },
    },
    {
      id: 'code',
      code: 'code',
      name: '代码',
      valueType: '描述型',
      remark: '标识代码',
      options: {
        visible: true,
      },
    },
    ...props.fields,
    {
      id: 'belongId',
      code: 'belongId',
      name: '归属',
      valueType: '用户型',
      remark: '归属用户',
      options: {
        visible: true,
      },
    },
    {
      id: 'createUser',
      code: 'createUser',
      name: '创建人',
      valueType: '用户型',
      remark: '创建标识的人',
      options: {
        visible: true,
      },
    },
    {
      id: 'createTime',
      code: 'createTime',
      name: '创建时间',
      valueType: '时间型',
      remark: '创建标识的时间',
    },
    {
      id: 'updateTime',
      code: 'updateTime',
      name: '修改时间',
      valueType: '时间型',
      remark: '最新修改时间',
    },
  ];
  return (
    <DataGrid<schema.XForm, string>
      keyExpr="id"
      width="100%"
      height={props.height ?? '100%'}
      columnMinWidth={props.columnMinWidth ?? 80}
      focusedRowEnabled
      allowColumnReordering
      allowColumnResizing
      columnAutoWidth
      showColumnLines
      showRowLines
      rowAlternationEnabled
      hoverStateEnabled
      columnResizingMode={'widget'}
      headerFilter={{ visible: true }}
      filterRow={{ visible: true }}
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
      paging={{ pageSize: 20, enabled: true }}
      pager={{
        visible: true,
        showInfo: true,
        showNavigationButtons: true,
        allowedPageSizes: [10, 30, 40, 50, 200],
      }}
      searchPanel={{ width: 300, highlightCaseSensitive: true, visible: true }}
      showBorders={true}
      {...props}>
      {fields.map((field) => GenerateColumn(field, props.dataIndex))}
      {props.dataMenus && (
        <Column
          dataField="操作"
          type={'buttons'}
          width={30}
          cellRender={(row) => {
            return (
              <Dropdown
                menu={{
                  items: props.dataMenus?.items,
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
    </DataGrid>
  );
};

export default GenerateFormTable;

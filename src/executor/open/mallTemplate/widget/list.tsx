import React, { memo, useEffect, useRef, useState } from 'react';
import { IMallTemplate } from '@/ts/core/thing/standard/page/mallTemplate';
import { schema } from '@/ts/base';
import { DataGrid } from 'devextreme-react';
import { Button, Space } from 'antd';
import cls from '../index.module.less';
import DataDetails from '../components/dataDetails';
import { IForm, IWork } from '@/ts/core';
import { FieldModel } from '@/ts/base/model';
import { userFormatFilter } from '@/utils/tools';
import CustomStore from 'devextreme/data/custom_store';
import GenerateThingTable from '@/executor/tools/generate/thingTable';

interface IMallList {
  current: IMallTemplate;
  fields: FieldModel[];
  form: IForm;
  works?: IWork[]
  onBatchAddCar: (products: schema.XProduct[], staging?: boolean) => void;
  onPurchase: (selectedRows: schema.XProduct[], work: IWork) => void;
}

const MallList = ({ current, onBatchAddCar, onPurchase, fields, form, works }: IMallList) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [center, setCenter] = useState(<></>);
  let ref = useRef<DataGrid<schema.XThing, string>>(null);
  const onSelectionChanged = (e: any) => {
    setSelectedRows(e.selectedRowsData);
  };
  return (
    <div className={cls.mallList}>
      {selectedRows.length ? (
        <div className={cls.extraButton}>
          <Space>
            <Button type="primary" onClick={() => onBatchAddCar(selectedRows)}>
              批量加入购物车
            </Button>
            <Button type="primary" onClick={() => onBatchAddCar(selectedRows, true)}>
              批量移除购物车
            </Button>
            {works ? (
              works.map((work) => {
                return (
                  <Button
                    key={work.id}
                    type="primary"
                    onClick={() => onPurchase(selectedRows, work)}>
                    {work.name}
                  </Button>
                );
              })
            ) : (
              <></>
            )}
          </Space>
        </div>
      ) : (
        <></>
      )}
      <GenerateThingTable
        keyExpr="id"
        width="100%"
        height="100%"
        showRowLines
        allowColumnReordering
        allowColumnResizing
        columnResizingMode={'widget'}
        showBorders={true}
        reference={ref}
        fields={fields}
        remoteOperations={true}
        dataSource={
          new CustomStore({
            key: 'id',
            async load(loadOptions: any) {
              loadOptions.filter = await userFormatFilter(loadOptions.filter, form);
              loadOptions.filter = form.parseFilter(loadOptions.filter);
              const classify = form.parseClassify();
              if (loadOptions.filter.length == 0 && Object.keys(classify).length == 0) {
                return { data: [], totalCount: 0 };
              }
              loadOptions.userData = [];
              return await form.loadThing(loadOptions);
            },
          })
        }
        paging={{ enabled: true }}
        pager={{
          visible: true,
          showInfo: true,
          showNavigationButtons: true,
          showPageSizeSelector: true,
          allowedPageSizes: [20, 50, 100, 200, 500],
        }}
        headerFilter={{ visible: true }}
        scrolling={{
          showScrollbar: 'onHover',
          mode: 'standard',
        }}
        selection={{
          mode: 'multiple',
          allowSelectAll: true,
          selectAllMode: 'page',
          showCheckBoxesMode: 'always',
        }}
        rowAlternationEnabled
        hoverStateEnabled
        focusedRowEnabled
        columnFixing={{ enabled: true }}
        onSelectionChanged={onSelectionChanged}
        selectToOrigin={true}
        onRowDblClick={(e) => {
          setCenter(
            <DataDetails
              data={e.data}
              current={current}
              form={form}
              onAddCar={onBatchAddCar.bind(this, [e.data], false)}
              onPurchase={onPurchase}
              onCancel={() => setCenter(<></>)}
            />,
          );
        }}
      />
      {center}
    </div>
  );
};

export default memo(MallList);

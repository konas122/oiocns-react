import { MappingData } from '@/ts/base/model';
import { XForm, XReport } from '@/ts/base/schema';
import { isValidVariableName } from '@/utils/script';
import { Button, Card, message } from 'antd';
import { DataGrid } from 'devextreme-react';
import { Column, Paging } from 'devextreme-react/data-grid';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { FieldSelect, FieldSelectMulti } from './FieldSelect';
import { createTsDefinition } from './createTsDefinition';

interface Props {
  mappingData: MappingData[];
  onChange: (value: MappingData[], def: string) => any;
  triggers: MappingData[];
  forms?: XForm[] | XReport[];
  label?: string;
}

export default function VariableMapping(props: Props) {
  const [mappingData, setMappingData] = useState<MappingData[]>([]);

  useEffect(() => {
    setMappingData(props.mappingData || []);
  }, [props.mappingData]);

  function updateMappingData(value: MappingData[]) {
    setMappingData(value);
    props.onChange(value, createTsDefinition(value.filter((m) => m.typeName != '表单')));
  }

  const [select, setSelect] = useState<MappingData | null>(null);
  const [selectList, setSelectList] = useState<MappingData[]>([]);

  const modalHeadStyl = {
    minHeight: '28px',
    paddingLeft: '0',
    paddingTop: '0',
    border: 'none',
  };
  const bodyBorderStyl = {
    border: '1px solid #eee',
  };

  const labelFontSize = {
    fontSize: '14px',
  };

  function addVariable(newArg: MappingData) {
    if (!newArg) {
      return false;
    }
    if (!mappingData.map((a) => a.code).includes(newArg.code)) {
      return true;
    } else {
      message.error('变量名重复');
      return false;
    }
  }
  function addVariables(newArgs: MappingData[]) {
    if (newArgs.length == 0) {
      return false;
    }
    const list = _.unionBy(newArgs, (a) => a.code);
    if (list.length < newArgs.length) {
      message.error('变量名重复');
      return false;
    }

    for (const newArg of newArgs) {
      if (!isValidVariableName(newArg.code)) {
        message.error(`变量名 ${newArg.code} 非法，无法批量插入`);
        return false;
      }
      if (mappingData.map((a) => a.code).includes(newArg.code)) {
        message.error('变量名重复');
        return false;
      }
    }
    return true;
  }

  return (
    <Card
      title={
        <div className="flex" style={{ gap: '16px' }}>
          <div style={{ ...labelFontSize }} className="flex-auto">
            {props.label || '变量维护'}
          </div>
          <FieldSelect
            value={select}
            beforeChange={addVariable}
            onChange={(e) => {
              updateMappingData([{ ...e }, ...mappingData]);
              setSelect(null);
            }}
            data={props.triggers}
            forms={props.forms}
            disabled={mappingData}
            editName
            showLabel={false}
          />
          <FieldSelectMulti
            value={selectList}
            beforeChange={addVariables}
            onChange={(e) => {
              const list = [...mappingData];
              list.push(...e);
              updateMappingData(list);
              setSelectList([]);
            }}
            data={props.triggers}
            forms={props.forms}
            disabled={mappingData}
            buttonText="批量插入"
            showLabel={false}
          />
        </div>
      }
      bordered={false}
      headStyle={modalHeadStyl}
      bodyStyle={{ ...bodyBorderStyl }}>
      <DataGrid
        allowColumnResizing
        keyExpr="id"
        scrolling={{
          mode: 'standard',
        }}
        dataSource={mappingData}>
        <Paging enabled={true} pageSize={10} />
        <Column dataField="code" caption="变量代码" width="240px" />
        <Column dataField="typeName" caption="类型" width="100px" />
        <Column dataField="name" caption="对象名称" width="300px" />
        <Column dataField="formName" caption="表单名称" width="200px" />
        <Column
          caption="操作"
          width="80px"
          fixed
          fixedPosition="right"
          cellRender={(e) => {
            return (
              <Button
                style={{ color: 'red' }}
                type="text"
                size="small"
                onClick={() => {
                  updateMappingData(mappingData.filter((a) => a.key != e.data.key));
                }}>
                删除
              </Button>
            );
          }}
        />
      </DataGrid>
    </Card>
  );
}

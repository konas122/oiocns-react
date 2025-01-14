import React, { useContext, useState } from 'react';
import { IExistTypeEditor } from '../IExistTypeEditor';
import { DesignContext, PageContext } from '@/components/PageElement/render/PageContext';
import { Button, Form, Modal, Row, Switch } from 'antd';
import { PageElement } from '@/ts/element/PageElement';
import { ListTableProps } from '@/ts/element/standard/document/model';
import {
  SpeciesSummaryConfig,
} from '@/ts/element/standard/document/model';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { SEntity } from '../FileProp';

export const TableSpeciesSummaryConfig: IExistTypeEditor<SpeciesSummaryConfig> = ({
  value,
  onChange,
}) => {
  const ctx = useContext<DesignContext>(PageContext as any);
  const element = ctx.view.currentElement as PageElement<string, ListTableProps>;


  function handleSelect() {
    if (!element ) {
      return;
    }
    ctx.view.emitter('props-action', 'configSpeciesSummary', element.id);
  }

  return (
    <Row justify="space-between" align="middle" style={{ width: '100%' }}>
      {value?.classifyProp ? (
        <EntityIcon
          entity={
            {
              ...value.classifyProp,
              typeName: '属性',
            } as any
          }
          showName
        />
      ) : (
        <div>未配置</div>
      )}
      <Button type="primary" onClick={handleSelect}>
        配置
      </Button>
    </Row>
  );
};

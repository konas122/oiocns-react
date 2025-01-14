import React, { useContext, useState } from 'react';
import { IExistTypeEditor } from '../IExistTypeEditor';
import { DesignContext, PageContext } from '@/components/PageElement/render/PageContext';
import { Button, Row } from 'antd';
import { PageElement } from '@/ts/element/PageElement';
import { ListTableProps } from '@/ts/element/standard/document/model';

export const TableColumnConfig: IExistTypeEditor<void> = () => {
  const ctx = useContext<DesignContext>(PageContext as any);
  const element = ctx.view.currentElement as PageElement<string, ListTableProps>;


  function handleSelect() {
    if (!element ) {
      return;
    }
    ctx.view.emitter('props-action', 'configTableColumn', element.id);
  }


  if (!element) {
    return <></>;
  }

  return (
    <Row justify="space-between" align="middle" style={{ width: '100%' }}>
      <span>已选择{element.children.length}列</span>
      <Button type="primary" onClick={handleSelect}>
        配置
      </Button>
    </Row>
  );
};

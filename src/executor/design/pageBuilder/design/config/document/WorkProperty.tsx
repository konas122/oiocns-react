import React, { useContext, useEffect, useState } from 'react';
import { IExistTypeEditor } from '../IExistTypeEditor';
import { DesignContext, PageContext } from '@/components/PageElement/render/PageContext';
import { Button, Modal, Row, Select } from 'antd';
import { PageElement } from '@/ts/element/PageElement';
import { ListTableProps } from '@/ts/element/standard/document/model';
import { SEntity } from '../FileProp';
import { taskFields } from '@/ts/element/standard/document/fields';

export const WorkProperty: IExistTypeEditor<SEntity> = (props) => {
  const ctx = useContext<DesignContext>(PageContext as any);
  const element = ctx.view.currentElement as PageElement<string, ListTableProps>;

  const [value, setValue] = useState<SEntity | undefined>(props.value);
  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  function handleSelect() {
    let entity = value;
    const modal = Modal.confirm({
      title: '选择办事属性',
      content: (
        <Select
          style={{ width: '150px' }}
          value={entity?.id}
          onChange={(e) => {
            const item = taskFields.find((f) => f.id == e)!;
            entity = {
              id: item.id,
              name: item.name,
            };
          }}>
          {taskFields.map((f) => (
            <Select.Option key={f.id} value={f.id}>
              {f.name}
            </Select.Option>
          ))}
        </Select>
      ),
      onOk() {
        setValue(entity);
        props.onChange(entity);
        modal.destroy();
      },
      onCancel() {
        modal.destroy();
      }
    });
  }

  if (!element) {
    return <></>;
  }

  return (
    <Row justify="space-between" align="middle" style={{ width: '100%' }}>
      <span>{value?.name || ''}</span>
      <Button type="primary" onClick={handleSelect}>
        选择
      </Button>
    </Row>
  );
};

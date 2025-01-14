import { Button, Modal } from 'antd';
import React, { useState } from 'react';
import { command, kernel, model, schema } from '@/ts/base';
import { ITarget } from '@/ts/core';
import GenerateThingTable from '../generate/thingTable';
import CustomStore from 'devextreme/data/custom_store';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { XThing } from '@/ts/base/schema';
import { Form, IForm } from '@/ts/core/thing/standard/form';
import MinLayout from '@/components/MainLayout/minLayout';
import useMenuUpdate from '@/hooks/useMenuUpdate';
import { Controller } from '@/ts/controller';
import * as config from '../../open/form/config';
import { MenuItemType } from 'typings/globelType';
import { userFormatFilter } from '@/utils/tools';
import { ArchiveItem } from '@/executor/open/form/detail/archive';
interface IFormSelectProps {
  form: schema.XForm;
  fields: model.FieldModel[];
  belong: ITarget;
  metadata?: schema.XForm;
  multiple?: Boolean;
  isShowClass?: Boolean;
  onSave: (values: schema.XThing[]) => void;
  onCancel?: () => void;
  returnRawData?: boolean;
}

interface IProps {
  form: IForm;
}

const FormSelectModal = ({
  form,
  fields,
  belong,
  multiple = true,
  isShowClass,
  onSave,
  onCancel,
  returnRawData,
  metadata,
}: IFormSelectProps) => {
  const editData: {
    rows: schema.XThing[];
    rawData: schema.XThing[];
  } = {
    rows: [],
    rawData: [],
  };
  const metaForm = new Form(form, belong.directory);
  metaForm.fields = fields;

  const onCellPrepared = (e: any) => {
    if (e.column.type == 'selection' && e.rowType == 'data' && e.data?.locks?.exclusion) {
      e.cellElement.style.pointerEvents = 'none';
      e.cellElement.style.whiteSpace = 'nowrap';
      e.cellElement.style.overflow = 'hidden';
      e.cellElement.style.textOverflow = 'ellipsis';
      e.cellElement.innerHTML = '';
    }
  };

  const onLockCell = (row: any) => {
    const [loading, setLoading] = useState(false);
    if (row.data?.locks?.exclusion) {
      return (
        <Button
          type="link"
          loading={loading}
          onClick={async () => {
            setLoading(true);
            const instance = await kernel.findInstance(
              belong.id,
              belong.id,
              row.data.locks.exclusion.id,
            );
            if (instance) {
              Modal.info({
                icon: <></>,
                title: '办事详情',
                width: '80vw',
                content: (
                  <div style={{ height: '70vh', overflow: 'scroll' }}>
                    <ArchiveItem instance={instance} />
                  </div>
                ),
              });
            }
            setLoading(false);
          }}>{`锁定 （${row.data.locks.exclusion.name}）`}</Button>
      );
    }
    return <></>;
  };
  const FormBrower: React.FC<IProps> = ({ form }) => {
    const [, rootMenu, selectMenu, setSelectMenu] = useMenuUpdate(
      () => config.loadSpeciesItemMenu(form),
      new Controller(form.key),
    );
    if (!selectMenu && !rootMenu) return <></>;
    const loadcontent = () => {
      return (
        <GenerateThingTable
          form={form.metadata}
          fields={form.fields}
          metadata={metadata}
          height={'70vh'}
          selection={{
            mode: multiple ? 'multiple' : 'single', // multiple / single
            allowSelectAll: true,
            selectAllMode: 'page',
            showCheckBoxesMode: 'always',
          }}
          onCellPrepared={onCellPrepared}
          onLockCell={onLockCell}
          pager={{ visible: true }}
          onSelectionChanged={(e) => {
            editData.rows = e.selectedRowsData;
          }}
          dataSource={
            new CustomStore({
              key: 'id',
              async load(loadOptions: any) {
                loadOptions.filter = await userFormatFilter(loadOptions.filter, metaForm);
                loadOptions.filter = metaForm.parseFilter(loadOptions.filter);
                loadOptions.userData = [];
                if (selectMenu?.item?.value) {
                  loadOptions.userData.push(selectMenu?.item.value);
                } else if (selectMenu?.item?.code) {
                  loadOptions.options = loadOptions.options || {};
                  loadOptions.options.match = loadOptions.options.match || {};
                  loadOptions.options.match[selectMenu?.item.code] = { _exists_: true };
                }
                const res = await metaForm.loadThing(loadOptions);
                if (res.success && !Array.isArray(res.data)) {
                  res.data = [];
                }
                editData.rawData = res.data;
                return res;
              },
            }) as any
          }
          dataMenus={{
            items: [
              {
                key: 'detail',
                label: '详情',
              },
            ],
            onMenuClick(key: string, data: XThing) {
              if (key === 'detail') {
                command.emitter(
                  'executor',
                  'open',
                  {
                    ...data,
                    form,
                    fields,
                    formId: form.id,
                    typeName: '物详情',
                    key: data.id,
                  },
                  'preview',
                );
              }
            },
          }}
          remoteOperations={true}
          toolbar={{
            visible: true,
            items: [
              {
                name: 'columnChooserButton',
                location: 'after',
              },
              {
                name: 'searchPanel',
                location: 'after',
              },
            ],
          }}
        />
      );
    };

    return (
      <React.Fragment>
        <MinLayout
          selectMenu={selectMenu as MenuItemType}
          height={60}
          onSelect={(data) => {
            setSelectMenu(data);
          }}
          siderMenuData={rootMenu as MenuItemType}>
          {loadcontent()}
        </MinLayout>
      </React.Fragment>
    );
  };

  const loadContent = () => {
    if (isShowClass) {
      return <FormBrower form={metaForm} />;
    } else {
      return (
        <GenerateThingTable
          form={metaForm.metadata}
          fields={fields}
          height={'70vh'}
          selection={{
            mode: multiple ? 'multiple' : 'single', // multiple / single
            allowSelectAll: true,
            selectAllMode: 'page',
            showCheckBoxesMode: 'always',
          }}
          onCellPrepared={onCellPrepared}
          onLockCell={onLockCell}
          // pager={{ visible: true }}
          onSelectionChanged={(e) => {
            editData.rows = e.selectedRowsData;
          }}
          dataSource={
            new CustomStore({
              key: 'id',
              async load(loadOptions: any) {
                loadOptions.filter = await userFormatFilter(loadOptions.filter, metaForm);
                loadOptions.filter = metaForm.parseFilter(loadOptions.filter);
                loadOptions.userData = [];
                const res = await metaForm.loadThing(loadOptions);
                if (res.success && !Array.isArray(res.data)) {
                  res.data = [];
                }
                editData.rawData = res.data;
                return res;
              },
            }) as any
          }
          dataMenus={{
            items: [
              {
                key: 'detail',
                label: '详情',
              },
            ],
            onMenuClick(key: string, data: XThing) {
              if (key === 'detail') {
                command.emitter(
                  'executor',
                  'open',
                  {
                    ...data,
                    form,
                    fields,
                    formId: form.id,
                    typeName: '物详情',
                    key: data.id,
                  },
                  'preview',
                );
              }
            },
          }}
          remoteOperations={true}
          toolbar={{
            visible: true,
            items: [
              {
                name: 'columnChooserButton',
                location: 'after',
              },
              {
                name: 'searchPanel',
                location: 'after',
              },
            ],
          }}
        />
      );
    }
  };

  const modal = Modal.confirm({
    icon: <EntityIcon entityId={form.id} showName />,
    width: '80vw',
    okText: `确认选择`,
    className: 'selects-modal',
    cancelText: '关闭',
    onCancel: () => {
      modal.destroy();
      onCancel?.();
    },
    content: loadContent(),
    onOk: () => {
      modal.destroy();
      let rows = editData.rows;
      if (returnRawData) {
        rows = rows.map((row) => editData.rawData.find((d) => d.id === row.id)!);
      }
      onSave(rows);
    },
  });
};

export default FormSelectModal;

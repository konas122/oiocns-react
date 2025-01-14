import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import GenerateThingTable from '@/executor/tools/generate/thingTable';
import { model, schema } from '@/ts/base';
import { IBelong } from '@/ts/core';
import { message, Modal } from 'antd';
import CustomStore from 'devextreme/data/custom_store';
import React, { useState } from 'react';
import * as config from '../../open/form/config';
import { Form } from '@/ts/core/thing/standard/form';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { userFormatFilter } from '@/utils/tools';
import orgCtrl from '@/ts/controller';

interface IProps {
  form: schema.XForm;
  belong: IBelong;
  onSave: (values: model.InstanceDataModel | undefined) => void;
}

/** 获取办事信息 */
const WorkSelectModal = ({ form, belong, onSave }: IProps) => {
  const editData: { rows: schema.XThing[] } = { rows: [] };
  let instanceData: model.InstanceDataModel | undefined = undefined;
  const metaForm = new Form(form, belong.directory);

  const FormBrower: React.FC = () => {
    const [selectMenu, setSelectMenu] = useState<any>();

    const [loaded] = useAsyncLoad(async () => {
      await metaForm.loadFields();
      const menuData = config.loadSpeciesItemMenu(metaForm);
      setSelectMenu(menuData);
    });

    if (!selectMenu && !loaded) return <></>;

    const loadContent = () => {
      return (
        <GenerateThingTable
          key={metaForm.key}
          height={'70vh'}
          selection={{
            mode: 'single',
            allowSelectAll: true,
            selectAllMode: 'page',
            showCheckBoxesMode: 'always',
          }}
          pager={{ visible: true }}
          form={metaForm.metadata}
          fields={metaForm.fields}
          onSelectionChanged={(e) => {
            editData.rows = e.selectedRowsData;
          }}
          onRowDblClick={async (e: any) => {
            const instance = Object.values(e.data?.archives).at(
              -1,
            ) as unknown as schema.XWorkInstance;
            e.component.beginCustomLoading('数据准备中...');
            const detail = await orgCtrl.work.loadInstanceDetail(
              instance._id ?? instance.id,
              instance.shareId,
              instance.belongId,
            );
            if (detail) {
              const data = JSON.parse(detail?.data || '{}');
              instanceData = data;
            } else {
              message.warning('未查询到办事信息！');
            }
            e.component.endCustomLoading();
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
                return await metaForm.loadThing(loadOptions);
              },
            })
          }
          remoteOperations={true}
          toolbar={{
            visible: true,
            items: [],
          }}
        />
      );
    };
    return <React.Fragment>{loadContent()}</React.Fragment>;
  };

  const modal = Modal.confirm({
    icon: <EntityIcon entityId={metaForm.id} showName />,
    width: '90vw',
    okText: `确认选择`,
    className: 'selects-modal',
    cancelText: '关闭',
    onCancel: () => modal.destroy(),
    content: <FormBrower />,
    onOk: () => {
      modal.destroy();
      onSave(instanceData);
    },
  });
};

export default WorkSelectModal;

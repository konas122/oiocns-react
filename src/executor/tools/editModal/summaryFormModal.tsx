import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import GenerateThingTable from '@/executor/tools/generate/thingTable';
import { kernel, model, schema } from '@/ts/base';
import { IBelong } from '@/ts/core';
import { Modal } from 'antd';
import CustomStore from 'devextreme/data/custom_store';
import React, { useState, useEffect } from 'react';
import * as config from '../../open/form/config';
import { Form } from '@/ts/core/thing/standard/form';

interface IProps {
  form: schema.XForm;
  fields: model.FieldModel[];
  belong: IBelong;
  onSave: (values: schema.XThing[]) => void;
}

/** 汇总表单查看 */
const SummaryFormModal = ({ form, fields, belong, onSave }: IProps) => {
  const editData: { rows: schema.XThing[] } = { rows: [] };
  const metaForm = new Form(form, belong.directory);

  const FormBrower: React.FC = () => {
    const [fieldsLoaded, setFieldsLoaded] = useState(false);
    const [selectMenu, setSelectMenu] = useState<any>();
    const [speciesFields, setSpeciesFields] = useState<model.FieldModel[]>([]);
    const [summaryFields, setSummaryFields] = useState<model.FieldModel[]>([]);

    useEffect(() => {
      const loadData = async () => {
        try {
          metaForm.fields = fields;
          const menuData = config.loadSpeciesItemMenu(metaForm);
          setSummaryFields(fields.filter((item) => item.options?.isSummary));
          setFieldsLoaded(true);
          setSpeciesFields(fields.filter((i) => i.options?.species));
          setSelectMenu(menuData);
        } catch (error) {
          console.error('Error loading fields:', error);
        }
      };
      loadData();
    }, [metaForm]);

    if (!selectMenu && !fieldsLoaded) return <></>;

    const collectIds = (items: any) => {
      function traverse(items: any, ids: any[] = []) {
        for (let item of items) {
          if (item.item) {
            ids.push({ [item.item.value]: item.item.text });
          }
          if (Array.isArray(item.children) && item.children.length > 0) {
            traverse(item.children, ids);
          }
        }
        return ids;
      }

      return traverse(items);
    };

    const assetDatas = collectIds(selectMenu.children);

    const intersection = async (results: any) => {
      let arr: any[] = [];
      if (results && results.length > 0) {
        results?.forEach((result: any) => {
          assetDatas.forEach((assetData: any) => {
            let json: any = {};
            Object.keys(assetData).map((key) => {
              if (key === result[speciesFields[0].code]) {
                summaryFields?.forEach((summaryField) => {
                  json[summaryField.code] = result[summaryField.code];
                });
                json[speciesFields[0]?.code] = key;
                arr.push(json);
              }
            });
          });
        });
      }

      const createFn = async () => {
        const promises = arr.map(async (item) => {
          const res = await kernel.createThing(belong.id, [], '');
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            return { ...item, ...res.data[0] };
          }
          return item;
        });
        const updatedArr = await Promise.all(promises);
        return updatedArr;
      };

      const result = createFn().then((updatedArr) => {
        return {
          code: 200,
          data: updatedArr,
          groupCount: 0,
          msg: '成功',
          success: true,
          summary: [],
          totalCount: updatedArr.length,
        };
      });
      return result;
    };

    const loadContent = () => {
      return (
        <GenerateThingTable
          key={metaForm.key}
          height={'70vh'}
          selection={{
            mode: 'multiple',
            allowSelectAll: true,
            selectAllMode: 'page',
            showCheckBoxesMode: 'always',
          }}
          pager={{ visible: false }}
          form={metaForm.metadata}
          fields={metaForm.fields}
          onSelectionChanged={(e) => {
            editData.rows = e.selectedRowsData;
          }}
          dataSource={
            new CustomStore({
              key: 'id',
              async load(loadOptions: any) {
                loadOptions.filter = metaForm.parseFilter(loadOptions.filter);
                const classify = metaForm.parseClassify();
                if (loadOptions.filter.length == 0 && Object.keys(classify).length == 0) {
                  return { data: [], totalCount: 0 };
                }
                loadOptions.userData = [];
                if (selectMenu.item?.value) {
                  loadOptions.userData.push(selectMenu.item.value);
                } else if (selectMenu.item?.code) {
                  loadOptions.options = loadOptions.options || {};
                  loadOptions.options.match = loadOptions.options.match || {};
                  loadOptions.options.match[selectMenu.item.code] = { _exists_: true };
                }
                const summaryResult = await metaForm.loadAssetClassSummary(
                  loadOptions,
                  speciesFields[0].code,
                );
                return await intersection(summaryResult);
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
      onSave(editData.rows);
    },
  });
};

export default SummaryFormModal;

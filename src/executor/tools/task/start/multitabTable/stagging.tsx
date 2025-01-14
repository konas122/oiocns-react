import React, { useState } from 'react';
import { IWorkApply } from '@/ts/core';
import { model, schema } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import GenerateThingTable from '@/executor/tools/generate/thingTable';
import { AiFillRest } from 'react-icons/ai';
import useObjectUpdate from '@/hooks/useObjectUpdate';
import CustomStore from 'devextreme/data/custom_store';
import Confirm from '@/executor/open/reconfirm';

interface IProps {
  apply: IWorkApply;
  onShow: (instance: schema.XWorkInstance) => void;
}

/** 多tab表格 */
const WorkStagging: React.FC<IProps> = ({ onShow, apply }) => {
  const mainFormFields = apply.primaryForms![0]?.fields ?? [];
  const [key, forceUpdate] = useObjectUpdate(apply);
  const [selectStaggings, setSelectStaggings] = useState<schema.XWorkInstance[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false); //二次确认框
  const [item, setItem] = useState<any>();

  const loadMenus = () => {
    return {
      items: [
        {
          key: 'remove',
          label: '移除',
          icon: <AiFillRest fontSize={22} />,
        },
      ],
      onMenuClick: async (_: string, data: any) => {
        setIsModalOpen(true);
        setItem(data);
      },
    };
  };
  let count = 0;
  for (let i = 0; i < mainFormFields.length; i++) {
    const options = mainFormFields[i].options;
    if (options?.visible === true) {
      count++;
      if (count > 20) {
        options.visible = false;
      }
    }
  }
  const loadFields = () => {
    return [
      {
        id: 'title',
        code: 'title',
        name: '标题',
        valueType: '描述型',
        remark: '标题',
        options: {
          visible: true,
        },
      },
      {
        id: 'remark',
        code: 'remark',
        name: '备注',
        valueType: '描述型',
        remark: '备注',
        options: {
          visible: true,
        },
      },
      ...mainFormFields,
    ] as model.FieldModel[];
  };
  return (
    <>
      <GenerateThingTable
        key={key}
        form={apply.primaryForms![0]?.metadata}
        fields={loadFields()}
        remoteOperations={true}
        dataMenus={loadMenus()}
        onSelectionChanged={(e) => {
          setSelectStaggings(e.selectedRowsData);
        }}
        selection={{
          mode: 'multiple',
          allowSelectAll: true,
          selectAllMode: 'page',
          showCheckBoxesMode: 'always',
        }}
        onRowDblClick={async (e) => {
          let data = e.data;
          const res = await orgCtrl.user.workStagging.find([e.data.id]);
          if (res.length > 0) {
            data = res[0];
          }
          onShow.apply(this, [data]);
        }}
        dataIndex="attribute"
        dataSource={
          new CustomStore({
            key: 'id',
            async load(loadOptions) {
              let request: any = {
                ...loadOptions,
                userData: [],
                options: {
                  project: {
                    data: 0,
                  },
                  match: {
                    defineId: apply.metadata.defineId,
                  },
                  sort: {
                    createTime: -1,
                  },
                },
              };
              const res = await orgCtrl.user.workStagging.loadResult(request);
              if (res.success && !Array.isArray(res.data)) {
                res.data = [];
              }
              const { data } = res;
              const lastData = data.map((val) => {
                if (val.data) {
                  const filedsVal = JSON.parse(val.data);
                  return {
                    ...val,
                    ...filedsVal.primary,
                  };
                }
                return val;
              });
              res.data = lastData || [];
              return res;
            },
          })
        }
        summary={{}}
        toolbar={{
          visible: true,
          items: [
            {
              name: 'remove',
              location: 'after',
              widget: 'dxButton',
              options: {
                text: '移除',
                icon: 'remove',
                onClick: () => {
                  orgCtrl.user.workStagging.removeMany(selectStaggings);
                  forceUpdate();
                },
              },
              visible: selectStaggings.length > 0,
            },
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
      <Confirm
        open={isModalOpen}
        onOk={async () => {
          const success = await orgCtrl.user.workStagging.remove(item);
          if (success) {
            forceUpdate();
          }
          setIsModalOpen(false);
        }}
        onCancel={() => {
          setIsModalOpen(false);
        }}
      />
    </>
  );
};

export default WorkStagging;

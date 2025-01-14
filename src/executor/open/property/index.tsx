import React, { useState } from 'react';
import { IProperty, ISpecies } from '@/ts/core';
import PageCard from '@/components/PageCard';
import cls from './index.module.less';
import EntityInfo from '@/components/Common/EntityInfo';
import FullScreenModal from '@/components/Common/fullScreen';
import CustomStore from 'devextreme/data/custom_store';
import GenerateFormTable from '@/executor/tools/generate/form/formTable';
import message from '@/utils/message';

type IProps = {
  current: IProperty & ISpecies;
  finished: () => void;
};

/*
  弹出框表格查询
*/
const PropertyModal: React.FC<IProps> = ({ current, finished }) => {
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const hasRelationAuth = current.target.hasRelationAuth();
  return (
    <FullScreenModal
      open
      centered
      fullScreen
      width={'80vw'}
      destroyOnClose
      title={current.typeName + '管理'}
      onCancel={() => finished()}
      footer={[]}>
      <EntityInfo entity={current} hasRelationAuth={hasRelationAuth} />
      <PageCard
        className={cls[`card-wrap`]}
        bordered={false}
        tabList={[
          {
            tab: `关联表单`,
            key: 'Items',
          },
        ]}>
        <GenerateFormTable
          key={current.key}
          height={500}
          fields={[]}
          scrolling={{ mode: 'standard' }}
          pager={{
            visible: true,
            allowedPageSizes: [20, 50, 'all'],
            displayMode: 'full',
            showInfo: true,
            showPageSizeSelector: true,
            showNavigationButtons: true,
          }}
          dataSource={
            new CustomStore({
              key: 'id',
              async load(loadOptions: any) {
                switch (current.typeName) {
                  case '属性':
                    loadOptions.userData = [];
                    return await current.loadBindingForms(loadOptions);
                  case '字典':
                    loadOptions.userData = [];
                    return await current.loadBindingProperity(loadOptions);
                  case '分类':
                    loadOptions.userData = [];
                    return await current.loadBindingProperity(loadOptions);
                  default:
                    break;
                }
              },
            })
          }
          remoteOperations={true}
          toolbar={{
            visible: true,
            items: [
              {
                widget: 'dxButton',
                location: 'after',
                options: {
                  text: loading ? '更新中，请等待' : '更新关联字典项信息',
                  icon: 'edit',
                  disabled: loading,
                  onClick: async () => {
                    setLoading(true);
                    if (await current.updateDictionaries()) {
                      message.info('更新成功');
                    } else {
                      message.error('更新失败');
                    }
                    setLoading(false);
                  },
                },
                visible: current.metadata.valueType === '选择型',
              },
              {
                widget: 'dxButton',
                location: 'after',
                options: {
                  text: running ? '更新中，请等待' : '更新表单引用',
                  icon: 'edit',
                  disabled: running,
                  onClick: async () => {
                    setRunning(true);
                    if (await current.updateForms()) {
                      message.info('更新成功');
                    } else {
                      message.error('更新失败');
                    }
                    setRunning(false);
                  },
                },
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
      </PageCard>
    </FullScreenModal>
  );
};

export default PropertyModal;

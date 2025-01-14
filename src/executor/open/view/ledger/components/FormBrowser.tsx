import { schema } from '@/ts/base';
import type { IDirectory, IFinancial, IView } from '@/ts/core';
import { message, Tabs } from 'antd';
import React, { memo, useEffect, useState, useRef } from 'react';
import FormContents from './FormContents';

export interface IFormBrowserProps {
  loadOptions?: any;
  latestAndOldestBillingPeriods?: any;
  period: any;
  current: IView;
  form: schema.XForm;
  treeData?: any;
  directory: IDirectory;
  onUpdatePeriod: (values: string[]) => void;
}

const FormBrowser = ({
  loadOptions,
  period,
  current,
  form,
  directory,
  latestAndOldestBillingPeriods,
  onUpdatePeriod,
}: IFormBrowserProps) => {
  const [tabsActiveKey, setTabsActiveKey] = useState<string>('ledger');
  const belong = directory.target.space;
  const financial: IFinancial = belong.financial;
  const [species, setSpecies] = useState<any>();
  const fields = useRef<any>([]);

  useEffect(() => {
    (async () => {
      const queries = await financial.loadQueries(true, 0, loadOptions);
      const KJKM = queries.find(
        (item) => item.metadata.species.name === '单位会计科目名称',
      );
      if (KJKM) {
        financial.query?.setMetadata({
          ...KJKM.metadata,
          id: financial.query.metadata.id,
        });
        fields.current = KJKM.metadata.fields;
        if (financial.query) {
          const species = await financial.query.loadSpecies(
            true,
            [KJKM.metadata.species],
            loadOptions,
          );
          setSpecies(species);
        }
      } else {
        message.error('无会计查询方案，请在月结账-总账中添加！');
      }
    })();
  }, [loadOptions]);

  const formContentsMixOptions = {
    loadOptions,
    period,
    current,
    form,
    fields: fields.current,
    directory,
    species,
    latestAndOldestBillingPeriods,
    onUpdatePeriod,
  };

  return (
    <div>
      <Tabs
        size="large"
        activeKey={tabsActiveKey}
        items={[
          {
            label: '总账',
            key: 'ledger',
            children: <FormContents type="ledger" {...formContentsMixOptions} />,
          },
          {
            label: '余额表',
            key: 'sum',
            children: <FormContents type="sum" {...formContentsMixOptions} />,
          },
        ]}
        onChange={(value) => {
          setTabsActiveKey(value);
        }}
      />
    </div>
  );
};

export default memo(FormBrowser);

import React, { useEffect, useState } from 'react';
import { IView } from '@/ts/core';
import { Emitter } from '@/ts/base/common';
import ReportViewer from './reportViewer';
import { XFormOptions } from '@/ts/base/schema';
import { Empty, Spin, Tabs } from 'antd';
import { Form } from '@/ts/core/thing/standard/form';
import { schema } from '@/ts/base';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import LoadingView from '@/components/Common/Loading';

interface IProps {
  current: IView;
  notityEmitter: Emitter;
}

const ReportRender: React.FC<IProps> = ({ current, notityEmitter }: IProps) => {
  const [formOptions, setFormOptions] = useState<XFormOptions[]>(
    current.metadata.options?.formOptions ?? [],
  );
  const [proOptions, setProOptions] = useState<any[]>([]);

  useEffect(() => {
    const id = notityEmitter.subscribe((_, type, _data) => {
      if (type === 'form') {
        setFormOptions(current.metadata.options?.formOptions ?? []);
      }
    });
    return () => {
      notityEmitter.unsubscribe(id);
    };
  }, []);

  const getFormOptions = async (formOptions: schema.XFormOptions[]) => {
    const newOptions = await Promise.all(
      formOptions.map(async (item) => {
        let metaForm = new Form(item.metadata, current.directory);
        const data = await metaForm.load();
        return {
          ...item,
          data: data,
        };
      }),
    );
    return newOptions;
  };

  const [loaded] = useAsyncLoad(async () => {
    const result = await getFormOptions(formOptions);
    setProOptions(result);
  }, [formOptions]);

  if (!loaded) {
    return (
      <div className="loading-page">
        <LoadingView text="配置信息加载中..." />
      </div>
    );
  }

  return (
    <>
      {formOptions.length > 0 ? (
        <div>
          <Tabs
            type={'card'}
            tabPosition={'bottom'}
            items={proOptions.map((item, _index) => {
              return {
                label: item.name,
                key: item.id,
                children: (
                  <ReportViewer
                    current={current}
                    form={item.data}
                    readonly={true}
                    height={'calc(85vh - 20px)'}
                    allowEdit={false}
                  />
                ),
              };
            })}
          />
        </div>
      ) : (
        <Empty>暂未获取到配置信息</Empty>
      )}
    </>
  );
};

export default ReportRender;

import OpenFileDialog from '@/components/OpenFileDialog';
import { model, schema } from '@/ts/base';
import { Node, Tree } from '@/ts/base/common';
import { IFinancial, IForm } from '@/ts/core';
import { SumItem } from '@/ts/core/work/financial/statistics/summary';
import { ProTable } from '@ant-design/pro-components';
import { Button } from 'antd';
import React, { useEffect, useState } from 'react';
import { FullScreen } from '..';
import SnapshotForm, { changeColumns } from '../changes';

interface SummaryProps {
  financial: IFinancial;
  tree: Tree<SumItem>;
  node: Node<SumItem>;
  species: model.FieldModel;
  field: model.FieldModel;
}

interface QueryProps extends SummaryProps {
  prefix: string;
  finished: () => void;
  child: (open: (params: OpenProps) => void) => React.ReactNode;
}

interface ChangeProps extends SummaryProps {
  between: [string, string];
  symbol?: number;
}

export interface OpenProps {
  period: string;
  type: string;
  id: string;
}

export function LedgerModal(props: QueryProps) {
  const [form, setForm] = useState(props.financial.form);
  const [center, setCenter] = useState(<></>);

  const open = async (params: OpenProps) => {
    if (!form) {
      setForm(await props.financial.loadForm());
    } else {
      setCenter(
        <SnapshotForm
          financial={props.financial}
          form={form}
          period={params.period}
          type={params.type}
          id={params.id}
          onFinished={() => setCenter(<></>)}
        />,
      );
    }
  };

  useEffect(() => {
    const id = props.financial.subscribe(async () => {
      setForm(await props.financial.loadForm());
    });
    return () => {
      props.financial.unsubscribe(id);
    };
  }, []);
  return (
    <>
      <FullScreen
        title={props.node.data.name + '-' + props.field.name + '-' + props.prefix}
        onFinished={props.finished}
        onCancel={props.finished}
        fullScreen={false}>
        {props.child(open)}
      </FullScreen>
      {center}
    </>
  );
}

interface OpenFormProps {
  openForm: (params: OpenProps) => void;
}

interface ChangeTableProps extends ChangeProps, OpenFormProps {
  export: () => Promise<void>;
  match?: { [key: string]: any };
}

export function ChangeTable(props: ChangeTableProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<model.LoadResult<schema.XChange[]>>();
  const [size, setSize] = useState(10);
  const [center, setCenter] = useState(<></>);
  async function loadData(page: number, pageSize: number) {
    setLoading(true);
    setData(
      await props.financial.loadChanges({
        species: props.species.id,
        between: props.between,
        node: props.node,
        field: props.field,
        symbol: props.symbol,
        offset: (page - 1) * pageSize,
        limit: pageSize,
        match: props.match,
      }),
    );
    setLoading(false);
  }
  const openAddFile = () => {
    const configuration = props.financial.configuration;
    setCenter(
      <OpenFileDialog
        multiple
        accepts={['描述型', '数值型']}
        rootKey={props.financial.space.directory.key}
        excludeIds={configuration.metadata?.customFields?.map((item) => item.id) ?? []}
        onOk={(files) => {
          configuration.setCustomFields([
            ...(configuration.metadata?.customFields ?? []),
            ...files.map((item) => item.metadata as schema.XProperty),
          ]);
          setCenter(<></>);
        }}
        onCancel={() => setCenter(<></>)}
      />,
    );
  };
  useEffect(() => {
    const result = props.financial.subscribe(() => loadData(1, size));
    return () => {
      props.financial.unsubscribe(result);
    };
  }, []);
  return (
    <>
      <ProTable<schema.XChange>
        rowKey={'id'}
        style={{ marginTop: 8 }}
        search={false}
        options={false}
        loading={loading}
        dataSource={data?.data}
        scroll={{ x: 'max-content' }}
        toolBarRender={() => [
          <Button key={'addField'} disabled={loading} onClick={() => openAddFile()}>
            添加字段
          </Button>,
          <Button
            key={'export'}
            loading={loading}
            onClick={async () => {
              setLoading(true);
              await props.export();
              setLoading(false);
            }}>
            导出
          </Button>,
        ]}
        pagination={{
          pageSize: size,
          total: data?.totalCount ?? 0,
          showSizeChanger: true,
          onChange(current, size) {
            loadData(current, size);
          },
          onShowSizeChange(current, size) {
            setSize(size);
            loadData(current, size);
          },
        }}
        columns={changeColumns(
          props.financial,
          props.species,
          props.tree,
          props.openForm,
        ).map((item) => {
          return {
            key: item.dataIndex,
            title: item.header ?? item.title,
            align: item.style?.align,
            render: (_, row) => {
              return item.render?.(row);
            },
          };
        })}
      />
      {center}
    </>
  );
}

export interface SetFormProps {
  financial: IFinancial;
  finished: () => void;
}

export const SetFormFile = (props: SetFormProps) => {
  return (
    <OpenFileDialog
      accepts={['表单']}
      rootKey={props.financial.space.directory.key}
      onOk={async (files) => {
        if (files && files.length > 0) {
          const file = files[0] as IForm;
          await props.financial.setForm(file.metadata);
        }
        props.finished();
      }}
      onCancel={() => props.finished()}
    />
  );
};

import FullScreenModal from '@/components/Common/fullScreen';
import WorkFormViewer from '@/components/DataStandard/WorkForm/Viewer';
import { common, model, schema } from '@/ts/base';
import { IFinancial, IForm } from '@/ts/core';
import { SumItem } from '@/ts/core/work/financial/statistics/summary';
import FormService from '@/ts/scripting/core/services/FormService';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import { formatNumber } from '@/utils';
import { Space } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { OpenProps } from '../ledger/ledgerModel';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';

interface IProps {
  financial: IFinancial;
  form: IForm;
  period: string;
  type: string;
  id: string;
  onFinished: () => void;
}

const loadCustomFields = (financial?: IFinancial): model.Column<schema.XChange>[] => {
  if (financial?.configuration) {
    return financial.configuration.customFields.map((item) => {
      return {
        key: item.id,
        dataIndex: item.id,
        title: item.name,
        style: { width: 20 },
        render: (row) => {
          return row.snapshot?.[item.id] ?? row.thing?.[item.id];
        },
        format: (row) => {
          return row.snapshot?.[item.id] ?? row.thing?.[item.id];
        },
        header: (
          <div>
            {item.name}
            <span
              style={{ marginLeft: 8, color: 'red', cursor: 'pointer' }}
              onClick={() => {
                financial.configuration.setCustomFields(
                  financial.configuration.metadata?.customFields?.filter((field) => {
                    return field.id !== item.id.replace('T', '');
                  }) ?? [],
                );
              }}>
              ×
            </span>
          </div>
        ),
      };
    });
  }
  return [];
};

export const changeColumns = (
  financial: IFinancial,
  species: model.FieldModel,
  tree: common.Tree<SumItem>,
  openForm?: (params: OpenProps) => void,
): model.Column<schema.XChange>[] => {
  return [
    {
      dataIndex: 'name',
      title: '办事',
      style: { width: 20 },
      render: (row) => {
        return row.name;
      },
      format: (row) => {
        return row.name;
      },
    },
    {
      dataIndex: 'changeTime',
      title: '期间',
      style: { width: 20 },
      render: (row) => {
        return row.changeTime;
      },
      format: (row) => {
        return row.changeTime;
      },
    },
    {
      dataIndex: 'thingId',
      title: '物的唯一标识',
      style: { width: 30 },
      format: (row) => {
        return row.thingId;
      },
      render: (row) => {
        return (
          <a
            onClick={async () =>
              openForm?.({
                period: '',
                type: 'snapshot',
                id: row.snapshotId,
              })
            }>
            {row.thingId}
          </a>
        );
      },
    },
    {
      dataIndex: 'dimension',
      title: '分类',
      style: { width: 20 },
      format: function (row) {
        const speciesId = species.id;
        const value = row[speciesId];
        if (value && typeof value == 'string') {
          const node = tree.nodeMap.get(value);
          return node?.data.name;
        }
      },
      render: function (row) {
        return this.format?.(row);
      },
    },
    {
      dataIndex: 'before',
      title: '变动前',
      style: { align: 'right', width: 20 },
      format: function (row) {
        return formatNumber(row.before ?? 0, 2, true);
      },
      render: function (row) {
        return <span>{this.format?.(row)}</span>;
      },
    },
    {
      dataIndex: 'after',
      title: '变动后',
      style: { align: 'right', width: 20 },
      format: function (row) {
        return formatNumber(row.after ?? 0, 2, true);
      },
      render: function (row) {
        return <span>{this.format?.(row)}</span>;
      },
    },
    {
      dataIndex: 'change',
      title: '变动值',
      style: { align: 'right', width: 20 },
      format: function (row) {
        return formatNumber((row.change ?? 0) * row.symbol, 2, true);
      },
      render: function (row) {
        return <span>{this.format?.(row)}</span>;
      },
    },
    ...loadCustomFields(financial),
    {
      dataIndex: 'labels',
      title: '变更源',
      style: { width: 20 },
      render: (row) => {
        return (
          <Space direction="vertical">
            {(row.labels ?? []).map((item: string, index: number) => {
              return (
                <EntityIcon
                  key={index}
                  belong={financial?.space}
                  typeName={'属性'}
                  showName
                  entityId={item.substring(1)}
                />
              );
            })}
          </Space>
        );
      },
    },
  ];
};

const SnapshotForm: React.FC<IProps> = (props) => {
  const [data, setData] = useState<schema.XThing>();
  const server = useRef(
    new FormService(
      props.form.metadata,
      WorkFormService.createStandalone(
        props.financial.space,
        props.form.metadata,
        props.form.fields,
      ),
    ),
  );
  const initializing = async () => {
    let result: schema.XThing | undefined;
    switch (props.type) {
      case 'snapshot':
        result = await props.financial.findSnapshot(props.id);
        break;
      case 'thing':
        result = await props.financial.findThing(props.period, props.id);
        break;
    }
    const fields = await props.form.loadFields();
    if (result) {
      for (const field of fields) {
        if (result[field.code]) {
          result[field.id] = result[field.code];
        }
      }
      setData(result);
    }
  };
  useEffect(() => {
    initializing();
  });
  if (!data) {
    return;
  }
  return (
    <FullScreenModal
      open
      fullScreen
      title={'物快照'}
      onOk={() => props.onFinished()}
      onCancel={() => props.onFinished()}
      destroyOnClose={true}
      cancelText={'关闭'}
      width={1200}>
      <WorkFormViewer allowEdit={false} data={data} service={server.current} />
    </FullScreenModal>
  );
};

export default SnapshotForm;

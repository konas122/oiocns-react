import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Divider, Table, message } from 'antd';
import { DocumentNodeMapping, DocumentPropertyMapping, IDocumentConfigHost, WorkNodeModel } from '@/ts/base/model';
import { IForm, IWork } from '@/ts/core';
import cls from './index.module.less';
import { Theme } from '@/config/theme';
import DocumentModal, { isForm } from './DocumentModal';
import { XDocumentTemplate } from '@/ts/base/schema';
import OpenFileDialog from '@/components/OpenFileDialog';
import { ColumnsType } from 'antd/lib/table';
import _ from 'lodash';
import { delay } from '@/ts/base/common/timer';
interface IProps {
  formHost: IWork | IForm;
  current: IDocumentConfigHost;
}

const DocumentConfig: React.FC<IProps> = (props) => {
  const [docs, setDocs] = useState<XDocumentTemplate[]>([]);
  const [mapping, setMapping] = useState<Dictionary<DocumentPropertyMapping[]>>({});
  const [nodeMapping, setNodeMapping] = useState<Dictionary<DocumentNodeMapping[]>>({});
  const [visible, setVisible] = useState(false);
  const [openType, setOpenType] = useState('add');
  const [row, setRow] = useState<XDocumentTemplate | null>(null);

  const currentMapping = useMemo(() => {
    return row ? [
      mapping[row.id] || [],
      nodeMapping[row.id] || [],
    ] as [DocumentPropertyMapping[], DocumentNodeMapping[]] : null;
  }, [mapping, row]);

  useEffect(() => {
    setDocs(props.current.documentConfig?.templates ?? []);
    setMapping(props.current.documentConfig?.propMapping ?? {});
    setNodeMapping(props.current.documentConfig?.nodeMapping ?? {});
  }, [props.current.documentConfig]);

  function updateDocs(docs: XDocumentTemplate[]) {
    setDocs(docs);
    const docIds = docs.map((b) => b.id);
    props.current.documentConfig = {
      templates: docs,
      propMapping: Object.fromEntries(
        Object.entries(mapping).filter(([id]) => docIds.includes(id)),
      ),
      nodeMapping: Object.fromEntries(
        Object.entries(nodeMapping).filter(([id]) => docIds.includes(id)),
      ),
    };
  }

  function updateMapping(currentMapping: [DocumentPropertyMapping[], DocumentNodeMapping[]]) {
    mapping[row!.id] = currentMapping[0];
    nodeMapping[row!.id] = currentMapping[1];
    props.current.documentConfig = {
      templates: docs,
      propMapping: { ...mapping },
      nodeMapping: { ...nodeMapping },
    };
  }

  const columns: ColumnsType<XDocumentTemplate> = [
    // { title: '序号', valueType: 'index' },
    {
      title: '标识',
      dataIndex: 'code',
      width: 80,
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 200,
    },
    {
      title: '操作',
      dataIndex: 'operate',
      fixed: 'right',
      render: (_: any, record: XDocumentTemplate) => {
        return (
          <div>
            <Button
              type="link"
              size="small"
              style={{ marginRight: '4px' }}
              className={cls['flowDesign-rule-edit']}
              onClick={() => {
                setOpenType('edit');
                setRow(record);
                setVisible(true);
              }}>
              配置映射
            </Button>
            <Button
              type="link"
              danger
              size="small"
              className={cls['flowDesign-rule-delete']}
              onClick={() => {
                updateDocs(docs.filter((b) => b.code != record.code));
              }}>
              删除
            </Button>
          </div>
        );
      },
      width: 120,
    },
  ];

  function open() {
    if (!isForm(props.formHost)) {
      if (props.formHost.primaryForms.length == 0 && props.formHost.detailForms.length == 0) {
        message.warning('当前环节没有配置表单！');
        return;        
      }
    }
    setOpenType('add');
    setVisible(true);
  }

  function renderButtons() {
    return (
      <div className={cls.layout}>
        <Table rowKey="id" columns={columns} dataSource={docs} pagination={false} />
      </div>
    );
  }

  return (
    <Card
      type="inner"
      className={cls['card-info']}
      title={
        <div>
          <Divider
            type="vertical"
            style={{
              height: '16px',
              borderWidth: '4px',
              borderColor: Theme.FocusColor,
              marginLeft: '0px',
            }}
          />
          <span>文档模板配置</span>
        </div>
      }
      bodyStyle={{ padding: docs.length > 0 ? '8px' : 0 }}
      extra={
        <>
          <a
            className="primary-color"
            onClick={() => {
              open();
            }}>
            添加
          </a>
        </>
      }>
      {docs.length > 0 && renderButtons()}
      {visible &&
        (openType == 'edit' ? (
          <DocumentModal
            current={row!}
            mapping={currentMapping![0]}
            nodeMapping={currentMapping![1]}
            formHost={props.formHost}
            onOk={(mapping, nodeMapping) => {
              updateMapping([mapping, nodeMapping]);
              setVisible(false);
            }}
            onCancel={() => setVisible(false)}
          />
        ) : (
          <OpenFileDialog
            accepts={['文档模板']}
            rootKey={props.formHost.directory.spaceKey}
            allowInherited
            onOk={async (files) => {
              const newDocs = files.map(
                (f) => _.omit(f.metadata, ['rootElement']) as XDocumentTemplate,
              );
              updateDocs([
                ...docs,
                ...newDocs,
              ]);
              setVisible(false);
              await delay(50);

              setOpenType('edit');
              setRow(newDocs[0]);
              setVisible(true);
            }}
            onCancel={() => setVisible(false)}
          />
        ))}
    </Card>
  );
};
export default DocumentConfig;

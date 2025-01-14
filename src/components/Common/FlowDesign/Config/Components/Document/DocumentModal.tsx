import { DocumentNodeMapping, DocumentPropertyMapping, WorkNodeModel } from '@/ts/base/model';
import { XDocumentTemplate, XEntity } from '@/ts/base/schema';
import { IFileInfo, IForm, IWork } from '@/ts/core';
import { Button, Modal, Select, Space, Table, message } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { getAllProps, getAllWorkNodes } from '@/ts/element/standard/document/util';
import { getAllNodes } from '@/utils/work';
import { PageElement } from '@/ts/element/PageElement';
import cls from './index.module.less';

export function isForm(entity: IFileInfo<XEntity>): entity is IForm {
  return entity.typeName == '表单' || entity.typeName == '报表';
}

interface DocumentPropertyMappingView extends DocumentPropertyMapping {
  propCode: string;
  propName: string;
  formName: string;
}
interface DocumentNodeMappingView extends DocumentNodeMapping {
  nodeName: string;
}

interface IProps {
  current: XDocumentTemplate;
  mapping: DocumentPropertyMapping[];
  nodeMapping: DocumentNodeMapping[];
  formHost: IWork | IForm;
  onOk: (propMapping: DocumentPropertyMapping[], nodeMapping: DocumentNodeMapping[]) => void;
  onCancel: () => void;
}

const DocumentModal: React.FC<IProps> = (props) => {
  const [loading, setLoading] = useState(true);
  const [mapping, setMapping] = useState<DocumentPropertyMappingView[]>([]);
  const [nodeMapping, setNodeMapping] = useState<DocumentNodeMappingView[]>([]);
  const [nodes, setNodes] = useState<WorkNodeModel[]>([]);

  const forms = useMemo(() => {
    if (isForm(props.formHost)) {
      return {
        [props.formHost.id]: props.formHost
      };
    }
    return props.formHost.forms.reduce<Dictionary<IForm>>((a, v) => {
      a[v.id] = v;
      return a;
    }, {});
  }, [props.formHost]);

  const formList = useMemo(() => Object.values(forms), [forms]);

  useEffect(() => {
    loadDocumentContent();
  }, []);

  function initPropMapping(rootElement: PageElement) {
    const propertyList = getAllProps([rootElement]);
    let mappingView: DocumentPropertyMappingView[] = [];
    let allMappings = [...props.mapping];
    for (const p of propertyList) {
      let m = allMappings.find((m) => m.propId == p.id) as DocumentPropertyMappingView;
      if (!m) {
        m = {
          propId: p.id,
          propCode: '',
          propName: p.name,
          formId: '',
          formName: '',
        };
      } else {
        const form = forms[m.formId];
        if (form) {
          m.formName = form.name;
          const attr = form.attributes.find((p) => p.propId == m.propId);
          if (attr) {
            m.propName = attr.name;
            m.propCode = attr.property!.code;
          } else {
            m.propName = m.propId;
            m.propCode = '';
          }
        } else {
          m.formName = '已移除的表单' + m.formId;
        }
      }
      mappingView.push(m);
    }
    setMapping(mappingView);
  }

  function initNodeMapping(rootElement: PageElement) {
    const nodeList = getAllWorkNodes([rootElement]);

    if (isForm(props.formHost)) {
      if (nodeList.length > 0) {
        message.error('表单关联的文档模板不能包含办事审批环节元素！');
      }
      return;
    }

    const nodes = getAllNodes(props.formHost.node!);
    setNodes(nodes);

    
    let mappingView: DocumentNodeMappingView[] = [];
    let allMappings = [...props.nodeMapping];
    for (const n of nodeList) {
      let m = allMappings.find((m) => m.nodeKey == n.nodeKey) as DocumentNodeMappingView;
      if (!m) {
        m = {
          nodeKey: n.nodeKey,
          nodeId: '',
          nodeName: '',
        };
      } else {
        const node = nodes.find((n) => n.primaryId == m.nodeId);
        if (node) {
          m.nodeName = node.destName || node.name;
        } else {
          m.nodeName = '已移除的环节 ' + m.nodeId;
        }
      }
      mappingView.push(m);
    }

    setNodeMapping(mappingView);
  }

  async function loadDocumentContent() {
    const [temp] = await props.formHost.directory.resource.documentColl.find([
      props.current.id,
    ]);
    if (!temp) {
      return;
    }

    initPropMapping(temp.rootElement);
    initNodeMapping(temp.rootElement);

    setLoading(false);
  }

  function bindProps() {
    const mappings = [...mapping];
    const primaryForms = isForm(props.formHost) ? [props.formHost] : props.formHost.primaryForms;
    for (const form of primaryForms) {
      for (const attr of form.attributes) {
        for (const m of mappings) {
          if (m.propId == attr.propId) {
            m.formId = form.id;
            m.formName = form.name;
            m.propCode = attr.property!.code;
            mappings.splice(mappings.indexOf(m), 1);
            break;
          }
        }
      }
    }
    setMapping([...mapping]);
    message.success('匹配完成');
  }

  function handleFinish() {
    if (mapping.some((m) => !m.formId)) {
      message.warn('存在属性没有绑定表单');
      return;
    }
    if (nodeMapping.some((m) => !m.nodeId)) {
      message.warn('存在办事环节没有绑定');
      return;
    }
    props.onOk(
      mapping.map(
        (m) => _.omit(m, ['propName', 'formName', 'propCode']) as DocumentPropertyMapping,
      ),
      nodeMapping.map(
        (m) => _.omit(m, ['nodeName']) as DocumentNodeMapping,
      ),
    );
  }

  if (loading) {
    return <></>;
  }

  return (
    <Modal
      destroyOnClose
      title="元素映射"
      width={720}
      open={true}
      bodyStyle={{ border: 'none', padding: 0, marginLeft: '32px', marginRight: '32px' }}
      onOk={() => handleFinish()}
      onCancel={props.onCancel}>
      <div className={cls['topbar']}>
        <div>属性映射</div>
        <Button type="primary" style={{ marginBottom: '8px' }} onClick={bindProps}>
          自动匹配
        </Button>
      </div>

      <Table dataSource={mapping} rowKey="propId">
        <Table.Column dataIndex="propName" title="属性名称" />
        <Table.Column
          dataIndex="propCode"
          title="属性编号"
          render={(_, record: DocumentPropertyMappingView) => {
            return record.propCode;
          }}
        />
        <Table.Column
          dataIndex="formName"
          title="绑定表单"
          render={(_, record: DocumentPropertyMappingView) => {
            return (
              <Select placeholder="选择表单" 
                style={{ width: '300px' }}
                value={record.formId} 
                onChange={(e) => {
                  record.formId = e;
                  const form = formList.find((n) => n.id == e)!;
                  record.formName = form.name;
                  setMapping([...mapping]);
                }}>
                {formList.map((n) => {
                  return (
                    <Select.Option key={n.id} value={n.id}>
                      {n.name}
                    </Select.Option>
                  );
                })}
              </Select>
            );
          }}
        />
      </Table>

      <div className={cls['topbar']}>
        <div>办事环节映射</div>
      </div>

      <Table dataSource={nodeMapping} rowKey="nodeKey">
        <Table.Column dataIndex="nodeKey" title="元素环节标识" />
        <Table.Column
          dataIndex="nodeId"
          title="环节ID"
          render={(_, record: DocumentNodeMappingView) => {
            return record.nodeId;
          }}
          width={120}
        />
        <Table.Column
          dataIndex="nodeName"
          title="绑定环节"
          render={(_, record: DocumentNodeMappingView) => {
            return (
              <Select placeholder="选择环节" 
                style={{ width: '300px' }}
                value={record.nodeId} 
                onChange={(e) => {
                  record.nodeId = e;
                  const node = nodes.find((n) => n.primaryId == e)!;
                  record.nodeName = node.destName || node.name;
                  setNodeMapping([...nodeMapping]);
                }}>
                {nodes.map((n) => {
                  return (
                    <Select.Option key={n.id} value={n.primaryId}>
                      {n.destName || n.name}
                    </Select.Option>
                  );
                })}
              </Select>
            );
          }}
        />
      </Table>
    </Modal>
  );
};
export default DocumentModal;

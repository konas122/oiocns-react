import { WorkDocumentConfig } from '@/ts/base/model';
import { IWorkTask } from '@/ts/core';
import React, { useEffect, useState } from 'react';
import { Button, Dropdown, message } from 'antd';
import { DocumentTemplate, IDocumentTemplate } from '@/ts/core/thing/standard/document';
import { DownOutlined } from '@ant-design/icons';

import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import _ from 'lodash';
import { DocumentViewerModal } from '@/executor/open/document/DocumentViewerModal';

interface Props {
  current: IWorkTask;
  service: WorkFormService;
}

export function DocumentContent({ current, service }: Props) {
  const [docConfig, setDocConfig] = useState<WorkDocumentConfig>({
    propMapping: {},
    nodeMapping: {},
    templates: [],
  });
  const [docs, setDocs] = useState<IDocumentTemplate[]>([]);
  const [currentDocument, setCurrentDocument] = useState<IDocumentTemplate | null>(null);
  const [loaded, setLoaded] = useState(false);


  async function loadDocuments() {
    try {
      if (!current.instanceData) {
        return;
      }

      // const work = (await current.findWorkById(
      //   current.taskdata.defineId,
      // )) as unknown as IWork;

      const config = current.instanceData.node.documentConfig;
      if (!config) {
        return;
      }

      setDocConfig(config);
      const target = current.user.targets.find((t) => t.id == current.taskdata.shareId);
      if (!target) {
        console.warn(`找不到发起单位或者集群 ${current.taskdata.shareId}，无法加载文档模板`);
        return;
      }

      const docMetas = await target.resource.documentColl.find(
        config.templates.map((t) => t.id),
      );
      const docs = docMetas.map((d) => new DocumentTemplate(d, target.directory));

      setDocs(docs);
      setLoaded(true);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, [current.instanceData]);

  if (!current.instance) {
    return <></>;
  }

  return (
    <div className="flex flex-auto items-center print-content" style={{ gap: '16px' }}>
      {loaded && docs.length > 0 && (
        <>
          <Dropdown
            trigger={['click']}
            menu={{
              items: docs.map((d) => {
                return {
                  key: d.id,
                  label: d.name,
                  value: d.id,
                  onClick: () => {
                    setCurrentDocument(d);
                  },
                };
              }),
            }}>
            <Button>
              打印文档 <DownOutlined />
            </Button>
          </Dropdown>
        </>
      )}
      {currentDocument && (
        <DocumentViewerModal
          current={currentDocument}
          service={service}
          task={current}
          onCancel={() => setCurrentDocument(null)}
        />
      )}
    </div>
  );
}

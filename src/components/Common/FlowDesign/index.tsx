import React, { useEffect, useState } from 'react';
import { IWork } from '@/ts/core';
import ReactDOM from 'react-dom';
import {
  convertNode,
  correctWorkNode,
  loadNilResouce,
  loadResource,
  ValidationInfo,
  WorkNodeDisplayModel,
} from '@/utils/work';
import ProcessTree from './ProcessTree';
import { Resizable } from 'devextreme-react';
import { Button, Layout, message, Tabs } from 'antd';
import useCtrlUpdate from '@/hooks/useCtrlUpdate';
import Config from './Config';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { AiOutlineSave } from 'react-icons/ai';
import { model, schema } from '@/ts/base';
import { $confirm } from '@/utils/react/antd';
import VersionInfo from './Config/versionInfo';
import FlowSetting from './Config/flowSetting';
import LoadingView from '../Loading';
import { Work } from '@/ts/core/work';
import orgCtrl from '@/ts/controller';

interface IProps {
  current: IWork;
  isEdit?: boolean;
  finished: () => void;
}

const Design: React.FC<IProps> = ({ current, isEdit = true, finished }) => {
  const [saveElement, setSaveElement] = useState<any>();
  const [loaded, resource] = useAsyncLoad(async () => {
    setSaveElement(document.getElementById('modal-save'));
    const node = await current.loadNode();
    if (node && node.code) {
      return loadResource(correctWorkNode(node));
    }
    return loadNilResouce();
  }, [current]);
  const [key, Refresh] = useCtrlUpdate(current);
  const [mainWidth, setMainWidth] = useState<number | string>('70%');
  const [currentNode, setCurrentNode] = useState<WorkNodeDisplayModel>(resource);
  const [tabKey, setTabKey] = useState<string>('node');
  useEffect(() => {
    if (!currentNode) setCurrentNode(resource);
  });

  // 更新门户数据
  const updateHome = async (data: schema.XWorkDefine) => {
    const newWork = new Work(data, current.application);
    // 如果办事存在常用中把新办事替换旧办事
    if (orgCtrl.home.current.commons.find((item) => item.id === current.id)) {
      if (orgCtrl.home.current.typeName === '单位') {
        await current.toggleCommon(true);
        await newWork.toggleCommon(true);
      } else {
        await current.toggleCommon();
        await newWork.toggleCommon();
      }
    }
    await orgCtrl.home.loadCommons();
  };

  const onSave = async () => {
    await $confirm({
      title: '发布流程',
      content: '确定发布当前流程吗？',
    });
    const validation: ValidationInfo = {
      isPass: true,
      hasGateway: false,
    };
    //数据结构转化
    const resource_ = convertNode(resource, validation);
    if (validation.isPass) {
      current.metadata.hasGateway = validation.hasGateway;
      const res = await current.update({
        ...current.metadata,
        node: resource_,
      } as model.WorkDefineModel);
      if (res.success) {
        if (location.hash.includes('home')) {
          await updateHome(res.data);
        }
        message.info('保存成功');
        finished();
      }
    }
  };

  if (!loaded || !currentNode) {
    return (
      <div className="loading-page">
        <LoadingView text="资源信息加载中..." />
      </div>
    );
  }
  return (
    <Layout>
      {current.isUsed &&
        ReactDOM.createPortal(
          <Button size="small" type="primary" onClick={() => onSave()}>
            <AiOutlineSave size={16} style={{ verticalAlign: 'middle' }} />
            <span
              style={{
                fontSize: '12px',
                marginLeft: '2px',
                lineHeight: '24px',
                verticalAlign: 'middle',
              }}>
              发布
            </span>
          </Button>,
          saveElement,
        )}
      <Resizable
        handles={'right'}
        width={mainWidth}
        maxWidth={800}
        minWidth={200}
        onResize={(e) => setMainWidth(e.width)}>
        <Layout.Sider key={key} width={'100%'} style={{ height: '100%' }}>
          <ProcessTree
            target={current.directory.target}
            isEdit={isEdit}
            resource={resource}
            isGroupWork={current.typeName == '集群模板'}
            version={current.metadata.version}
            onSelectedNode={(node) => {
              setCurrentNode(node);
            }}
          />
        </Layout.Sider>
      </Resizable>
      <Layout.Content>
        <Tabs
          key={current.id}
          defaultActiveKey="node"
          activeKey={tabKey}
          onChange={(key) => setTabKey(key)}
          items={[
            {
              label: `节点信息`,
              key: 'node',
              children: (
                <Config
                  key={currentNode.id}
                  node={currentNode}
                  rootNode={resource}
                  define={current}
                  refresh={Refresh}
                  isGroupWork={current.typeName == '集群模板'}
                />
              ),
            },
            {
              label: `流程信息`,
              key: 'flow',
              children: <FlowSetting current={current} />,
            },
            {
              label: `基本信息`,
              key: 'version',
              children: <VersionInfo current={current} />,
            },
          ]}
        />
      </Layout.Content>
    </Layout>
  );
};

export default Design;

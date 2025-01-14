import { XReportTreeNode } from '@/ts/base/schema';
import { Form, Modal, Progress, message } from 'antd';
import React, { useEffect, useState } from 'react';

import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { IReportTree } from '@/ts/core';
import { EntityInput } from '@/components/Common/EntityInput';
import _ from 'lodash';
import { WithChildren } from '@/ts/base/common/tree';
import { useFixedCallback } from '@/hooks/useFixedCallback';

interface ProgressingProps {
  tree: IReportTree;
  data: WithChildren<XReportTreeNode>[];
  total: number;
  finished: () => void;
}

const Progressing = ({ data, tree, total, finished }: ProgressingProps) => {
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);

  const onProgress = useFixedCallback((v: Error | number) => {
    if (v instanceof Error) {
      setHasError(true);
    } else {
      setProgress(parseFloat(v.toFixed(2)));
      if (v >= 100) {
        finished();
      }
    }
  });

  async function generate() {
    await tree.cloneNodes(data, total, onProgress);
  }
  useEffect(() => {
    generate();
  }, []);
  return (
    <div className="flex flex-col flex-auto justify-center items-center">
      <Progress percent={progress} />
      {hasError ? (
        <span>合并失败</span>
      ) : (
        <span style={{ marginTop: '20px' }}>
          {progress >= 100 ? '合并成功' : '正在合并'}
        </span>
      )}
    </div>
  );
};

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  tree: IReportTree;
  rootNode: XReportTreeNode;
}

export function MergeModal(props: Props) {
  const srcTree = props.tree;

  const [destTree, setDestTree] = useState<IReportTree | null>(null);
  const [data, setData] = useState<WithChildren<XReportTreeNode>[]>([]);
  const [count, setCount] = useState(0);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [startReceive, setStartReceive] = useState(false);

  const handleOk = async () => {
    if (!destTree) {
      return;
    }
    if (destTree.metadata.treeType != srcTree.metadata.treeType) {
      message.warning('两棵报表树的类型不一致');
      return;
    }

    try {
      setConfirmLoading(true);
      let nodes = _.cloneDeep(await destTree.loadNodes(true));
      const root = nodes.find((n) => n.id == destTree.metadata.rootNodeId);
      if (!destTree.metadata.rootNodeId || !root) {
        message.warning('被合并树形找不到根节点');
        return;
      }

      const subTree = await destTree.loadSubTree(root);
      subTree[0].parentId = props.rootNode.parentId;

      setData(subTree);
      setCount(nodes.length);
      setStartReceive(true);
    } catch (error) {
      message.warning(error instanceof Error ? error.message : String(error));
      setConfirmLoading(false);
    }
  };

  return (
    <Modal
      title="树形合并"
      open={props.open}
      closable={false}
      destroyOnClose
      confirmLoading={confirmLoading}
      width={700}
      onOk={handleOk}
      maskClosable={false}
      onCancel={() => {
        props.setOpen(false);
      }}>
      {startReceive ? (
        <Progressing
          tree={srcTree}
          data={data}
          total={count}
          finished={async () => {
            await srcTree.hardDeleteNode(props.rootNode);
            setConfirmLoading(false);
            message.success('合并成功');
            props.setOpen(false);
          }}
        />
      ) : (
        <Form preserve={false} layout="vertical">
          <Form.Item label="当前节点" name="rootNode" required>
            <EntityIcon entity={props.rootNode} showName />
          </Form.Item>
          <Form.Item label="被合并树形" name="destTree" required>
            <EntityInput
              typeName="报表树"
              value={destTree?.id}
              directory={srcTree.directory.target.space.directory}
              onChange={() => {}}
              rootKey={'dist'}
              onValueChange={(f) => {
                setDestTree(f as IReportTree);
              }}
            />
          </Form.Item>
          <div>所选报表树的所有节点将会替换掉当前节点</div>
        </Form>
      )}
    </Modal>
  );
}

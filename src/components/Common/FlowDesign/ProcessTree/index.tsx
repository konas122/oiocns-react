import {
  WorkNodeDisplayModel,
  isBranchNode,
  dataType,
  getNewBranchNode,
} from '@/utils/work';
import { Button, Card, Layout, Space, message } from 'antd';
import cls from './index.module.less';
import { decodeAppendDom } from './Components';
import { ITarget } from '@/ts/core';
import React, { useState } from 'react';
import { AiOutlineMinus, AiOutlinePlus } from 'react-icons/ai';
import { generateUuid } from '@/ts/base/common';
import { AddNodeType, getNodeName, getNodeCode } from '@/utils/work';

type IProps = {
  target?: ITarget;
  version?: string;
  isEdit: boolean;
  isGroupWork: boolean;
  resource: WorkNodeDisplayModel;
  onSelectedNode: (params: WorkNodeDisplayModel) => void;
};

/**
 * 流程树
 * @returns
 */
const ProcessTree: React.FC<IProps> = ({
  target,
  version,
  resource,
  onSelectedNode,
  isEdit,
  isGroupWork,
}) => {
  const [key, setKey] = useState(0);
  const [scale, setScale] = useState<number>(100);
  const [nodeMap] = useState(new Map<string, WorkNodeDisplayModel>());

  // 获取节点树
  const getDomTree = (node?: WorkNodeDisplayModel): any => {
    if (node && node.code) {
      nodeMap.set(node.code, node);
      if (node.branches && node.branches.length > 0) {
        //遍历分支节点，包含并行及条件节点
        let branchItems = node.branches.map((branchNode: any, index: number) => {
          nodeMap.set(branchNode.code, branchNode);
          let childDoms = getDomTree(branchNode.children);
          //插入4条横线，遮挡掉条件节点左右半边线条
          insertCoverLine(index, childDoms, node.branches.length - 1);
          return (
            <div key={branchNode.key} className={cls[`branch-node-item`]}>
              {loadNodeDom(branchNode)}
              {childDoms}
            </div>
          );
        });
        return [
          <div key={generateUuid()}>
            <div className={cls['branch-node']}>
              <div className={cls['add-branch-btn']}>
                {isEdit && (
                  <Button
                    className={cls[`add-branch-btn-el`]}
                    onClick={() => addBranchNode(node)}>
                    {`添加${getNodeName(node.type)}`}
                  </Button>
                )}
              </div>
              {branchItems}
            </div>
            {getDomTree(node.children)}
          </div>,
        ];
      }
      return [
        <div key={generateUuid()} className={cls['primary-node']}>
          {loadNodeDom(node)}
          {getDomTree(node.children)}
        </div>,
      ];
    }
    return [];
  };

  // 加载节点
  const loadNodeDom = (node: WorkNodeDisplayModel) => {
    return decodeAppendDom(
      node,
      {
        isEdit,
        target,
        level: 1,
        config: node,
        //定义事件，插入节点，删除节点，选中节点，复制/移动
        onInsertNode: (type: any) => insertNode(type, node),
        onDelNode: () => delNode(node),
        onSelected: () => onSelectedNode(node),
      },
      isGroupWork,
    );
  };

  // 新增连线
  const insertCoverLine = (index: number, doms: any[], maxIndex: number) => {
    //最左侧分支
    if (index === 0) {
      doms.unshift(<div key={getNodeCode()} className={cls['line-top-left']} />);
      doms.unshift(<div key={getNodeCode()} className={cls['line-bot-left']} />);
    } else if (index === maxIndex) {
      //最右侧分支
      doms.unshift(<div key={getNodeCode()} className={cls['line-top-right']} />);
      doms.unshift(<div key={getNodeCode()} className={cls['line-bot-right']} />);
    }
  };

  //处理节点插入逻辑
  const insertNode = (type: AddNodeType, parentNode: any) => {
    //缓存一下后面的节点
    let nextNode = parentNode.children || {};
    let newNode: any = {
      type: type,
      name: getNodeName(type),
      code: getNodeCode(),
      parentCode: parentNode.code,
      primaryForms: [],
      detailForms: [],
      executors: [],
      formRules: [],
      authoritys: [],
      containCompany: true,
      forms: [],
    };
    let isBrance = true;
    switch (type as AddNodeType) {
      case AddNodeType.CONDITION:
      case AddNodeType.CONCURRENTS:
        newNode.branches = [getNewBranchNode(newNode, 1), getNewBranchNode(newNode, 2)];
        break;
      case AddNodeType.GATEWAY:
        isBrance = false;
        newNode.destType = '其他办事';
        nextNode.parentCode = newNode.code;
        newNode.children = nextNode;
        break;
      case AddNodeType.ORGANIZATIONA:
        newNode.branches = [
          getNewBranchNode(newNode, 1),
          {
            ...getNewBranchNode(newNode, 1, [
              {
                pos: -1,
                paramKey: '0',
                paramLabel: '组织',
                display: '其他组织',
                key: 'EQ',
                label: '=',
                type: dataType.BELONG,
                val: '0',
              },
            ]),
            readonly: true,
            name: '其他分支',
          },
        ];
        break;
      default:
        isBrance = false;
        nextNode.parentCode = newNode.code;
        newNode.children = nextNode;
        break;
    }
    if (isBrance) {
      let emptyCode = getNodeCode();
      newNode.children = {
        code: getNodeCode(),
        type: AddNodeType.EMPTY,
        parentCode: newNode.code,
        children: nextNode,
      };
      nextNode.parentCode = emptyCode;
    }
    parentNode.children = newNode;
    setKey(key + 1);
  };

  //删除当前节点
  const delNode = (node: WorkNodeDisplayModel) => {
    //获取该节点的父节点
    let parentNode = nodeMap.get(node.parentCode);
    if (parentNode) {
      //判断该节点的父节点是不是分支节点
      if (isBranchNode(parentNode.type) && parentNode.branches) {
        //移除该分支
        parentNode.branches.splice(parentNode.branches.indexOf(node), 1);
        //处理只剩1个分支的情况
        if (parentNode.branches.length < 2) {
          //获取条件组的父节点
          let ppNode = nodeMap.get(parentNode.parentCode)!;
          //判断唯一分支是否存在业务节点
          if (parentNode.branches[0].children && parentNode.branches[0].children.code) {
            //将剩下的唯一分支头部合并到主干
            ppNode.children = parentNode.branches[0].children;
            ppNode.children.parentCode = ppNode.code;
            //搜索唯一分支末端最后一个节点
            let endNode = getBranchEndNode(parentNode.branches[0]);
            //后续节点进行拼接, 这里要取EMPTY后的节点
            endNode.children = parentNode.children?.children;
            if (endNode.children && endNode.children.code) {
              endNode.children.parentCode = endNode.code;
            }
          } else {
            //直接合并分支后面的节点，这里要取EMPTY后的节点
            ppNode.children = parentNode.children?.children;
            if (ppNode.children && ppNode.children.code) {
              ppNode.children.parentCode = ppNode.code;
            }
          }
        }
      } else {
        //不是的话就直接删除
        if (node.children && node.children.code) {
          node.children.parentCode = parentNode.code;
        }
        parentNode.children = node.children;
      }
      setKey(key + 1);
    } else {
      message.warning('出现错误，找不到上级节点😥');
    }
  };

  // 获取分支结束节点
  const getBranchEndNode: any = (conditionNode: any) => {
    if (!conditionNode.children || !conditionNode.children.code) {
      return conditionNode;
    }
    return getBranchEndNode(conditionNode.children);
  };

  // 添加分支
  const addBranchNode = (node: any) => {
    if (node.type == AddNodeType.ORGANIZATIONA) {
      node.branches.splice(
        node.branches.length - 1,
        0,
        getNewBranchNode(node, node.branches.length),
      );
    } else {
      node.branches.push(getNewBranchNode(node, node.branches.length + 1));
    }
    setKey(key + 1);
  };

  return (
    <div className={cls['company-info-content']}>
      <Card bordered={false}>
        <Layout>
          <Layout.Content>
            <div className={cls['publish']}>
              <Space>
                <div>v{version} 版本</div>
                <Button
                  className={cls['scale']}
                  size="small"
                  disabled={scale <= 40}
                  onClick={() => setScale(scale - 10)}>
                  <AiOutlineMinus />
                </Button>
                <span>{scale}%</span>
                <Button
                  size="small"
                  className={cls['scale']}
                  disabled={scale >= 150}
                  onClick={() => setScale(scale + 10)}>
                  <AiOutlinePlus />
                </Button>
              </Space>
            </div>
            {/* 基本信息组件 */}
            <div>
              <div className={cls['container']}>
                <div className={cls['layout-body']}>
                  <div style={{ height: 'calc(100vh - 220px )', overflowY: 'auto' }}>
                    <div
                      className={cls['design']}
                      style={{ transform: `scale(${(scale ?? 100) / 100})` }}>
                      <div className={cls['_root']}>{getDomTree(resource)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Layout.Content>
        </Layout>
      </Card>
    </div>
  );
};

export default ProcessTree;

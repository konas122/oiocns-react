import CardOrTable from '@/components/CardOrTableComp';
import EntityInfo from '@/components/Common/EntityInfo';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import FullScreenModal from '@/components/Common/fullScreen';
import SearchTargetItem from '@/components/DataStandard/WorkForm/Viewer/customItem/searchTarget';
import PageCard from '@/components/PageCard';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import useObjectUpdate from '@/hooks/useObjectUpdate';
import { schema } from '@/ts/base';
import { IBelong, ITarget, TargetType, IReportTree, ISpecies } from '@/ts/core';
import { treeTypeNames } from '@/ts/core/thing/standard/reporttree/consts';
import { $confirm } from '@/utils/react/antd';
import { ProColumns } from '@ant-design/pro-table';
import {
  Button,
  Descriptions,
  Modal,
  Progress,
  Radio,
  Row,
  Spin,
  Typography,
  message,
  Breadcrumb,
} from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import cls from './index.module.less';
import ReportTreeNodeModal from './itemModal';
import ReportTree from '@/executor/design/reportTreeModal/ReportTree';
import { Uploader } from './uploadTemplate';
import * as el from '@/utils/excel';
import {
  ReportTreeNodeHandler,
  ReportTreeNodeSheet,
} from '@/utils/excel/sheets/standard/reporttreenode';
import _ from 'lodash';
import { EntityInput } from '@/components/Common/EntityInput';
import { SpeciesItemSelect } from './SpeciesItemSelect';
import { MergeModal } from './MergeModal';

type IProps = {
  current: IReportTree;
  readonly?: boolean;
  finished: () => void;
};

export function createWarning() {
  return $confirm({
    content: (
      <span>
        <span>当前报表树形已存在节点，确实要全部删除并重新生成吗？</span>
        <br />
        <span>如果该树形已绑定报表任务，可能造成数据查询异常！</span>
      </span>
    ),
    type: 'warning',
  });
}

/** 报表树节点信息列 */
export const ReportTreeNodeColumn = (
  belong: IBelong,
): ProColumns<schema.XReportTreeNode>[] => {
  return [
    {
      title: '序号',
      valueType: 'index',
      width: 60,
    },
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      width: 200,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '节点类型',
      dataIndex: 'nodeTypeName',
      key: 'nodeTypeName',
      width: 150,
    },
    {
      title: '上级节点',
      dataIndex: 'parentId',
      key: 'parentId',
      width: 200,
      render: (_: any, record: schema.XReportTreeNode) => {
        return (
          <EntityIcon
            entityId={record.parentId}
            typeName="报表树节点"
            showName
            belong={belong}
          />
        );
      },
    },
    {
      title: '关联组织或分类',
      dataIndex: 'targetId',
      key: 'targetId',
      width: 200,
      render: (_: any, record: schema.XReportTreeNode) => {
        return (
          <EntityIcon
            entityId={record.targetId}
            showName
            empty={<span>{record.targetName}</span>}
          />
        );
      },
    },
    {
      title: '归属组织',
      dataIndex: 'belongId',
      editable: false,
      key: 'belongId',
      width: 200,
      render: (_: any, record: schema.XReportTreeNode) => {
        return <EntityIcon entityId={record.belongId} showName />;
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      className: 'no-wrap',
    },
    {
      title: '创建人',
      dataIndex: 'createUser',
      editable: false,
      key: 'createUser',
      width: 150,
      render: (_: any, record: schema.XReportTreeNode) => {
        return <EntityIcon entityId={record.createUser} showName />;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 200,
      editable: false,
    },
  ];
};

/*
  弹出框表格查询
*/
const ReportTreeModal: React.FC<IProps> = ({ current, finished, readonly }) => {
  const [activeModel, setActiveModel] = useState<string>('');
  const [item, setItem] = useState<schema.XReportTreeNode>();

  const [currentTarget, setCurrentTarget] = useState('');
  const [currentTargetName, setCurrentTargetName] = useState('');
  const [selectType, setSelectType] = useState(1);
  const [speciesId, setSpeciesId] = useState('');
  const [species, setSpecies] = useState<ISpecies | null>(null!);
  const [parentId, setParentId] = useState('');

  const [tkey, tforceUpdate] = useObjectUpdate(current);
  const [loaded] = useAsyncLoad(() => loadNodes());
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [filterNodes, setFilterNodes] = useState<schema.XReportTreeNode[]>(current.nodes);
  const [treeNodes, setTreeNodes] = useState<schema.XReportTreeNode[]>([]);
  const [adjustmentTreeNodes, setAdjustmentTreeNodes] = useState<
    schema.XReportTreeNode[]
  >([]);
  const [adjustmentNodeMap, setAdjustmentNodeMap] = useState<
    Dictionary<schema.XReportTreeNode>
  >({});
  const [adjustmentLoaded, setAdjustmentLoaded] = useState<boolean>(false);
  const excel = useRef<el.Excel>(null!);
  const [uploadOpen, setUploadOpen] = useState(false);

  const leftTreeStyle = collapsed
    ? { transform: 'translateX(-300px)' }
    : { transform: 'translateX(0px)' };
  const rightContentStyle = collapsed ? { marginLeft: 0 } : { marginLeft: 250 };

  const nodeMap = useMemo(() => {
    return current.nodes.reduce<Dictionary<schema.XReportTreeNode>>((a, v) => {
      a[v.id] = v;
      return a;
    }, {});
  }, [filterNodes]);

  const loadNodes = async () => {
    if (!current.metadata.rootNodeId) {
      const xReportTreeNodes = await current.loadNodes();
      setFilterNodes(xReportTreeNodes);
      setTreeNodes(xReportTreeNodes);
    } else {
      await current.loadNodeById([current.metadata.rootNodeId]);
      setFilterNodes(current.nodes);
      setTreeNodes(current.nodes);
    }
    tforceUpdate();
  };

  const loadChildren = async (parentId: string) => {
    const reportTreeNodes = await current.loadChildren(parentId);
    setFilterNodes(reportTreeNodes);
    return reportTreeNodes;
  };

  const loadAdjustmentNodes = async () => {
    try {
      await current.loadNodeById([current.metadata.rootNodeId]);
      // 假设 current.nodes 是扁平化的数组
      const nestedNodes = buildTree(current.nodes, current.metadata.rootNodeId);
      setAdjustmentTreeNodes(nestedNodes);
      setAdjustmentNodeMap(
        current.nodes.reduce<Dictionary<schema.XReportTreeNode>>((acc, node) => {
          acc[node.id] = node;
          return acc;
        }, {}),
      );
      setAdjustmentLoaded(true);
    } catch (error) {
      message.error('加载调整树节点失败');
    }
  };

  // 辅助函数：将扁平化数组转换为嵌套的树结构
  const buildTree = (
    nodes: schema.XReportTreeNode[],
    rootId: string,
  ): schema.XReportTreeNode[] => {
    const map: Dictionary<
      schema.XReportTreeNode & { children?: schema.XReportTreeNode[] }
    > = {};
    const roots: schema.XReportTreeNode[] = [];

    nodes.forEach((node) => {
      map[node.id] = { ...node, children: [] };
    });

    nodes.forEach((node) => {
      if (node.parentId === rootId || !node.parentId) {
        roots.push(map[node.id]);
      } else if (map[node.parentId]) {
        map[node.parentId].children = map[node.parentId].children || [];
        map[node.parentId].children!.push(map[node.id]);
      }
    });

    return roots;
  };
  const loadAdjustmentChildren = async (parentId: string) => {
    try {
      const children = await current.loadChildren(parentId);
      const newChildren = children.filter((child) => !adjustmentNodeMap[child.id]);

      if (newChildren.length > 0) {
        setAdjustmentTreeNodes((prev) => addChildrenToTree(prev, parentId, newChildren));
        setAdjustmentNodeMap((prev) => {
          const newMap = { ...prev };
          newChildren.forEach((node) => {
            newMap[node.id] = node;
          });
          return newMap;
        });
      }

      return newChildren;
    } catch (error) {
      message.error('加载子节点失败');
      return [];
    }
  };

  // 辅助函数：将子节点添加到对应的父节点下
  const addChildrenToTree = (
    tree: schema.XReportTreeNode[],
    parentId: string,
    children: schema.XReportTreeNode[],
  ): schema.XReportTreeNode[] => {
    return tree.map((node) => {
      if (node.id === parentId) {
        return {
          ...node,
          children: node.children ? [...node.children, ...children] : children,
        };
      } else if (node.children) {
        return {
          ...node,
          children: addChildrenToTree(node.children, parentId, children),
        };
      }
      return node;
    });
  };
  const getBreadcrumbPath = (currentId: string): schema.XReportTreeNode[] => {
    const path: schema.XReportTreeNode[] = [];
    let currentNode = adjustmentNodeMap[currentId];
    while (currentNode) {
      path.unshift(currentNode);
      if (!currentNode.parentId) break;
      currentNode = adjustmentNodeMap[currentNode.parentId];
    }
    return path;
  };
  const handleBreadcrumbClick = (id: string) => {
    setParentId(id);
  };

  async function generateReportTree(target: ITarget) {
    if (!loaded) {
      return;
    }
    if (current.nodes.length > 0) {
      await createWarning();
      await current.clearAllNodes();
      await loadNodes();
    }
    setActiveModel('generate');
    setProgress(0);

    setTimeout(async () => {
      try {
        await current.generateNodes(target, (v) => {
          if (v instanceof Error) {
            setErrorMessage(v.message);
          } else {
            setProgress(v);
            if (v >= 100) {
              message.success('生成成功');
              loadNodes();
            }
          }
        });
      } catch (error: any) {
        setErrorMessage(error.message);
      }
    }, 0);
  }

  const renderBtns = () => {
    if (readonly) {
      if (readonly) {
        return <></>;
      }
    }
    return (
      <>
        <Button type="link" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '展开树' : '收起树'}
        </Button>
        <Button type="link" onClick={async () => {}}>
          生成报表树节点
        </Button>
        <Button
          type="link"
          onClick={async () => {
            excel.current = new el.Excel(current.directory.target.space as IBelong, [
              new ReportTreeNodeHandler(new ReportTreeNodeSheet(current.directory)),
            ]);
            setUploadOpen(true);
          }}>
          导入
        </Button>
        <Button type="link" onClick={() => setActiveModel('add')}>
          新增节点
        </Button>
        <Button
          type="link"
          onClick={async () => {
            let modalInstance: any;
            try {
              // 显示显眼的提示信息
              modalInstance = Modal.info({
                title: '加载中',
                content: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Spin />
                    <span>正在加载所有节点路径，请稍后...</span>
                  </div>
                ),
                okButtonProps: { style: { display: 'none' } }, // 隐藏确定按钮
                closable: false, // 不可关闭
                maskClosable: false, // 禁止点击遮罩关闭
              });
              // 调用 updateAllNodePaths 方法
              await current.updateAllNodePaths();
              // 提示成功信息
              message.success('所有节点路径已成功更新');
            } catch (error) {
              console.error('加载所有节点路径失败:', error);
              message.error('加载节点路径失败，请检查日志');
            } finally {
              // 无论成功或失败，都关闭提示信息
              if (modalInstance) {
                modalInstance.destroy();
              }
            }
          }}>
          加载所有节点路径
        </Button>
      </>
    );
  };

  // 操作内容渲染函数
  const renderOperate = (item: schema.XReportTreeNode) => {
    if (readonly) {
      return [];
    }
    const operates = [
      {
        key: `编辑节点`,
        label: `编辑节点`,
        onClick: () => {
          setItem(item);
          setActiveModel('edit');
        },
      },
      {
        key: `新增子节点`,
        label: `新增子节点`,
        onClick: () => {
          setItem(item);
          setActiveModel('add');
        },
      },
      {
        key: `调整上下级`,
        label: `调整上下级`,
        onClick: async () => {
          setItem(item);
          setParentId('');
          setActiveModel('parent');
          // 初始化调整树
          await loadAdjustmentNodes();
        },
      },
      {
        key: `变更关联组织`,
        label: `变更关联组织`,
        onClick: () => {
          setItem(item);
          setCurrentTarget(item.targetId);
          setActiveModel('target');
        },
      },
      {
        key: `变更归属组织`,
        label: `变更归属组织`,
        onClick: () => {
          setItem(item);
          setCurrentTarget(item.belongId);
          setActiveModel('belong');
        },
      },
      {
        key: `加载节点路径`,
        label: `加载节点路径`,
        onClick: async () => {
          try {
            // 调用按需加载路径的方法
            const childrenWithPaths = await current.loadChildrenSelect(item.parentId);
            message.success('节点路径已加载并存储到数据库');
            // 更新前端数据
            setFilterNodes(childrenWithPaths);
            // loadNodes();
          } catch (error) {
            message.error('加载节点路径失败');
            console.error(error);
          }
        },
      },
      {
        key: `删除节点`,
        label: <span style={{ color: 'red' }}>删除节点</span>,
        onClick: async () => {
          Modal.confirm({
            content: '确实要删除所选节点及其下级吗？',
            onOk: async () => {
              await current.hardDeleteNode(item, true);
              loadNodes();
            },
          });
        },
      },
    ];
    if (!item.parentId) {
      operates.unshift({
        key: `设置根节点`,
        label: `设置根节点`,
        onClick: async () => {
          const tree = { ...current.metadata };
          tree.rootNodeId = item.id;
          await current.update(tree);
          loadNodes();
        },
      });
    }
    if (item.nodeType == 1) {
      operates.unshift({
        key: `合并树形`,
        label: `合并树形`,
        onClick: () => {
          if (current.nodes.some((n) => n.parentId == item.id)) {
            message.warning('被合并的节点不能有子节点');
            return;
          }
          setItem(item);
          setActiveModel('merge');
        },
      });
    }
    return operates;
  };
  const TitleItems = [
    {
      tab: `${current.typeName}节点`,
      key: 'Items',
    },
  ];

  const loadReportTreeNodeModal = () => {
    if (activeModel == 'add' || (activeModel == 'edit' && item != undefined)) {
      return (
        <ReportTreeNodeModal
          open
          data={item}
          current={current}
          typeName={current.typeName}
          operateType={activeModel}
          handleCancel={() => {
            setActiveModel('');
            setItem(undefined);
          }}
          handleOk={(success: boolean) => {
            if (success) {
              message.success('操作成功');
              setItem(undefined);
              setActiveModel('');
              loadNodes();
            }
          }}
        />
      );
    } else if (activeModel == 'belong' && item != undefined) {
      return (
        <Modal
          open
          title="变更归属组织"
          onOk={async () => {
            let newItem = _.cloneDeep(item);
            newItem.belongId = currentTarget;
            await current.updateNode(item, newItem);

            message.success('操作成功');
            setActiveModel('');
            setCurrentTarget('');
            setItem(undefined);
            loadNodes();
          }}
          onCancel={() => {
            setActiveModel('');
            setCurrentTarget('');
            setItem(undefined);
          }}>
          <Row style={{ marginBottom: '16px' }}>
            <div>变更归属组织会影响谁可以发起报表任务办事</div>
          </Row>
          <Row style={{ marginBottom: '16px' }}>
            <div>
              节点：<span>{item.name}</span>
            </div>
          </Row>
          <Row>
            <SearchTargetItem
              style={{ width: '100%' }}
              value={currentTarget}
              typeName={TargetType.Company}
              onValueChanged={(e) => setCurrentTarget(e.value)}
            />
          </Row>
        </Modal>
      );
    } else if (activeModel == 'target' && item != undefined) {
      return (
        <Modal
          open
          title="变更关联组织"
          onOk={async () => {
            let newItem = _.cloneDeep(item);
            newItem.targetId = currentTarget;
            if (selectType == 2) {
              newItem.targetName = currentTargetName;
            }
            await current.updateNode(item, newItem);

            message.success('操作成功');
            setActiveModel('');
            setCurrentTarget('');
            setItem(undefined);
            loadNodes();
          }}
          onCancel={() => {
            setActiveModel('');
            setCurrentTarget('');
            setItem(undefined);
          }}>
          <div className="flex flex-col" style={{ gap: '16px' }}>
            <Row>
              <div>变更关联组织会影响数据查询</div>
            </Row>
            <Row>
              <div>
                节点：<span>{item.name}</span>
              </div>
            </Row>
            <Row>
              <div>选择方式：</div>
              <Radio.Group
                value={selectType}
                onChange={(e) => setSelectType(e.target.value)}>
                <Radio value={1}>单位</Radio>
                <Radio value={3}>集群</Radio>
                <Radio value={2}>分类</Radio>
              </Radio.Group>
            </Row>

            {selectType == 1 ? (
              <Row>
                <SearchTargetItem
                  style={{ width: '100%' }}
                  value={currentTarget}
                  typeName={TargetType.Company}
                  onValueChanged={(e) => setCurrentTarget(e.value)}
                />
              </Row>
            ) : selectType == 3 ? (
              <Row>
                <SearchTargetItem
                  style={{ width: '100%' }}
                  value={currentTarget}
                  typeName={TargetType.Group}
                  onValueChanged={(e) => setCurrentTarget(e.value)}
                />
              </Row>
            ) : (
              <>
                <Row>
                  <div>选择分类：</div>
                  <EntityInput
                    typeName="分类"
                    directory={current.directory}
                    value={speciesId}
                    onChange={() => {}}
                    onValueChange={(file) => {
                      setSpecies(file as ISpecies);
                      setSpeciesId(file.id);
                    }}
                  />
                </Row>
                {species && (
                  <Row>
                    <div>分类项：</div>
                    <SpeciesItemSelect
                      species={species}
                      value={currentTarget}
                      onChange={(v, title) => {
                        setCurrentTarget(v);
                        setCurrentTargetName(title!);
                      }}
                    />
                  </Row>
                )}
              </>
            )}
          </div>
        </Modal>
      );
    } else if (activeModel == 'generate') {
      return (
        <Modal
          open
          title="正在生成"
          footer={[]}
          onCancel={() => {
            setActiveModel('');
            setItem(undefined);
          }}>
          <Row align="middle">
            {errorMessage ? (
              <div style={{ color: 'red' }}>{errorMessage}</div>
            ) : (
              <Progress percent={progress} />
            )}
          </Row>
        </Modal>
      );
    } else if (activeModel == 'parent') {
      return (
        <Modal
          open
          title="选择上级"
          onOk={async () => {
            try {
              let newParent = adjustmentNodeMap[parentId];
              if (!newParent) {
                // 加载父节点
                const loadedNodes = await current.loadNodeById([parentId]);

                if (!loadedNodes || loadedNodes.length === 0) {
                  message.error('选择的父节点不存在或未加载');
                  return;
                }
                // 获取新加载的父节点
                newParent = loadedNodes.find((node) => node.id === parentId);
                if (!newParent) {
                  console.error('Invalid parentId after loading:', parentId);
                  message.error('选择的父节点不存在或未加载');
                  return;
                }

                // 更新 adjustmentTreeNodes 和 adjustmentNodeMap
                setAdjustmentTreeNodes((prev) => [...prev, newParent]);
                setAdjustmentNodeMap((prev) => ({ ...prev, [newParent.id]: newParent }));
              }

              // 检查是否循环引用
              let parent = newParent;
              while (parent) {
                if (parent.id === item!.id) {
                  message.error('所选节点及其下级不能是当前节点');
                  return;
                }
                parent = adjustmentNodeMap[parent.parentId!];
              }

              // 更新节点的 parentId
              let newItem = _.cloneDeep(item!);
              newItem.parentId = newParent.id;
              await current.updateNode(item!, newItem);

              // 调用 loadChildrenSelect 方法更新路径
              const updatedNodes = await current.loadChildrenSelect(newParent.id);
              if (updatedNodes) {
                message.success('节点位置修改成功，路径已更新');
              }

              // 重载节点列表
              setActiveModel('');
              setParentId('');
              setItem(undefined);
              loadNodes();
            } catch (error) {
              message.error('操作失败，请重试');
            }
          }}
          onCancel={() => {
            setActiveModel('');
            setItem(undefined);
          }}
          okButtonProps={{ disabled: !parentId }}>
          <Row style={{ marginBottom: '16px' }}>
            <div>
              节点：<span>{item!.name}</span>
            </div>
          </Row>
          <Row>
            {/* Breadcrumb 显示导航路径 */}
            <Breadcrumb style={{ marginBottom: '16px' }}>
              {getBreadcrumbPath(parentId).map((crumb, index) => (
                <Breadcrumb.Item key={index}>
                  <a onClick={() => handleBreadcrumbClick(crumb.id)}>{crumb.name}</a>
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </Row>
          <Row style={{ height: '50vh', overflowY: 'auto' }}>
            <ReportTree
              nodes={adjustmentTreeNodes}
              loadChildren={loadAdjustmentChildren}
              onSelect={(_, info) => {
                setParentId(info.node.id);
              }}
            />
          </Row>
        </Modal>
      );
    } else if (activeModel == 'merge') {
      return (
        <MergeModal
          open
          setOpen={() => setActiveModel('')}
          tree={current}
          rootNode={item!}
        />
      );
    }
    return <></>;
  };

  return (
    <FullScreenModal
      open
      centered
      fullScreen
      width={'80vw'}
      destroyOnClose
      title={current.typeName + '项管理'}
      onCancel={() => finished()}
      footer={[]}>
      <div className={cls['main-wrapper']}>
        <div className={cls['left-tree']} style={leftTreeStyle}>
          <ReportTree
            key={tkey}
            nodes={treeNodes}
            loadChildren={loadChildren}></ReportTree>
        </div>
        <div className={cls['right-content']} style={rightContentStyle}>
          <EntityInfo
            entity={current}
            column={5}
            other={
              <>
                <Descriptions.Item label="树类型">
                  <Typography.Paragraph>
                    {treeTypeNames[current.metadata.treeType] || '未知'}
                  </Typography.Paragraph>
                </Descriptions.Item>
                <Descriptions.Item label="根节点">
                  {current.metadata.rootNodeId ? (
                    <EntityIcon
                      entityId={current.metadata.rootNodeId}
                      typeName="报表树节点"
                      showName
                      belong={current.directory.target.space}
                    />
                  ) : (
                    '未定义'
                  )}
                </Descriptions.Item>
              </>
            }></EntityInfo>
          <PageCard
            className={cls[`card-wrap`]}
            style={{
              height: 'auto',
            }}
            bordered={false}
            tabList={TitleItems}
            onTabChange={(_: any) => {}}
            tabBarExtraContent={renderBtns()}>
            <Spin spinning={!loaded}>
              <CardOrTable<schema.XReportTreeNode>
                key={tkey}
                rowKey={'id'}
                dataSource={filterNodes}
                operation={renderOperate}
                columns={ReportTreeNodeColumn(current.directory.target.space)}
              />
            </Spin>
          </PageCard>
          {loadReportTreeNodeModal()}
          {uploadOpen && (
            <Modal
              open={uploadOpen}
              title="导入报表树形"
              width={960}
              onCancel={() => {
                setUploadOpen(false);
              }}
              footer={[]}>
              <Uploader
                templateName="报表树形节点"
                excel={excel.current}
                tree={current}
                finished={() => {
                  loadNodes();
                }}
              />
            </Modal>
          )}
        </div>
      </div>
    </FullScreenModal>
  );
};

export default ReportTreeModal;

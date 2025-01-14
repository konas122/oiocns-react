import React, { useEffect, useMemo, useState } from 'react';
import { IDirectory, IReportTree } from '@/ts/core';
import { schema } from '@/ts/base';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { Button, Empty, Layout, Tabs, Typography } from 'antd';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import Sider from 'antd/lib/layout/Sider';
import 'handsontable/dist/handsontable.min.css';
import ReportViewer from './reportViewer';
import { IReportView } from '@/ts/core/thing/standard/view/reportView';
import ReportTree from '@/executor/design/reportTreeModal/ReportTree';
import { Form } from '@/ts/core/thing/standard/form';
import DataGrid, { Column } from 'devextreme-react/cjs/data-grid';
import DrilldownView from './drilldownView';
import LoadingView from '@/components/Common/Loading';

interface ViewContentType {
  current: IReportView;
  form: schema.XView;
  directory: IDirectory;
}
const ReportView: React.FC<ViewContentType> = ({ current, form, directory }) => {
  const [treeData, setTreeData] = useState<schema.XReportTreeNode[]>([]);
  const [loaded] = useAsyncLoad(() => loadNodes());

  const loadNodes = async () => {
    const treeInfo = form.options?.treeInfo ?? ({} as schema.XTreeInfo);
    if (treeInfo.directoryId) {
      try {
        const treeCurrent: any = await directory.searchFile(
          treeInfo.directoryId,
          treeInfo.applicationId,
          treeInfo.id,
          treeInfo.key,
        );
        const filterTree = await (treeCurrent as IReportTree).loadNodeByBelongId(
          current.spaceId,
        );
        if (filterTree.length === 1) {
          setTreeData(filterTree);
        }
        if (filterTree.length > 1) {
          const allIds = new Set(filterTree.map((node) => node.id));
          let find = filterTree.find((node) => !allIds.has(node.parentId));
          setTreeData([find]);
        }
      } catch (error) {
        console.error('Failed to fetch tree:', error);
      }
    }
  };

  const loadChildren = async (parentId: string) => {
    const treeInfo = form.options?.treeInfo ?? ({} as schema.XTreeInfo);
    if (treeInfo.directoryId) {
      const treeCurrent: any = await directory.searchFile(
        treeInfo.directoryId,
        treeInfo.applicationId,
        treeInfo.id,
        treeInfo.key,
      );
      return await (treeCurrent as IReportTree).loadChildren(parentId);
    }
  };
  const OperationArea: React.FC<{
    clickedCells: { id: string; name: string }[];
    setClickedCells: React.Dispatch<React.SetStateAction<{ id: string; name: string }[]>>;
    treeData: any[];
    forms: schema.XForm[];
    treenode: schema.XReportTreeNode;
  }> = ({ clickedCells, setClickedCells, treeData, forms, treenode }) => {
    const [isDrilldownViewVisible, setIsDrilldownViewVisible] = useState(false);

    const handleDrillButtonClick = () => {
      setIsDrilldownViewVisible(true);
    };

    const handleBackToOperationArea = () => {
      setIsDrilldownViewVisible(false);
    };

    const handleRowDblClick = (e: any) => {
      const rowId = e.data.id;
      setClickedCells((prev) => prev.filter((cell) => cell.id !== rowId));
    };

    if (isDrilldownViewVisible) {
      return (
        <DrilldownView
          clickedCells={clickedCells}
          treeData={treeData}
          forms={forms}
          form={form}
          directory={directory}
          treenode={treenode}
          onBack={handleBackToOperationArea}
        />
      );
    }

    return (
      <Sider className={'sider'} width={350} theme="light">
        <div style={{ padding: '10px' }}>
          <h3>操作区</h3>
          <Button type="primary" onClick={handleDrillButtonClick}>
            数据钻取
          </Button>
          {clickedCells.length > 0 ? (
            <DataGrid
              dataSource={clickedCells}
              showBorders={true}
              columnAutoWidth={true}
              rowAlternationEnabled={true}
              onRowDblClick={handleRowDblClick}>
              <Column dataField="id" caption="唯一标识" width={150} />
              <Column dataField="name" caption="报表指标" width={250} />
            </DataGrid>
          ) : (
            <p>请先点击单元格将报表指标添加到操作区。</p>
          )}
        </div>
      </Sider>
    );
  };

  const FormBrower: React.FC = () => {
    const [node, setNode] = useState<schema.XReportTreeNode>(treeData[0]);
    const [proOptions, setProOptions] = useState<any[]>([]);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [clickedCells, setClickedCells] = useState<{ id: string; name: string }[]>([]);

    const handleCellClick = (attributes: { id: string; name: string }) => {
      setClickedCells((prev) => {
        const exists = prev.some((cell) => cell.id === attributes.id);
        if (exists) {
          return prev;
        }
        return [...prev, attributes];
      });
    };
    const formOptions = useMemo(() => {
      const options = form.options?.formOptions ?? [];
      if (node) {
        if (node?.nodeTypeName === '单户表') {
          return options;
        } else {
          return options.filter(
            (item: any) => item.metadata.reportType === node?.nodeTypeName,
          );
        }
      } else {
        return options;
      }
    }, [node]);

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

    useEffect(() => {
      (async () => {
        const result = await getFormOptions(formOptions);
        setProOptions(result);
        setLoaded(true);
      })();
    }, [formOptions]);

    const customTreeView = () => {
      return (
        <div style={{ height: 'calc(100vh - 150px)', overflow: 'auto' }}>
          <div>
            <ReportTree
              nodes={treeData}
              loadChildren={loadChildren}
              selectedKeys={node ? [node.id] : []}
              onSelect={(_, n) => {
                setNode(n.node);
              }}
            />
          </div>
        </div>
      );
    };

    if (!loaded) {
      return (
        <div className="loading-page">
          <LoadingView text="配置信息加载中..." />
        </div>
      );
    }

    return (
      <React.Fragment>
        <Layout className={'main_layout'}>
          <Layout className={'body'}>
            <Sider className={'sider'} width={250}>
              <div className={'title'}>
                <div className={'label'}>
                  <span style={{ marginRight: 6 }}>
                    <EntityIcon entityId={form.id} size={18} />
                  </span>
                  <Typography.Text ellipsis>{form.name}</Typography.Text>
                </div>
              </div>
              <div className={'container'} id="templateMenu">
                {customTreeView()}
              </div>
            </Sider>
            <div className={'content'} style={{ width: 'calc(100% - 250px)' }}>
              <div style={{ flex: 1 }}>
                {formOptions.length > 0 ? (
                  <Tabs
                    type={'card'}
                    tabPosition={'bottom'}
                    items={proOptions?.map((item, _index) => {
                      return {
                        label: item.name,
                        key: item.id,
                        children: (
                          <ReportViewer
                            form={item.data}
                            directory={directory}
                            readonly={true}
                            node={node}
                            height={'calc(85vh - 40px)'}
                            onCellClick={handleCellClick}
                          />
                        ),
                      };
                    })}
                  />
                ) : (
                  <Empty>暂未获取到信息</Empty>
                )}
                {/* 右侧的操作区 */}
              </div>
            </div>
            <OperationArea
              clickedCells={clickedCells}
              setClickedCells={setClickedCells}
              treeData={treeData}
              forms={proOptions}
              treenode={node}
            />
          </Layout>
        </Layout>
      </React.Fragment>
    );
  };

  return <>{loaded ? <FormBrower /> : <LoadingView text="配置信息加载中..." />}</>;
};

export default ReportView;

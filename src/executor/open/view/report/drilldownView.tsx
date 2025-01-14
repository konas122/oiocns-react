import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Spin } from 'antd';
import FullScreenModal from '@/components/Common/fullScreen';
import { schema } from '@/ts/base';
import { Content } from 'antd/lib/layout/layout';
import { IDirectory, IForm } from '@/ts/core';
import { Form } from '@/ts/core/thing/standard/form';
import DataGrid from 'devextreme-react/data-grid';
import { Selection, Export } from 'devextreme-react/data-grid';
import { Workbook } from 'exceljs';
import saveAs from 'file-saver';

interface DrilldownViewProps {
  clickedCells: { id: string; name: string }[];
  treeData: schema.XReportTreeNode[];
  forms: schema.XForm[];
  form: schema.XView;
  directory: IDirectory;
  treenode: schema.XReportTreeNode;
  onBack: () => void;
}

function createXFormFromXView(
  view: schema.XView,
  directory: IDirectory,
  forms: schema.XForm[],
): IForm {
  const collName = forms.length > 0 ? forms[0].metadata.collName || '' : '';
  const formData: schema.XForm = {
    ...view,
    rule: [],
    reportDatas: '',
    attributes: view.attributes || [],
    options: view.options || {},
    collName,
  };

  return new Form(formData, directory);
}

const DrilldownView: React.FC<DrilldownViewProps> = ({
  clickedCells,
  treeData,
  forms,
  form,
  directory,
  treenode,
  onBack,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [drilldownData, setDrilldownData] = useState<any[]>([]);
  const metaForm: IForm = useMemo(
    () => createXFormFromXView(form, directory, forms),
    [form, directory, forms],
  );

  useEffect(() => {
    const getAllChildNodeIds = (
      node: schema.XReportTreeNode,
    ): { id: string; name: string }[] => {
      let ids: { id: string; name: string }[] = [];

      if (node.targetId) {
        ids.push({ id: node.targetId, name: node.name });
      }

      const children = (node as any).children;
      if (children && Array.isArray(children)) {
        children.forEach((child) => {
          ids = ids.concat(getAllChildNodeIds(child));
        });
      }
      return ids;
    };

    const loadDrilldownData = async () => {
      try {
        // 获取所有下级节点的 belongId
        const childNodes = getAllChildNodeIds(treenode);
        const childNodeIds = childNodes.map((node) => node.id);

        // 分组处理 belongId，每组最多 2000 个
        const groupedBelongIds = [];
        for (let i = 0; i < childNodeIds.length; i += 2000) {
          groupedBelongIds.push(childNodeIds.slice(i, i + 2000));
        }

        let allFetchedData: any[] = [];

        for (const belongIdGroup of groupedBelongIds) {
          const loadOptions = {
            filter: [],
            options: [
              {
                match: {
                  isDeleted: false,
                  belongId: { _in_: belongIdGroup },
                  _or_: clickedCells.map((cell) => ({
                    [`T${cell.id}`]: { _exists_: true },
                  })),
                },
              },
              {
                project: {
                  ...clickedCells.reduce((acc: Record<string, number>, cell) => {
                    acc[`T${cell.id}`] = 1;
                    return acc;
                  }, {}),
                  belongId: 1,
                  nodeName: 1,
                },
              },
            ],
            belongId: directory.id,
            collName: metaForm.metadata.collName,
          };

          const result = await metaForm.loadThing(loadOptions);
          allFetchedData = allFetchedData.concat(result.data);
        }

        // 合并相同 belongId 的数据
        const mergedData: { [key: string]: any } = {};
        allFetchedData.forEach((item) => {
          const belongId = item.belongId;
          if (!mergedData[belongId]) {
            mergedData[belongId] = { nodeName: item.nodeName || item.name };
          }
          clickedCells.forEach((cell) => {
            if (item[`T${cell.id}`] !== undefined) {
              mergedData[belongId][cell.id] = item[`T${cell.id}`];
            }
          });
        });

        setDrilldownData(Object.values(mergedData));
        setLoaded(true);
      } catch (error) {
        console.error('Error loading drilldown data:', error);
        setLoaded(true);
      }
    };
    loadDrilldownData();
  }, [clickedCells, treeData, metaForm]);

  const handleCloseModal = () => {
    setIsModalVisible(false);
    onBack();
  };

  const columns = useMemo(() => {
    const indicatorColumns = clickedCells.map((cell) => ({
      dataField: cell.id,
      caption: cell.name,
      width: 250,
      allowResizing: true,
      allowFiltering: true,
    }));

    return [...indicatorColumns];
  }, [clickedCells]);

  const handleExporting = async (e: any) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Drilldown Data');

    // 获取 DataGrid 的列信息
    const columns = e.component.getVisibleColumns();
    worksheet.columns = columns.map((column: { caption: any; dataField: any }) => ({
      header: column.caption,
      key: column.dataField,
    }));

    // 暂时禁用分页以加载所有数据
    const dataSource = e.component.getDataSource();
    const allData = await dataSource
      .store()
      .load({ requireTotalCount: false, skip: 0, take: null });

    // 添加所有数据到工作表中
    allData.forEach((rowData: any) => {
      worksheet.addRow(rowData);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: 'application/octet-stream' }),
      'DrilldownData.xlsx',
    );
    e.cancel = true;
  };

  return (
    <FullScreenModal
      fullScreen={true}
      open={isModalVisible}
      onCancel={handleCloseModal}
      title="数据钻取"
      bodyHeight="calc(100vh - 80px)"
      footer={null}>
      <Layout className={'main_layout'} style={{ height: '100%' }}>
        <Layout className={'body'} style={{ height: '100%' }}>
          <div className={'content'} style={{ width: '100%', height: '100%' }}>
            <div style={{ flex: 1, height: '100%' }}>
              <Content style={{ padding: '20px', height: '100%' }}>
                {loaded ? (
                  <div style={{ height: '100%', width: '100%' }}>
                    <DataGrid
                      dataSource={drilldownData}
                      columns={columns}
                      showBorders={true}
                      paging={{ enabled: true }}
                      pager={{
                        visible: true,
                        showInfo: true,
                        showNavigationButtons: true,
                        showPageSizeSelector: true,
                        allowedPageSizes: [20, 50, 100, 200],
                      }}
                      columnChooser={{ enabled: true }}
                      searchPanel={{ width: 300, visible: true }}
                      headerFilter={{ visible: true }}
                      allowColumnResizing={true}
                      allowColumnReordering={true}
                      rowAlternationEnabled={true}
                      selection={{ mode: 'multiple' }}
                      height={'100%'}
                      width={'100%'}
                      onExporting={(e) => handleExporting(e as any)}>
                      <Selection mode="multiple" />
                      <Export
                        enabled={true}
                        allowExportSelectedData={true}
                        formats={['xlsx']}
                      />
                    </DataGrid>
                  </div>
                ) : (
                  <Spin tip="加载中..." style={{ width: '100%', height: '100%' }} />
                )}
              </Content>
            </div>
          </div>
        </Layout>
      </Layout>
    </FullScreenModal>
  );
};

export default DrilldownView;

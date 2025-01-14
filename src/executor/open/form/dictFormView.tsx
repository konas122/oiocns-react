import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import FullScreenModal from '@/components/Common/fullScreen';
import WorkForm from '@/components/DataStandard/WorkForm';
import { Theme } from '@/config/theme';
import GenerateThingTable from '@/executor/tools/generate/thingTable';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { command, model, schema } from '@/ts/base';
import { IDirectory } from '@/ts/core';
import { message, Layout, Typography } from 'antd';
import CustomStore from 'devextreme/data/custom_store';
import React, { useRef, useState, createRef, useEffect } from 'react';
import { ImCopy, ImHistory, ImProfile, ImShuffle, ImTicket } from 'react-icons/im';
import DataAnalysisModal from '@/executor/design/dataAnalysisModal';
import { MdPrint, MdOutlinePrint } from 'react-icons/md';
import ThingView from './detail';
import { HistoryFileView } from './history/file';
import { HistoryFlowView } from './history/flow';
import { formatNumber } from '@/utils';
import './index.less';
import { DataGrid, TreeView } from 'devextreme-react';
import { IBelong, IForm } from '@/ts/core';
import { Form } from '@/ts/core/thing/standard/form';
import Sider from 'antd/lib/layout/Sider';
import { TreeViewTypes } from 'devextreme-react/cjs/tree-view';
import orgCtrl from '@/ts/controller';
import { TableModel, WorkDocumentConfig } from '@/ts/base/model';
import { createRoot } from 'react-dom/client';
import PrintTemplate from './printTemplate';
import { userFormatFilter } from '@/utils/tools';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import { DocumentTemplate, IDocumentTemplate } from '@/ts/core/thing/standard/document';
import { DocumentViewerModal } from '../document/DocumentViewerModal';
import LoadingView from '@/components/Common/Loading';

interface IProps {
  form: schema.XForm;
  directory: IDirectory;
  finished: () => void;
}

/** 表单查看--字典项过多 */
const DictFormView: React.FC<IProps> = ({ form, directory, finished }) => {
  useEffect(() => {
    if (form.primaryPrints) {
      //所有的打印模板拿到后做自动更新
      orgCtrl.loadPrint().then((result) => {
        result.forEach((item) => {
          form.primaryPrints.forEach(
            (primaryPrint: { id: string; name: string; table: TableModel[] }) => {
              if (item.id == primaryPrint.id) {
                primaryPrint.name = item.name;
                primaryPrint.table = item.table;
              }
            },
          );
        });
      });
    }
  }, []);
  const removePrintIframe = () => {
    const oldIframe = document.getElementById('printedIframe');
    if (oldIframe) {
      oldIframe.remove();
    }
  };
  const [fields, setFields] = useState<model.FieldModel[]>([]);
  const [showHighLight, setShowHlighLight] = useState<boolean>(false);
  const [hasRedRowRule, setHasRedRowRule] = useState<boolean>(false);
  const [visibleDataAnalysisModal, setVisibleDataAnalysisModal] =
    useState<boolean>(false);
  const metaForm: IForm = new Form(form, directory);
  const [loaded] = useAsyncLoad(async () => {
    await metaForm.load();
    setFields(await metaForm.loadFields());
  });
  const editData: { rows: schema.XThing[] } = { rows: [] };
  let ref = useRef<DataGrid<schema.XThing, string>>(null);
  const treeViewRef = createRef<TreeView<any>>();
  metaForm.fields = fields;

  const FormBrower: React.FC = () => {
    const [treeData, setTreeData] = useState<any>([]);
    const [selectMenu, setSelcetMenu] = useState<any>([]);

    const loadSpeciesItemMenu = () => {
      const speciesFields = fields.filter((i) => i.options?.species);
      const result: any[] = [];
      for (const filed of speciesFields) {
        const newFiled = filed;
        result.push({
          key: filed.id,
          item: newFiled,
          label: filed.name,
          hasItems: true,
          children: [],
        });
      }
      return result;
    };

    useEffect(() => {
      const result = loadSpeciesItemMenu();
      setTreeData(result);
      setSelcetMenu(result);
    }, []);

    const [center, setCenter] = useState(<></>);

    const [doc, setDoc] = useState<IDocumentTemplate | null>(null);
    const [service, setService] = useState<WorkFormService>(null!);
    async function showDocumentConfig(row: schema.XThing, config: WorkDocumentConfig) {
      let data = { ...row };
      for (const field of metaForm.fields) {
        data[field.id] = data[field.code];
        delete data[field.code];
      }

      const svc = WorkFormService.createStandalone(
        metaForm.directory.target as IBelong,
        metaForm.metadata,
        metaForm.fields,
        false,
        [
          {
            before: [],
            after: [data],
            nodeId: '',
            formName: metaForm.name,
            createTime: '',
            creator: '',
            rules: [],
          },
        ],
      );
      svc.init();
      svc.updatePrimaryData(metaForm.id, data);
      setService(svc);

      const temp = config.templates[0];
      const [docMeta] = await metaForm.directory.resource.documentColl.find([temp.id]);
      setDoc(new DocumentTemplate(docMeta, metaForm.directory));
    }

    if (!selectMenu && !treeData) return <></>;

    const loadDeatil = (select: schema.XThing) => {
      if (select) {
        setCenter(
          <FullScreenModal
            open
            width={'100vw'}
            bodyHeight={'70vh'}
            title=""
            onOk={() => setCenter(<></>)}
            onCancel={() => setCenter(<></>)}>
            <ThingView
              form={metaForm}
              thingData={select}
              onBack={() => setCenter(<></>)}
            />
          </FullScreenModal>,
        );
      }
    };

    const loadContent = () => {
      return (
        <GenerateThingTable
          key={form.key}
          reference={ref}
          height={'100%'}
          selection={{
            mode: 'multiple',
            allowSelectAll: true,
            selectAllMode: 'page',
            showCheckBoxesMode: 'always',
          }}
          form={metaForm.metadata}
          fields={metaForm.fields}
          onSelectionChanged={(e) => {
            editData.rows = e.selectedRowsData;
          }}
          onRowDblClick={(e: any) => loadDeatil(e.data)}
          dataSource={
            new CustomStore({
              key: 'id',
              async load(loadOptions: any) {
                const redRowRule = metaForm.parseRedRow();
                if (redRowRule) {
                  setHasRedRowRule(true);
                }
                loadOptions.filter = await userFormatFilter(loadOptions.filter, metaForm);
                const filtter = showHighLight ? redRowRule : loadOptions.filter;
                loadOptions.filter = metaForm.parseFilter(filtter);
                const classify = metaForm.parseClassify();
                if (loadOptions.filter.length == 0 && Object.keys(classify).length == 0) {
                  return { data: [], totalCount: 0 };
                }
                loadOptions.userData = [];
                if (selectMenu.item?.value) {
                  loadOptions.userData.push(selectMenu.item.value);
                } else if (selectMenu.item?.code) {
                  loadOptions.options = loadOptions.options || {};
                  loadOptions.options.match = loadOptions.options.match || {};
                  loadOptions.options.match[selectMenu.item.code] = { _exists_: true };
                }
                return await metaForm.loadThing(loadOptions);
              },
            })
          }
          remoteOperations={true}
          summary={{
            totalItems: metaForm.fields
              .filter((item) => item.options?.isSummary)
              .map((item) => {
                return {
                  column: item.code,
                  summaryType: 'sum',
                  customizeText: (info) => {
                    return '总计:' + formatNumber(info?.value?.toString() ?? 0, 2);
                  },
                };
              }),
          }}
          toolbar={{
            visible: true,
            items: [
              {
                name: 'highlightButton',
                location: 'after',
                visible: hasRedRowRule,
                widget: 'dxButton',
                options: {
                  text: showHighLight ? '显示全部' : '显示高亮',
                  onClick: () => {
                    setShowHlighLight(!showHighLight);
                  },
                },
              },
              {
                name: 'data',
                location: 'after',
                widget: 'dxButton',
                options: {
                  icon: 'chart',
                  onClick: () => {
                    setVisibleDataAnalysisModal(true);
                  },
                },
              },
              {
                name: 'print',
                location: 'after',
                widget: 'dxButton',
                options: {
                  icon: 'print',
                  onClick: () => {
                    if (!metaForm.metadata.primaryPrints)
                      return message.error('请先配置打印模板');
                    if (metaForm.metadata.primaryPrints.length === 0)
                      return message.error('请先配置打印模板');
                    if (editData.rows.length === 0)
                      return message.error('请选择需要打印的数据');
                    removePrintIframe();
                    const iframe = document.createElement('IFRAME') as HTMLIFrameElement;
                    iframe.setAttribute(
                      'style',
                      'position:fixed;width:100%;height:100%;left:0px;top:0px; z-index: 1000; background: rgba(0, 0, 0, 0); display: none;',
                    );
                    iframe.setAttribute('id', 'printedIframe');
                    iframe.onload = () => {
                      let doc = iframe.contentWindow?.document;
                      const loading = () => {
                        setTimeout(() => {
                          iframe.contentWindow?.focus();
                          iframe.contentWindow?.print();
                        }, 1000);
                        if (navigator.userAgent.indexOf('MSIE') > 0) {
                          document.body.removeChild(iframe);
                        }
                      };
                      createRoot(doc as unknown as Element | DocumentFragment).render(
                        <PrintTemplate
                          printData={metaForm.metadata.printData}
                          print={metaForm.metadata.primaryPrints}
                          current={editData.rows}
                          loading={loading}
                        />,
                      );
                    };
                    document.body.appendChild(iframe);
                  },
                },
              },
              {
                name: 'print',
                location: 'after',
                widget: 'dxButton',
                options: {
                  icon: 'print',
                  onClick: () => {
                    if (!metaForm.metadata.print)
                      return message.error('请先配置打印模板');
                    if (editData.rows.length === 0)
                      return message.error('请选择需要打印的数据');
                    command.emitter(
                      'executor',
                      'printEntity',
                      metaForm,
                      'multiple',
                      editData.rows,
                    );
                  },
                },
              },
              {
                name: 'exportButton',
                location: 'after',
              },
              {
                name: 'columnChooserButton',
                location: 'after',
              },
              {
                name: 'searchPanel',
                location: 'after',
              },
            ],
          }}
          dataMenus={{
            items: [
              {
                key: 'createNFT',
                label: '生成存证',
                icon: <ImTicket fontSize={22} color={Theme.FocusColor} />,
                onClick: () => {
                  message.success('存证成功!');
                },
              },
              {
                key: 'copyBoard',
                label: '复制数据',
                icon: <ImCopy fontSize={22} color={Theme.FocusColor} />,
              },
              {
                key: 'startWork',
                label: '发起办事',
                icon: <ImShuffle fontSize={22} color={Theme.FocusColor} />,
              },
              {
                key: 'showHistory',
                label: '历史流程',
                icon: <ImHistory fontSize={22} color={Theme.FocusColor} />,
              },
              {
                key: 'filesManager',
                label: '历史附件',
                icon: <ImProfile fontSize={22} color={Theme.FocusColor} />,
              },
              {
                key: 'printEntity',
                label: '标签打印',
                hide: !form.metadata?.print || form.metadata?.print?.config?.hide,
                icon: <MdPrint fontSize={22} color={Theme.FocusColor} />,
              },
              {
                key: 'formPrint',
                label: '表单打印',
                icon: <MdOutlinePrint fontSize={22} color={Theme.FocusColor} />,
              },
              {
                key: 'formPdf',
                label: 'PDF打印',
                icon: <MdOutlinePrint fontSize={22} color={Theme.FocusColor} />,
              },
            ],
            onMenuClick(_key, _data) {
              let obj: any = {};
              const pattern = /^T\d+$/; // 定义正则表达式模式，以"T"开头，后面跟一串数字
              const iframe = document.createElement('IFRAME') as HTMLIFrameElement;
              switch (_key) {
                case 'showHistory':
                  setCenter(
                    <HistoryFlowView
                      form={metaForm}
                      thing={_data}
                      finished={() => setCenter(<></>)}
                    />,
                  );
                  break;
                case 'filesManager':
                  setCenter(
                    <HistoryFileView
                      form={metaForm}
                      thing={_data}
                      finished={() => setCenter(<></>)}
                    />,
                  );
                  break;
                case 'printEntity':
                  if (!metaForm.metadata.print) return message.error('请先配置打印模板');
                  command.emitter('executor', 'printEntity', metaForm, 'single', [_data]);
                  break;
                case 'formPrint':
                  Object.entries(_data).forEach(([_key, value]) => {
                    if (pattern.test(_key)) {
                      _key = _key.replace('T', '');
                    }
                    obj[_key] = value;
                  });
                  if (!metaForm.metadata.primaryPrints)
                    return message.error('请先配置打印模板');
                  if (metaForm.metadata.primaryPrints.length == 0)
                    return message.error('请先配置打印模板');
                  removePrintIframe();
                  iframe.setAttribute(
                    'style',
                    'position:fixed;width:100%;height:100%;left:0px;top:0px; z-index: 1000; background: rgba(0, 0, 0, 0); display: none;',
                  );
                  iframe.setAttribute('id', 'printedIframe');
                  iframe.onload = () => {
                    let doc = iframe.contentWindow?.document;
                    const loading = () => {
                      setTimeout(() => {
                        iframe.contentWindow?.focus();
                        iframe.contentWindow?.print();
                      }, 1000);
                      if (navigator.userAgent.indexOf('MSIE') > 0) {
                        document.body.removeChild(iframe);
                      }
                    };
                    createRoot(doc as unknown as Element | DocumentFragment).render(
                      <PrintTemplate
                        printData={metaForm.metadata.printData}
                        print={metaForm.metadata.primaryPrints}
                        current={[obj]}
                        loading={loading}
                      />,
                    );
                  };
                  document.body.appendChild(iframe);
                  break;
                case 'formPdf':
                  if (!metaForm.metadata.documentConfig?.templates.length) {
                    message.error('请先配置表单文档模板');
                    return;
                  }
                  showDocumentConfig(_data, metaForm.metadata.documentConfig);
                  break;
              }
            },
          }}
        />
      );
    };

    const customTreeView = () => {
      const getItem = async (node: TreeViewTypes.Node, fileds: any) => {
        const arr = fileds.map((filed: any) => {
          return filed.id;
        });
        const children = await metaForm.loadItemsByParentId(
          [node.itemData?.item.speciesId],
          arr,
        );
        return children;
      };

      const getChildren = async (node: TreeViewTypes.Node) => {
        let result: any[] = [],
          children: any[] = [],
          items: any[] = [];
        if (node.parent) {
          children = await metaForm.loadItemsByParentId(
            [node.itemData?.item.speciesId],
            [node.key],
          );
          items = await getItem(node, children);
        } else {
          children = await metaForm.loadItemsByParentId(
            [node.itemData?.item.speciesId],
            [undefined],
          );
          items = await getItem(node, children);
        }
        for (const filed of children) {
          let arr: any[] = [];
          items.forEach((item: any) => {
            if (item.parentId === filed.id) {
              const newFiled: any = item;
              newFiled.value = 'S' + newFiled.id;
              arr.push({
                key: item.id,
                item: newFiled,
                label: item.name,
                parentId: item.parentId,
                hasItems: false,
                children: [],
              });
            }
          });
          const newFiled = filed;
          newFiled.value = 'S' + newFiled.id;
          result.push({
            key: filed.id,
            item: newFiled,
            label: filed.name,
            parentId: node.key,
            hasItems: arr.length > 0 ? true : false,
            children: arr,
          });
        }
        return result;
      };

      const createChildren = async (node: TreeViewTypes.Node) => {
        let result: any[] = [];
        if (node) {
          result = await getChildren(node);
        } else {
          result = loadSpeciesItemMenu();
        }
        return result;
      };

      return (
        <div style={{ height: 'calc(100vh - 150px)', overflow: 'auto' }}>
          <TreeView
            ref={treeViewRef}
            dataStructure="plain"
            dataSource={treeData}
            expandNodesRecursive={false}
            createChildren={createChildren}
            keyExpr="key"
            parentIdExpr="parentId"
            selectionMode="single"
            selectNodesRecursive={false}
            displayExpr="label"
            selectByClick={true}
            searchEnabled
            onItemClick={(item) => {
              setSelcetMenu(item.itemData);
            }}
          />
        </div>
      );
    };

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
                  <Typography.Text ellipsis>{metaForm.name}</Typography.Text>
                </div>
              </div>
              <div className={'container'} id="templateMenu">
                {customTreeView()}
              </div>
            </Sider>
            <div className={'content'}>{loadContent()}</div>
          </Layout>
        </Layout>
        {center}
        {doc && (
          <DocumentViewerModal
            current={doc}
            service={service}
            onCancel={() => setDoc(null)}
          />
        )}
      </React.Fragment>
    );
  };

  const memoizedModalContent = React.useMemo(() => {
    return (
      <FullScreenModal
        centered
        open={true}
        fullScreen
        width={'80vw'}
        title={metaForm.name}
        bodyHeight={'80vh'}
        icon={<EntityIcon entityId={metaForm.id} />}
        destroyOnClose
        onCancel={() => finished()}>
        {loaded ? (
          metaForm.canDesign ? (
            <FormBrower />
          ) : (
            <WorkForm form={metaForm} />
          )
        ) : (
          <div className="loading-page">
            <LoadingView text="配置信息加载中..." />
          </div>
        )}
      </FullScreenModal>
    );
  }, [loaded]);
  return (
    <>
      {memoizedModalContent}
      {visibleDataAnalysisModal && (
        <DataAnalysisModal
          current={metaForm}
          finished={() => setVisibleDataAnalysisModal(false)}
        />
      )}
    </>
  );
};

export default DictFormView;

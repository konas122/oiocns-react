import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import FullScreenModal from '@/components/Common/fullScreen';
import WorkForm from '@/components/DataStandard/WorkForm';
import MinLayout from '@/components/MainLayout/minLayout';
import { Theme } from '@/config/theme';
import DataAnalysisModal from '@/executor/design/dataAnalysisModal';
import GenerateThingTable from '@/executor/tools/generate/thingTable';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import useMenuUpdate from '@/hooks/useMenuUpdate';
import { command, model, schema } from '@/ts/base';
import { Controller } from '@/ts/controller';
import { IBelong, IForm } from '@/ts/core';
import { Modal, message } from 'antd';
import CustomStore from 'devextreme/data/custom_store';
import React, { useState, useEffect, useRef } from 'react';
import { ImCopy, ImHistory, ImProfile, ImShuffle, ImTicket } from 'react-icons/im';
import { MdPrint, MdOutlinePrint } from 'react-icons/md';
import * as config from './config';
import ThingView from './detail';
import { HistoryFileView } from './history/file';
import { HistoryFlowView } from './history/flow';
import { formatNumber } from '@/utils';
import orgCtrl from '@/ts/controller';
import './index.less';
import { createRoot } from 'react-dom/client';
import PrintTemplate from './printTemplate';
import { TableModel, WorkDocumentConfig } from '@/ts/base/model';
import { userFormatFilter } from '@/utils/tools';
import { Form } from '@/ts/core/thing/standard/form';
import { DataGrid } from 'devextreme-react';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import { DocumentTemplate, IDocumentTemplate } from '@/ts/core/thing/standard/document';
import { DocumentViewerModal } from '../document/DocumentViewerModal';
import LoadingView from '@/components/Common/Loading';

interface IProps {
  form: IForm;
  finished: () => void;
}

/** 表单查看 */
const FormView: React.FC<IProps> = ({ form, finished }) => {
  const [fields, setFields] = useState<model.FieldModel[]>([]);
  useEffect(() => {
    if (form.metadata.primaryPrints) {
      //所有的打印模板拿到后做自动更新
      orgCtrl.loadPrint().then((result) => {
        result.forEach((item) => {
          form.metadata.primaryPrints.forEach(
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
  const editData: { rows: schema.XThing[] } = { rows: [] };
  const [loaded] = useAsyncLoad(async () => {
    form.loadContent();
    await form.load();
    const metaForm: IForm = new Form(form.metadata, form.directory);
    setFields(await metaForm.loadFields());
  });
  const [visibleDataAnalysisModal, setVisibleDataAnalysisModal] =
    useState<boolean>(false);
  const [showHighLight, setShowHlighLight] = useState<boolean>(false);
  const [hasRedRowRule, setHasRedRowRule] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const lock = useRef(false);
  let ref = useRef<DataGrid<schema.XThing, string>>(null);
  const removePrintIframe = () => {
    const oldIframe = document.getElementById('printedIframe');
    if (oldIframe) {
      oldIframe.remove();
    }
  };
  const FormBrower: React.FC = () => {
    const [, rootMenu, selectMenu, setSelectMenu] = useMenuUpdate(
      () => config.loadSpeciesItemMenu(form),
      new Controller(form.key),
    );
    const [center, setCenter] = useState(<></>);

    const [doc, setDoc] = useState<IDocumentTemplate | null>(null);
    const [service, setService] = useState<WorkFormService>(null!);
    async function showDocumentConfig(row: schema.XThing, config: WorkDocumentConfig) {
      let data = { ...row };
      for (const field of form.fields) {
        data[field.id] = data[field.code];
        delete data[field.code];
      }

      const svc = WorkFormService.createStandalone(
        form.directory.target as IBelong,
        form.metadata,
        form.fields,
        false,
        [
          {
            before: [],
            after: [data],
            nodeId: '',
            formName: form.name,
            createTime: '',
            creator: '',
            rules: [],
          },
        ],
      );
      svc.updatePrimaryData(form.id, data);
      setService(svc);

      const temp = config.templates[0];
      const [docMeta] = await form.directory.resource.documentColl.find([temp.id]);
      setDoc(new DocumentTemplate(docMeta, form.directory));
    }

    if (!selectMenu || !rootMenu) return <></>;

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
            <ThingView form={form} thingData={select} onBack={() => setCenter(<></>)} />
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
          form={form.metadata}
          fields={fields}
          onSelectionChanged={(e) => {
            editData.rows = e.selectedRowsData;
          }}
          onRowDblClick={(e: any) => loadDeatil(e.data)}
          dataSource={
            new CustomStore({
              key: 'id',
              async load(loadOptions: any) {
                const redRowRule = form.parseRedRow();
                if (redRowRule) {
                  setHasRedRowRule(true);
                }
                loadOptions.filter = await userFormatFilter(loadOptions.filter, form);
                const filter = showHighLight ? redRowRule : loadOptions.filter;
                loadOptions.filter = form.parseFilter(filter);
                const classify = form.parseClassify();
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
                return await form.loadThing(loadOptions);
              },
            })
          }
          remoteOperations={true}
          summary={{
            totalItems: fields
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
              },
              {
                name: 'print',
                location: 'after',
                widget: 'dxButton',
                options: {
                  icon: 'print',
                  onClick: () => {
                    if (!form.metadata.primaryPrints)
                      return message.error('请先配置打印模板');
                    if (form.metadata.primaryPrints.length === 0)
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
                          printData={form.metadata.printData}
                          print={form.metadata.primaryPrints}
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
                    if (!form.metadata.print) return message.error('请先配置打印模板');
                    if (editData.rows.length === 0)
                      return message.error('请选择需要打印的数据');
                    command.emitter(
                      'executor',
                      'printEntity',
                      form,
                      'multiple',
                      editData.rows,
                    );
                  },
                },
              },
              {
                name: 'unlock',
                location: 'after',
                widget: 'dxButton',
                options: {
                  icon: 'clear',
                  onClick: async () => {
                    const modal = Modal.confirm({
                      icon: <></>,
                      title: '强制解锁',
                      okText: '确认',
                      cancelText: '取消',
                      okButtonProps: { disabled: loading },
                      onCancel: () => {
                        modal.destroy();
                      },
                      onOk: async () => {
                        if (editData.rows.length == 0) {
                          message.error('请选择需要强制解锁的数据!');
                          return;
                        }
                        if (lock.current) {
                          message.error('正在操作，请稍后再试!');
                          return;
                        }
                        try {
                          lock.current = true;
                          ref.current?.instance.beginCustomLoading(
                            '正在强制解锁中，请稍后',
                          );
                          await form.unlock(editData.rows);
                          ref.current?.instance.refresh();
                        } finally {
                          ref.current?.instance.endCustomLoading();
                          lock.current = false;
                        }
                      },
                    });
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
                      form={form}
                      thing={_data}
                      finished={() => setCenter(<></>)}
                    />,
                  );
                  break;
                case 'filesManager':
                  setCenter(
                    <HistoryFileView
                      form={form}
                      thing={_data}
                      finished={() => setCenter(<></>)}
                    />,
                  );
                  break;
                case 'printEntity':
                  if (!form.metadata.print) return message.error('请先配置打印模板');
                  command.emitter('executor', 'printEntity', form, 'single', [_data]);
                  break;
                case 'formPrint':
                  Object.entries(_data).forEach(([_key, value]) => {
                    if (pattern.test(_key)) {
                      _key = _key.replace('T', '');
                    }
                    obj[_key] = value;
                  });
                  if (!form.metadata.primaryPrints)
                    return message.error('请先配置打印模板');
                  if (form.metadata.primaryPrints.length == 0)
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
                        printData={form.metadata.printData}
                        print={form.metadata.primaryPrints}
                        current={[obj]}
                        loading={loading}
                      />,
                    );
                  };
                  document.body.appendChild(iframe);
                  break;
                case 'formPdf':
                  if (!form.metadata.documentConfig?.templates.length) {
                    message.error('请先配置表单文档模板');
                    return;
                  }
                  showDocumentConfig(_data, form.metadata.documentConfig);
                  break;
              }
            },
          }}
        />
      );
    };
    return (
      <React.Fragment>
        <MinLayout
          selectMenu={selectMenu}
          onSelect={(data) => {
            setSelectMenu(data);
          }}
          siderMenuData={rootMenu}>
          {loadContent()}
        </MinLayout>
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
        title={form.name}
        bodyHeight={'80vh'}
        icon={<EntityIcon entityId={form.id} />}
        destroyOnClose
        onCancel={() => finished()}>
        {loaded ? (
          form.canDesign ? (
            <FormBrower />
          ) : (
            <WorkForm form={form} />
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
          current={form}
          finished={() => setVisibleDataAnalysisModal(false)}
        />
      )}
    </>
  );
};

export default FormView;

import { Theme } from '@/config/theme';
import GenerateThingTable from '@/executor/tools/generate/thingTable';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { command, model, schema } from '@/ts/base';
import { IDirectory, TargetType } from '@/ts/core';
import { message, Layout } from 'antd';
import CustomStore from 'devextreme/data/custom_store';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ImCopy, ImHistory, ImProfile, ImShuffle, ImTicket } from 'react-icons/im';
import { MdPrint, MdOutlinePrint } from 'react-icons/md';
import { formatNumber } from '@/utils';
import { DataGrid } from 'devextreme-react';
import { IForm } from '@/ts/core';
import Sider from 'antd/lib/layout/Sider';
import { HistoryFlowView } from '../../form/history/flow';
import { HistoryFileView } from '../../form/history/file';
import ThingView from '../../form/detail';
import MemberTree from './memberTree';
import SpeciesMenu from './speciesMenu';
import '../../form/index.less';
import { DeptItemType } from './treeDataUtils';
import orgCtrl from '@/ts/controller';
import { TableModel } from '@/ts/base/model';
import { createRoot } from 'react-dom/client';
import PrintTemplate from '../../form/printTemplate';
import { WorkTask } from '@/ts/core/work/task';
import EmptyTemp from './emptyTemp';
import { userFormatFilter } from '@/utils/tools';
import { ViewFactory } from '@/ts/core/thing/standard/view/viewFactory';
import { IFormView } from '@/ts/core/thing/standard/view/formView';
import LoadingView from '@/components/Common/Loading';
interface IProps {
  form: schema.XView;
  directory: IDirectory;
  isMemberView: boolean;
}

/** 表单查看--字典项过多 */
const DictFormView: React.FC<IProps> = (props) => {
  const { form, directory } = props;
  useEffect(() => {
    if (form.primaryPrints) {
      //所有的打印模板拿到后做自动更新
      orgCtrl.loadPrint().then((result) => {
        result.forEach((item) => {
          form.primaryPrints.forEach(
            (primaryPrint: { id: string; name: string; table: TableModel[] }) => {
              if (item.id == primaryPrint.id) {
                primaryPrint.name = item.name;
                primaryPrint.table = item.table ?? [];
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
  const isGroupSpace = directory.target.typeName === TargetType.Group;
  const [fields, setFields] = useState<model.FieldModel[]>([]);
  // const metaForm: IForm = new Form(form as unknown as schema.XForm, directory);
  const metaForm: IFormView = ViewFactory.createView(form, directory) as IFormView;

  const [loaded] = useAsyncLoad(async () => {
    await metaForm.loadContent();
    setFields(await metaForm.loadFields());
  });
  const [select, setSelcet] = useState();
  const editData: { rows: schema.XThing[] } = { rows: [] };
  let ref = useRef<DataGrid<schema.XThing, string>>(null);
  metaForm.fields = fields;
  if (fields.some((item) => item.id.includes('virtualColumn'))) {
    for (const element of fields) {
      element.code = element.info ?? element.code;
    }
  }
  const viewFilterField = fields.filter((item: any) => item.options?.viewFilterKey);
  const FormBrower: React.FC = () => {
    const searchType = form.options?.organizationTree ? 'tree' : 'members';
    const [selectSpecies, setSelectSpecies] = useState<any[]>([]);
    const [treeMatchs, setTreeMatchs] = useState<Record<string, any>>({});
    if (metaForm.allowView) return <EmptyTemp />;
    const [center, setCenter] = useState(<></>);
    if (!loaded) return <></>;

    const loadDeatil = () => {
      if (select) {
        return (
          <ThingView
            form={metaForm as unknown as IForm}
            thingData={select}
            onBack={() => setSelcet(undefined)}
          />
        );
      }
    };
    const onRowDblClick = async ({ data }: { data: any }) => {
      switch (metaForm.viewType) {
        //系统办事详情  查看
        case 'work':
          {
            if (data.id.includes('instanceId')) return message.warning('历史数据异常');
            //系统业务记录查看
            const work = new WorkTask(
              {
                ...data,
                taskType: '事项',
              } as schema.XWorkTask,
              orgCtrl.work.user,
            );
            message.loading('详情加载中...', 15);
            await work.loadInstance(false, true);
            message.destroy();
            command.emitter('executor', 'open', work, 'preview');
          }
          break;
        //默认详情  查看
        case 'default':
        default:
          setSelcet(data);
          break;
      }
    };
    const loadContent = () => {
      const createCustomStore = new CustomStore({
        key: 'id',
        async load(loadOptions: any) {
          loadOptions.filter = await userFormatFilter(loadOptions.filter, metaForm);
          loadOptions.options ??= { match: {} };
          loadOptions.userData = [];
          if (form.options?.organizationTree && !selectSpecies.length) {
            return { data: [], totalCount: 0 };
          }
          handleSelectSpecies(loadOptions);
          if (searchType === 'members') handleMembersSearch(loadOptions);
          return await metaForm.loadThing(loadOptions);
        },
      });

      const handleSelectSpecies = useCallback(
        (loadOptions: any) => {
          // 重置分类筛选条件
          viewFilterField.forEach((field) => {
            if (field.options!.viewFilterKey) {
              delete loadOptions.options.match[field.options!.viewFilterKey!];
            }
          });
          selectSpecies.forEach((item) => {
            if (!item) return;
            if (item.value && ['分类项', '分类型'].includes(item.typeName)) {
              const find: any = viewFilterField.find(
                (v) => v.speciesId === item.speciesId,
              );
              if (find) {
                loadOptions.options.match[find.options!.viewFilterKey] = item.info;
              } else {
                loadOptions.userData.push(item.value);
              }
            } else if (item.typeName === '组织树') {
              if (props.isMemberView) {
                loadOptions.belongId = directory.target.belongId;
                loadOptions.extraReations = item.targetId;
              } else {
                const belongIds = loadOptions.options.match['belongId']?._in_ ?? [];
                if (item.targetId) {
                  belongIds.push(item.targetId);
                } else {
                  message.warning(`${item.name} 节点未绑定关联单位`);
                }
                loadOptions.options.match['belongId'] = { _in_: belongIds };
              }
            } else if (item.code) {
              loadOptions.options.match[item.code] = { _exists_: true };
            }
          });
        },
        [selectSpecies],
      );

      const handleMembersSearch = (loadOptions: any) => {
        let defaultMatch: Record<string, any> = {};
        if (isGroupSpace) {
          defaultMatch.belongId = directory.target.belongId;
        }
        loadOptions.options.match = Object.assign(
          loadOptions.options.match,
          defaultMatch,
          treeMatchs,
        );
        if (props.isMemberView && treeMatchs?.belongId) {
          loadOptions.extraReations = treeMatchs.belongId._in_[0];
        }
      };
      return (
        <GenerateThingTable
          key={form.key}
          reference={ref}
          height={'100%'}
          showIndex
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
          onRowDblClick={onRowDblClick}
          dataSource={createCustomStore}
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
                name: 'title',
                location: 'before',
                html: selectSpecies.length
                  ? `<span style="font-size: 14px;"> 已选分类条件(${selectSpecies.length}) </span> `
                  : '',
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
                  icon: 'box',
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
            ],
            onMenuClick(_key, _data) {
              let obj: any = {};
              const pattern = /^T\d+$/; // 定义正则表达式模式，以"T"开头，后面跟一串数字
              const iframe = document.createElement('IFRAME') as HTMLIFrameElement;
              switch (_key) {
                case 'showHistory':
                  setCenter(
                    <HistoryFlowView
                      form={metaForm as unknown as IForm}
                      thing={_data}
                      finished={() => setCenter(<></>)}
                    />,
                  );
                  break;
                case 'filesManager':
                  setCenter(
                    <HistoryFileView
                      form={metaForm as unknown as IForm}
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
              }
            },
          }}
        />
      );
    };

    const creatFilterMatchs = (items: DeptItemType[]) => {
      const viewDataRange: any = form.options?.viewDataRange || { company: 'belongId' };
      const result: any[] = [];
      const filterData: Record<string, any> = {};
      items.forEach((item) => {
        let filterKey: string = '';
        switch (item.typeName) {
          case TargetType.Person:
            filterKey = viewDataRange['person'];
            break;
          case TargetType.Company:
            filterKey = viewDataRange['company'] ?? 'belongId';
            break;
          case TargetType.Department:
          default:
            filterKey = viewDataRange['department'];
            break;
        }

        if (filterKey) {
          filterData[filterKey] ??= [];
          filterData[filterKey].push(item.id);
        }
      });
      for (const [key, value] of Object.entries(filterData)) {
        const isStartWithEn = /^[A-Za-z]/.test(key as string);
        result.push({ [isStartWithEn ? key : `T${key}`]: { _in_: value } });
      }
      if (isGroupSpace) {
        setTreeMatchs(result[0]);
      } else {
        setTreeMatchs(result.length > 0 ? { _or_: result } : {});
      }
    };

    return (
      <React.Fragment>
        {select ? (
          <>{loadDeatil()}</>
        ) : (
          <Layout className={'main_layout'}>
            <Layout className={'body'}>
              <Sider className={'sider'} width={250}>
                <MemberTree
                  target={directory.target}
                  searchType={searchType}
                  form={metaForm}
                  onSelectChanged={creatFilterMatchs}
                />
                <div className={'container'} id="templateMenu">
                  <SpeciesMenu
                    metaForm={metaForm}
                    directory={directory}
                    searchType={searchType}
                    isMemberView={props.isMemberView}
                    setSelectSpecies={setSelectSpecies}
                  />
                </div>
              </Sider>
              <div className={'content'}>{loadContent()}</div>
            </Layout>
          </Layout>
        )}
        {center}
      </React.Fragment>
    );
  };
  return (
    <div style={{ height: 'calc(100vh - 80px)' }}>
      {loaded ? (
        <FormBrower />
      ) : (
        <div className="loading-page">
          <LoadingView text="配置信息加载中..." />
        </div>
      )}
    </div>
  );
};

export default DictFormView;

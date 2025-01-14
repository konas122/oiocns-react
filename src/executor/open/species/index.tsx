import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { ISpecies, IDirectory, IProperty } from '@/ts/core';
import PageCard from '@/components/PageCard';
import cls from './index.module.less';
import EntityInfo from '@/components/Common/EntityInfo';
import FullScreenModal from '@/components/Common/fullScreen';
import CustomStore from 'devextreme/data/custom_store';
import GenerateFormTable from '@/executor/tools/generate/form/formTable';
import { Button, Spin, message, Modal } from 'antd';
import SpeciesItemModal from '@/executor/design/speciesModal/itemModal';
import { schema } from '@/ts/base';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import useObjectUpdate from '@/hooks/useObjectUpdate';
import { SpeciesItemColumn, PersonTypeColumn } from '@/config/column';
import CardOrTable from '@/components/CardOrTableComp';
import * as el from '@/utils/excel';
import { Uploader, showErrors, showData } from '@/executor/tools/uploadTemplate';

type IProps = {
  current: IProperty & ISpecies & IDirectory;
  finished: () => void;
};

/*
  弹出框表格查询
*/
const SpeciesyModal: React.FC<IProps> = ({ current, finished }) => {
  const hasRelationAuth = current.target.hasRelationAuth();
  const [activeTabKey, setActiveTabKey] = useState<string>(
    !current.metadata.isPersonnel ? 'Item1' : 'Item2',
  );
  const [activeModel, setActiveModel] = useState<string>('');
  const [item, setItem] = useState<schema.XSpeciesItem>();
  const [tkey, tforceUpdate] = useObjectUpdate(current);
  const [classifyData, setClassifyData] = useState<schema.XSpeciesItem[]>([]);
  const tabTypeName = useRef('人员分类');
  const [loaded] = useAsyncLoad(async () => {
    await current.loadItems(true);
    tforceUpdate();
  });

  const isTargetSpecies = useMemo(() => {
    return !!current.metadata.generateTargetId;
  }, [current.metadata]);
  const initSpecies = useCallback(async () => {
    const members = await current.target.loadMembers();
    members.forEach(async (member) => {
      const currentItem = current.items.find((a) => a.code === member.code);
      if (currentItem) {
        await current.updateItem(currentItem, {
          ...currentItem,
          name: member.name,
          relevanceId: currentItem.relevanceId || member.id,
        });
      } else {
        await current.createItem({
          relevanceId: member.id,
          code: member.code,
          name: member.name,
        } as schema.XSpeciesItem);
      }
      tforceUpdate();
    });
  }, []);

  // 导入人员分类
  const speciesImport = useCallback(() => {
    const values = [
      {
        name: '名称',
        id: 'name',
        valueType: '描述型',
        options: {
          isRequired: true,
        },
      },
      {
        name: '手机号',
        id: 'code',
        valueType: '描述型',
        options: {
          isRequired: true,
        },
      },
      {
        name: '原始人员编号',
        id: 'id',
        valueType: '描述型',
      },
      {
        name: '部门编号',
        id: 'departmentCode',
        valueType: '描述型',
      },
      {
        name: '备注',
        id: 'remark',
        valueType: '描述型',
      },
    ];
    const excel = new el.Excel(
      current.target as any,
      el.getAnythingSheets(
        {
          id: current.target.belongId,
          name: tabTypeName.current,
        } as any,
        values as any,
        'id',
      ),
    );
    const modal = Modal.info({
      icon: <></>,
      okText: '关闭',
      width: 610,
      title: tabTypeName.current + '导入',
      className: 'uploader-model',
      maskClosable: true,
      content: (
        <Uploader
          templateName={tabTypeName.current}
          excel={excel}
          finished={(_, errors) => {
            modal.destroy();
            if (errors.length > 0) {
              showErrors(errors);
              return;
            }
            const data = excel.handlers[0].sheet.data;
            const importError: el.Error[] = [];
            const res = data.filter(async (item, index) => {
              if (!!current.items.filter((a) => a.code === item.code).length) {
                importError.push({
                  name: item.name,
                  message: '人员分类已存在这个手机号',
                  row: index + 1,
                });
              } else {
                await current.createItem(item);
                tforceUpdate();
              }
            });
            if (res.length > importError.length) {
              message.success(!importError.length ? '人员导入成功' : '人员导入部分成功');
              if (importError.length) {
                showErrors(importError);
              }
            } else {
              showErrors(importError);
            }
          }}
        />
      ),
    });
  }, []);

  const createSpecies = useCallback(
    async (
      uploadData: schema.XSpeciesItem[],
      atExcelData: Map<string, schema.XSpeciesItem>,
    ) => {
      if (uploadData.length) {
        uploadData.forEach(async (item) => {
          if (isTargetSpecies && !item.info) {
            // 给组织分类生成一个新的id
            item.info = 'snowId()';
            item.remark = (item.remark || '') + '[无实际关联组织]';
          }
          const currentSpecies = await current.createItem(item);
          if (currentSpecies?.code && atExcelData.get(currentSpecies?.code)) {
            const data = atExcelData.get(currentSpecies?.code);
            if (data) data.parentId = currentSpecies?.id;
            atExcelData.delete(currentSpecies?.code);
            data && createSpecies([data], atExcelData);
          }
        });
      }
    },
    [],
  );

  //检验数据
  const checkData = useCallback(
    async (current: IProperty & ISpecies & IDirectory, excel: el.Excel) => {
      let errors: el.Error[] = [];
      // 父级分类在表格中的数据
      const atExcelData = new Map<string, schema.XSpeciesItem>();
      const data = excel.handlers[0].sheet.data;
      const uploadData = data.filter((item, index) => {
        if (!item.name) {
          errors.push({ row: index + 2, name: current.name, message: '名称不能为空！' });
        }
        if (!item.code) {
          errors.push({ row: index + 2, name: current.name, message: '编号不能为空！' });
        }
        if (isTargetSpecies ? activeModel != '新增' : true && !item.info) {
          errors.push({
            row: index + 2,
            name: current.name,
            message: '附加信息不能为空！',
          });
        }
        if (item.parentId) {
          const parentId =
            current.items.find((a) => a.code === item.parentId)?.id ||
            data.find((a) => a.code === item.parentId)?.id;
          if (parentId) {
            item.parentId = parentId;
          } else if (data.find((a) => a.code === item.parentId)) {
            atExcelData.set(item.parentId, {
              ...item,
              row: index + 2,
            });
          } else {
            errors.push({
              row: index + 2,
              name: current.name,
              message: '父级分类编号不存在！',
            });
            return false;
          }
        }
        return true;
      });

      await createSpecies(uploadData, atExcelData);
      if (atExcelData.size) {
        atExcelData.forEach((item) => {
          errors.push({
            row: item.row,
            name: current.name,
            message: '父级分类编号不存在',
          });
        });
      }
      if (uploadData.length && !errors.length) {
        message.success(current.name + '导入成功');
      } else {
        message.success(current.name + '部分导入成功');
      }
      setClassifyData([...classifyData, ...uploadData]);
      tforceUpdate();
      if (errors.length) {
        showErrors(errors);
      }
    },
    [],
  );

  // 导入分类
  const uploadSpecies = useCallback(() => {
    const values = [
      {
        name: '父级分类编号',
        id: 'parentId',
        valueType: '描述型',
        options: {
          isRequired: false,
        },
      },
      {
        name: '名称',
        id: 'name',
        valueType: '描述型',
        options: {
          isRequired: true,
        },
      },
      {
        name: '编号',
        id: 'code',
        valueType: '描述型',
        options: {
          isRequired: true,
        },
      },
      {
        name: '附加信息',
        id: 'info',
        valueType: '描述型',
        options: {
          isRequired: isTargetSpecies ? activeModel != '新增' : true,
        },
      },
      {
        name: '备注',
        id: 'remark',
        valueType: '描述型',
      },
    ];
    const sheets = el.getAnythingSheets(
      {
        id: current.belongId,
        name: current.typeName,
      } as any,
      values as any,
      'id',
    );
    const excel = new el.Excel(current as any, sheets);
    const modal = Modal.info({
      icon: <></>,
      okText: '关闭',
      width: 610,
      className: 'uploader-model',
      title: current.typeName + '导入',
      maskClosable: true,
      content: (
        <Uploader
          templateName={current.typeName}
          excel={excel}
          finished={(_) => {
            modal.destroy();
            showData(
              excel,
              (modal) => {
                modal.destroy();
                checkData(current, excel);
              },
              '开始导入',
            );
          }}
        />
      ),
    });
  }, []);
  const renderBtns = () => {
    if (hasRelationAuth) {
      return (
        <>
          {activeTabKey !== 'Item1' && (
            <>
              <Button type="link" onClick={initSpecies}>
                同步系统人员
              </Button>
              <Button type="link" onClick={speciesImport}>
                导入人员分类
              </Button>
            </>
          )}
          {current.typeName === '分类' && (
            <Button type="link" onClick={uploadSpecies}>
              导入分类
            </Button>
          )}
          <Button type="link" onClick={() => setActiveModel('新增')}>
            {'新增' +
              (activeTabKey === 'Item1' ? current.typeName : tabTypeName.current) +
              '项'}
          </Button>
        </>
      );
    }
    return <></>;
  };

  useEffect(() => {
    if (current.typeName === '分类' && loaded) {
      const list = JSON.parse(JSON.stringify(current.items));
      setClassifyData(convertTreeData(list, undefined));
    } else {
      setClassifyData(current.items);
    }
  }, [current.items]);
  const convertTreeData = (list: schema.XSpeciesItem[], parentId: string | undefined) => {
    let map = list.reduce((prev: any, cur: schema.XSpeciesItem) => {
      prev[cur.id] = cur;
      return prev;
    }, {});
    let result = [];
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (item.parentId === parentId) {
        result.push(item);
        continue;
      }
      const parent = map[item.parentId];
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(item);
      }
    }
    return result;
  };

  // 操作内容渲染函数
  const renderOperate = (item: schema.XSpeciesItem) => {
    if (hasRelationAuth) {
      const typeName = !current.metadata.isPersonnel
        ? current.typeName
        : tabTypeName.current;
      const operates = [
        {
          key: `编辑${typeName}项`,
          label: `编辑${typeName}项`,
          onClick: () => {
            setItem(item);
            setActiveModel('编辑');
          },
        },
        {
          key: `删除${typeName}项`,
          label: <span style={{ color: 'red' }}>{`删除${typeName}项`}</span>,
          onClick: async () => {
            await current.hardDeleteItem(item);
            tforceUpdate();
          },
        },
      ];
      if (current.typeName != '字典') {
        operates.unshift({
          key: `新增${current.typeName}子项`,
          label: `新增${current.typeName}子项`,
          onClick: () => {
            setItem(item);
            setActiveModel('新增');
          },
        });
      }
      return operates;
    }
    return [];
  };

  const loadSpeciesItemModal = () => {
    return activeModel == '新增' || (activeModel == '编辑' && item != undefined) ? (
      <SpeciesItemModal
        open
        data={item}
        current={current}
        typeName={activeTabKey === 'Item1' ? current.typeName : tabTypeName.current}
        operateType={activeModel}
        handleCancel={() => {
          setActiveModel('');
          setItem(undefined);
        }}
        handleOk={async (success: boolean) => {
          if (success) {
            message.success('操作成功');
            setItem(undefined);
            setActiveModel('');
            await current.loadItems(true);
            tforceUpdate();
          }
        }}
      />
    ) : (
      <></>
    );
  };

  return (
    <FullScreenModal
      open
      centered
      fullScreen
      width={'80vw'}
      destroyOnClose
      title={current.typeName + '管理'}
      onCancel={() => finished()}
      footer={[]}>
      <EntityInfo entity={current} hasRelationAuth={hasRelationAuth} />
      <PageCard
        className={cls[`card-wrap`]}
        bordered={false}
        activeTabKey={activeTabKey}
        onTabChange={(key) => setActiveTabKey(key)}
        tabBarExtraContent={activeTabKey === 'Items' ? null : renderBtns()}
        tabList={[
          !current.metadata.isPersonnel
            ? {
                tab: `${current.typeName}项`,
                key: 'Item1',
              }
            : {
                tab: tabTypeName.current,
                key: 'Item2',
              },
          {
            tab: `关联属性`,
            key: 'Items',
          },
        ]}>
        {activeTabKey == 'Items' ? (
          <GenerateFormTable
            key={current.key}
            height={500}
            fields={[]}
            scrolling={{ mode: 'standard' }}
            pager={{
              visible: true,
              allowedPageSizes: [20, 50, 'all'],
              displayMode: 'full',
              showInfo: true,
              showPageSizeSelector: true,
              showNavigationButtons: true,
            }}
            dataSource={
              new CustomStore({
                key: 'id',
                async load(loadOptions: any) {
                  loadOptions.userData = [];
                  return await current.loadBindingProperity(loadOptions);
                },
              })
            }
            remoteOperations={true}
            toolbar={{
              visible: true,
              items: [
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
          />
        ) : (
          <Spin spinning={!loaded}>
            <CardOrTable<schema.XSpeciesItem>
              key={tkey}
              rowKey={'id'}
              dataSource={classifyData}
              operation={renderOperate}
              columns={activeTabKey === 'Item1' ? SpeciesItemColumn : PersonTypeColumn}
            />
          </Spin>
        )}
        {loadSpeciesItemModal()}
      </PageCard>
    </FullScreenModal>
  );
};

export default SpeciesyModal;

import React, { useState, useEffect, Suspense, lazy, useCallback, useMemo } from 'react';
import ToolBar from './components/tool';
import cls from './index.module.less';
import { IReport, orgAuth } from '@/ts/core';
import { Emitter } from '@/ts/base/common';
import { Tabs, Modal, Form, Input, message, Button } from 'antd';
import { XAttribute, XCells, XFloatRowsInfo, XSheet, XVariables } from '@/ts/base/schema';

const HotTableView = lazy(() => import('./components/hotTable'));

interface IProps {
  current: IReport;
  notityEmitter: Emitter;
  selectCellItem: (cell: XCells | undefined) => void;
  selectRow: (rowInfo: XFloatRowsInfo | undefined) => void;
}

const ReportDesign: React.FC<IProps> = ({
  current,
  notityEmitter,
  selectCellItem,
  selectRow,
}) => {
  const [reportChange, setReportChange] = useState<any>();
  const [changeType, setChangeType] = useState<string>('');
  const [classType, setClassType] = useState<string | undefined>('');
  const [sheetList, setSheetList] = useState<XSheet[]>([]);
  const [cellStyle, setCellStyle] = useState<any>();
  const [key, setKey] = useState<string>('');
  const [activeKey, setActiveKey] = useState(sheetList[0]?.code);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('add');
  const [tabsKey, setTabsKey] = useState<string>('');
  const [form] = Form.useForm();

  useEffect(() => {
    /** 获取报表数据，没有数据默认给个sheet页 */
    let sheetListData: XSheet[] = current.metadata?.sheets
      ? Object.values(current.metadata?.sheets)
      : [
          {
            name: current.metadata.name,
            code: 'sheet1',
            sheetConfig: {},
            cells: {},
          },
          {
            name: '变量集',
            code: 'variableSheet',
            sheetConfig: {},
            cells: {},
          },
        ];
    setActiveKey(sheetListData[0].code);
    setSheetList(sheetListData);
  }, [current.metadata]);

  const onEdit = useCallback(
    (
      targetKey: React.MouseEvent | React.KeyboardEvent | string,
      action: 'add' | 'remove',
    ) => {
      if (action === 'add') {
        setStatus('add');
        setOpen(true);
      } else {
        remove(targetKey);
      }
    },
    [],
  );

  const remove = useCallback(
    (targetKey: React.MouseEvent | React.KeyboardEvent | string) => {
      setSheetList((prev) => {
        const newPanes = prev.filter((item) => item.code !== targetKey);
        let newActiveKey = activeKey;
        if (newPanes.length && newActiveKey === targetKey) {
          const lastIndex = prev.findIndex((item) => item.code === targetKey) - 1;
          newActiveKey = lastIndex >= 0 ? newPanes[lastIndex].code : newPanes[0].code;
        }
        setActiveKey(newActiveKey);
        return newPanes;
      });
    },
    [activeKey],
  );

  const handleAdd = useCallback(() => {
    form.validateFields().then((values) => {
      let newItem: XSheet;
      if (status === 'edit') {
        const sheetIndex = sheetList.findIndex((sheet) => sheet.code === activeKey);
        if (sheetList[sheetIndex]) {
          newItem = {
            ...sheetList[sheetIndex],
            name: values.name,
            code: values.code,
          };
          sheetList[sheetIndex] = newItem;
        }
      } else {
        newItem = {
          name: values.name,
          code: values.code,
          sheetConfig: {},
          cells: {},
        };
        const index = sheetList.findIndex((sheet) => sheet.code === 'variableSheet');
        setSheetList([...sheetList.slice(0, index), newItem, ...sheetList.slice(index)]);
      }
      setActiveKey(newItem!.code);
      setTabsKey(Math.random().toString(36));
      setOpen(false);
      form.resetFields();
    });
  }, [form, status, sheetList, activeKey]);

  const handleDataUpdata = useCallback(
    async (index: number, data: XSheet) => {
      sheetList[index] = data;

      if (index + 1 === sheetList.length) {
        const res = await createAttr(sheetList);
        await onSave(res);
      }
    },
    [sheetList],
  );

  const createAttr = useCallback(
    async (sheetList: XSheet[]) => {
      let attrs: XAttribute[] = current.metadata.attributes;
      for (const sheet of sheetList) {
        if (sheet.code != 'variableSheet') {
          if (!sheet.attributeId) {
            const item: any = await current.createReportAttribute({
              code: sheet.code,
              isChangeSource: false,
              isChangeTarget: false,
              name: sheet.name + '-' + sheet.code,
              remark: sheet.name + '-' + sheet.code,
              valueType: '对象型',
            });
            const attr: XAttribute = {
              propId: item.id,
              property: item,
              ...item,
              rule: '{}',
              options: {
                visible: true,
                isRequired: false,
              },
              formId: current.id,
              authId: orgAuth.SuperAuthId,
              widget: '对象型',
            };
            sheet.attributeId = attr.id;
            attrs.push(attr);
          }
          for (const cell of Object.values(sheet.cells)) {
            if (cell.rule.value?.type === '属性型' && cell.rule.value.valueString) {
              if (!attrs.some((a) => a.propId === cell.rule.value?.valueString.propId)) {
                attrs = [...attrs, cell.rule.value.valueString];
              }
            }
          }
          if (sheet.sheetConfig?.floatRowsSetting) {
            for (const floatRow of sheet.sheetConfig.floatRowsSetting) {
              if (!floatRow.attributeId) {
                const floatRowItem: any = await current.createReportAttribute({
                  code: floatRow.floatRowCode,
                  isChangeSource: false,
                  isChangeTarget: false,
                  name: `${sheet.name}.floatRow-${floatRow.floatRowCode}`,
                  remark: `${sheet.name}.floatRow-${floatRow.floatRowCode}`,
                  valueType: '对象型',
                });
                const attr: XAttribute = {
                  propId: floatRowItem.id,
                  property: floatRowItem,
                  ...floatRowItem,
                  rule: '{}',
                  options: { visible: true, isRequired: false },
                  formId: current.id,
                  authId: orgAuth.SuperAuthId,
                  widget: '对象型',
                };
                floatRow.attributeId = attr.id;
                attrs.push(attr);
              }
              for (const info of floatRow.rowsInfo) {
                if (info.rule.value?.type === '属性型' && info.rule.value.valueString) {
                  if (
                    !attrs.some((a) => a.propId === info.rule.value?.valueString.propId)
                  ) {
                    attrs = [...attrs, info.rule.value.valueString];
                  }
                }
              }
            }
          }
        }
      }

      current.metadata.attributes = attrs;
      return sheetList;
    },
    [current],
  );

  const onSave = useCallback(
    async (sheets: XSheet[]) => {
      const sheetsJson: any = {};
      let variables: XVariables = {};
      sheets.forEach((item, index) => {
        sheetsJson[index] = item;
        if (item.code == 'variableSheet') {
          const cells = item.cells;
          Object.keys(cells).forEach((key) => {
            const { rule } = cells[key];
            if (rule?.value) {
              variables[key] = rule;
            }
          });
        }
      });

      current.metadata.variables = variables;
      current.metadata.sheets = sheetsJson;
      current.metadata.reportId = 'snowId()';
      await current.save();
      message.success('保存成功');
    },
    [current],
  );

  const editSheet = useCallback(() => {
    const sheet = sheetList.find((sheet) => sheet.code === activeKey);
    if (sheet) {
      form.setFieldValue('name', sheet.name);
      form.setFieldValue('code', sheet.code);
      setStatus('edit');
      setOpen(true);
    }
  }, [sheetList, activeKey, form]);

  const loadContent = useMemo(() => {
    if (sheetList.length < 1) return <></>;
    const loadItems = () => {
      return sheetList.map((sheet, index) => ({
        key: sheet.code,
        label: sheet.name,
        forceRender: true,
        closable: sheet.code != 'variableSheet',
        children: (
          <Suspense fallback={<div>Loading...</div>}>
            <HotTableView
              key={sheet.code}
              updateKey={key}
              current={current}
              notityEmitter={notityEmitter}
              handEcho={(cellStyle: any) => {
                setCellStyle(cellStyle);
              }}
              selectCellItem={selectCellItem}
              selectRow={selectRow}
              onUpdate={(data) => handleDataUpdata(index, data)}
              sheet={sheet}
              reportChange={reportChange}
              changeType={changeType}
              classType={classType}
            />
          </Suspense>
        ),
      }));
    };
    return (
      <Tabs
        key={tabsKey}
        tabBarExtraContent={
          <div>
            {activeKey !== 'variableSheet' && <Button onClick={editSheet}>编辑</Button>}
          </div>
        }
        tabPosition={'bottom'}
        type="editable-card"
        items={loadItems()}
        activeKey={activeKey}
        onEdit={onEdit}
        onChange={(key) => setActiveKey(key)}
      />
    );
  }, [
    sheetList,
    key,
    current,
    notityEmitter,
    selectCellItem,
    selectRow,
    handleDataUpdata,
    reportChange,
    changeType,
    classType,
    activeKey,
    onEdit,
    tabsKey,
  ]);

  return (
    <div className={cls['report-content-box']}>
      <div className={cls['report-tool-box']}>
        <ToolBar
          cellStyle={cellStyle}
          handClick={(value: string | any, type: string, classType?: any) => {
            setKey(Math.random().toString(36));
            setReportChange(value);
            setChangeType(type);
            setClassType(classType);
          }}
        />
      </div>
      {loadContent}
      <Modal
        title={status === 'add' ? '新建表格' : '编辑表格'}
        open={open}
        onOk={handleAdd}
        onCancel={() => setOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入表名!' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label="代码"
            rules={[{ required: true, message: '请输入代码!' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default React.memo(ReportDesign);

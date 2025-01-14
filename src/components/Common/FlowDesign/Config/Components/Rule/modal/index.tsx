import React, { useState } from 'react';
import CardOrTableComp from '@/components/CardOrTableComp';
import { ProColumns } from '@ant-design/pro-components';
import { Card, Typography, Divider, Button, Popover } from 'antd';
import CalcRuleModal from './calc';
import ShowRuleModal from './show';
import CombinationWork from './combination';
import Assignment from './assignment';
import CodeRuleModal from './code';
import { model } from '@/ts/base';
import { WorkNodeModel } from '@/ts/base/model';
import { Field } from 'devextreme/ui/filter_builder';
import { Form } from '@/ts/core/thing/standard/form';
import { IWork } from '@/ts/core';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import ExecutorRuleModal from './executor';
import cls from '../index.module.less';
import { Theme } from '@/config/theme';
import useObjectUpdate from '@/hooks/useObjectUpdate';
import ValidateRuleModal from './validate';
interface IProps {
  work: IWork;
  current: WorkNodeModel;
}

const RuleList: React.FC<IProps> = (props) => {
  const { primaryForms, detailForms } = props.current;
  const [key, tforceUpdate] = useObjectUpdate(props.current.formRules ?? []);
  const [formRules, setFormRules] = useState<model.Rule[]>(
    props.current.formRules.filter((rule) => rule.type !== 'encode') ?? [],
  );
  const [fields, setFields] = useState<Field[]>([]);
  const [openType, setOpenType] = useState(0);
  const [select, setSelect] = useState<model.Rule>();
  const [loaded] = useAsyncLoad(async () => {
    const fields: Field[] = [];
    for (const xform of primaryForms) {
      const form = new Form({ ...xform, id: xform.id + '_' }, props.work.directory);
      const xfields = await form.loadFields();
      fields.push(
        ...(xfields.map((a) => {
          const name = `${form.name}--${a.name}`;
          switch (a.valueType) {
            case '数值型':
            case '货币型':
              return {
                name: xform.id + '-' + a.id,
                caption: name,
                formId: xform.id,
                dataField: a.code,
                dataType: 'number',
              };
            case '日期型':
              return {
                name: xform.id + '-' + a.id,
                caption: name,
                dataField: a.code,
                dataType: 'date',
              };
            case '时间型':
              return {
                name: xform.id + '-' + a.id,
                caption: name,
                formId: xform.id,
                dataField: a.code,
                dataType: 'datetime',
              };
            case '选择型':
            case '分类型':
              return {
                name: xform.id + '-' + a.id,
                caption: name,
                dataField: a.code,
                dataType: 'string',
                lookup: {
                  displayExpr: 'text',
                  valueExpr: 'value',
                  allowClearing: true,
                  dataSource: a.lookups,
                },
              };
            default:
              return {
                name: xform.id + '-' + a.id,
                caption: name,
                dataField: xform.id + '-' + a.id,
                dataType: 'string',
              };
          }
        }) as Field[]),
      );
    }
    setFields(fields);
  }, [primaryForms, detailForms]);
  /** 展示规则信息列 */
  const ruleColumns: ProColumns<model.Rule>[] = [
    { title: '序号', valueType: 'index', width: 50 },
    {
      title: '名称',
      dataIndex: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (_: any, record: model.Rule) => {
        switch (record.type) {
          case 'show':
            return '渲染';
          case 'calc':
            return '计算';
          case 'code':
            return '代码';
          case 'validate':
            return '校验';
        }
      },
    },
    {
      title: '备注',
      dataIndex: 'display',
      render: (_: any, record: model.Rule) => {
        return (
          <Typography.Text
            style={{ fontSize: 12, color: '#888' }}
            title={record.remark}
            ellipsis>
            {record.remark}
          </Typography.Text>
        );
      },
    },
    {
      title: '操作',
      dataIndex: 'operate',
      render: (_: any, record: model.Rule) => {
        return (
          <div>
            <Button
              type="text"
              size="small"
              style={{ marginRight: '4px' }}
              className={cls['flowDesign-rule-edit']}
              onClick={() => {
                setSelect(record);
                setOpenType(
                  record.type == 'show'
                    ? 1
                    : record.type == 'calc'
                    ? 2
                    : record.type == 'code'
                    ? 4
                    : record.type == 'validate'
                    ? 5
                    : record.type === 'combination'
                    ? 6
                    : record.type === 'assignment'
                    ? 7
                    : -1,
                );
              }}>
              编辑
            </Button>
            <Button
              type="text"
              size="small"
              className={cls['flowDesign-rule-delete']}
              onClick={() => {
                props.current.formRules = (formRules ?? []).filter(
                  (a) => a.id != record.id,
                );
                setFormRules([...props.current.formRules]);
              }}>
              删除
            </Button>
          </div>
        );
      },
    },
  ];

  const openDialog = (type: number) => {
    switch (type) {
      case 1:
        return (
          <ShowRuleModal
            fields={fields}
            primarys={primaryForms}
            details={detailForms}
            onCancel={() => setOpenType(0)}
            current={select as model.NodeShowRule}
            onOk={(rule) => {
              setOpenType(0);
              props.current.formRules = [
                rule,
                ...(formRules ?? []).filter((a) => a.id != rule.id),
              ];
              setFormRules([...props.current.formRules]);
              tforceUpdate();
            }}
          />
        );
      case 2:
        return (
          <CalcRuleModal
            primarys={primaryForms}
            details={detailForms}
            onCancel={() => setOpenType(0)}
            current={select as model.NodeCalcRule}
            onOk={(rule) => {
              setOpenType(0);
              props.current.formRules = [
                rule,
                ...(formRules ?? []).filter((a) => a.id != rule.id),
              ];
              setFormRules([...props.current.formRules]);
              tforceUpdate();
            }}
          />
        );
      case 3:
        return (
          <ExecutorRuleModal
            fields={fields}
            details={detailForms}
            onCancel={() => setOpenType(0)}
            current={select as model.NodeExecutorRule}
            onOk={(rule) => {
              setOpenType(0);
              props.current.formRules = [
                rule,
                ...(formRules ?? []).filter((a) => a.id != rule.id),
              ];
              setFormRules([...props.current.formRules]);
              tforceUpdate();
            }}
          />
        );
      case 4:
        return (
          <CodeRuleModal
            primarys={primaryForms}
            details={detailForms}
            onCancel={() => setOpenType(0)}
            current={select as model.NodeCodeRule}
            onOk={(rule) => {
              setOpenType(0);
              props.current.formRules = [
                rule,
                ...(formRules ?? []).filter((a) => a.id != rule.id),
              ];
              setFormRules([...props.current.formRules]);
              tforceUpdate();
            }}
          />
        );
      case 5:
        return (
          <ValidateRuleModal
            primarys={primaryForms}
            details={detailForms}
            onCancel={() => setOpenType(0)}
            current={select as model.NodeValidateRule}
            onOk={(rule) => {
              setOpenType(0);
              props.current.formRules = [
                rule,
                ...(formRules ?? []).filter((a) => a.id != rule.id),
              ];
              setFormRules([...props.current.formRules]);
            }}
          />
        );
      case 6:
        return (
          <CombinationWork
            primarys={primaryForms}
            details={detailForms}
            onCancel={() => setOpenType(0)}
            current={select as model.NodeCombinationRule}
            onOk={(rule) => {
              setOpenType(0);
              props.current.formRules = [
                rule,
                ...(formRules ?? []).filter((a) => a.id != rule.id),
              ];
              setFormRules([...props.current.formRules]);
              tforceUpdate();
            }}
          />
        );
      case 7:
        return (
          <Assignment
            primarys={primaryForms}
            details={detailForms}
            work={props.work}
            current={select as model.NodeAssignmentRule}
            onOk={(rule) => {
              setOpenType(0);
              props.current.formRules = [
                rule,
                ...(formRules ?? []).filter((a) => a.id != rule.id),
              ];
              setFormRules([...props.current.formRules]);
              tforceUpdate();
            }}
            onCancel={() => setOpenType(0)}
          />
        );
      default:
        return <></>;
    }
  };
  if (!loaded) return <></>;

  return (
    <Card
      type="inner"
      title={
        <div>
          <Divider
            type="vertical"
            style={{
              height: '16px',
              borderWidth: '4px',
              borderColor: Theme.FocusColor,
              marginLeft: '0px',
            }}
            className={cls['flowDesign-rule-divider']}
          />
          <span>规则配置</span>
        </div>
      }
      bodyStyle={{ padding: formRules && formRules.length > 0 ? '12px' : 0 }}
      extra={
        <>
          <Popover
            trigger="click"
            placement="bottomLeft"
            content={
              <>
                {fields && fields.length > 0 && (
                  <>
                    <a
                      style={{ padding: 5 }}
                      onClick={() => {
                        setSelect(undefined);
                        setOpenType(1);
                      }}>
                      + 添加渲染规则
                    </a>
                    <Divider style={{ margin: 6 }} />
                    <a
                      style={{ padding: 5 }}
                      onClick={() => {
                        setSelect(undefined);
                        setOpenType(2);
                      }}>
                      + 添加计算规则
                    </a>
                    <Divider style={{ margin: 6 }} />
                    <a
                      style={{ padding: 5 }}
                      onClick={() => {
                        setSelect(undefined);
                        setOpenType(4);
                      }}>
                      + 添加代码规则
                    </a>
                    <Divider style={{ margin: 6 }} />
                    <a
                      style={{ padding: 5 }}
                      onClick={() => {
                        setSelect(undefined);
                        setOpenType(5);
                      }}>
                      + 添加校验规则
                    </a>
                    <Divider style={{ margin: 6 }} />
                    <a
                      style={{ padding: 5 }}
                      onClick={() => {
                        setSelect(undefined);
                        setOpenType(7);
                      }}>
                      + 添加赋值规则
                    </a>
                    <Divider style={{ margin: 6 }} />
                    <a
                      style={{ padding: 5 }}
                      onClick={() => {
                        setSelect(undefined);
                        setOpenType(6);
                      }}>
                      + 添加组合办事规则
                    </a>
                  </>
                )}
              </>
            }>
            <a className="primary-color">+ 添加</a>
          </Popover>
        </>
      }>
      <CardOrTableComp<model.Rule>
        key={key}
        rowKey={'id'}
        columns={ruleColumns}
        dataSource={formRules}
        scroll={{ y: 'calc(80vh - 150px)' }}
      />
      {openDialog(openType)}
    </Card>
  );
};
export default RuleList;

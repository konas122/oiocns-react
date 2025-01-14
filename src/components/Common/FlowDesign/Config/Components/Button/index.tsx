import React, { useEffect, useState } from 'react';
import { Button, Card, Divider } from 'antd';
import { WorkNodeButton, WorkNodeModel } from '@/ts/base/model';
import { IWork } from '@/ts/core';
import cls from './index.module.less';
import { Theme } from '@/config/theme';
import message from '@/utils/message';
import CardOrTableComp from '@/components/CardOrTableComp';
import { ProColumns } from '@ant-design/pro-components';
import ButtonModal from './ButtonModal';
interface IProps {
  work: IWork;
  current: WorkNodeModel;
}

const ButtonConfig: React.FC<IProps> = (props) => {
  const [buttons, setButtons] = useState<WorkNodeButton[]>([]);
  const [visible, setVisible] = useState(false);
  const [openType, setOpenType] = useState('add');
  const [row, setRow] = useState<WorkNodeButton | null>(null);

  useEffect(() => {
    setButtons(props.current.buttons || []);
  }, [props.current.buttons]);

  function updateButtons(buttons: WorkNodeButton[]) {
    setButtons(buttons);
    props.current.buttons = buttons;
  }

  const columns: ProColumns<WorkNodeButton>[] = [
    { title: '序号', valueType: 'index', width: 50 },
    {
      title: '标识',
      dataIndex: 'code',
      width: 80,
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 120,
    },
    {
      title: '操作对象',
      dataIndex: 'type',
      render: (_: any, record: WorkNodeButton) => {
        return record.type == 'rule' ? '规则' : record.type == 'executor' ? '执行器' : '';
      },
      width: 80,
    },
    {
      title: '操作',
      dataIndex: 'operate',
      fixed: 'right',
      render: (_: any, record: WorkNodeButton) => {
        return (
          <div>
            <Button
              type="link"
              size="small"
              style={{ marginRight: '4px' }}
              className={cls['flowDesign-rule-edit']}
              onClick={() => {
                setOpenType('edit');
                setRow(record);
                setVisible(true);
              }}>
              编辑
            </Button>
            <Button
              type="link"
              danger
              size="small"
              className={cls['flowDesign-rule-delete']}
              onClick={() => {
                updateButtons(buttons.filter((b) => b.code != record.code));
              }}>
              删除
            </Button>
          </div>
        );
      },
      width: 120,
    },
  ];

  function open() {
    setOpenType('add');
    setRow({
      code: '',
      name: '',
      type: 'rule',
    });
    setVisible(true);
  }

  function addButton(button: WorkNodeButton) {
    if (!button.code || !button.name) {
      return;
    }
    if (buttons.some((b) => b.code == button.code)) {
      message.warn('按钮标识重复');
      return;
    }
    updateButtons([...buttons, button]);
  }

  function renderButtons() {
    return (
      <div className={cls.layout}>
        <CardOrTableComp<WorkNodeButton>
          rowKey={'id'}
          columns={columns}
          dataSource={buttons}
        />
      </div>
    );
  }

  return (
    <Card
      type="inner"
      className={cls['card-info']}
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
          />
          <span>按钮配置</span>
        </div>
      }
      bodyStyle={{ padding: buttons.length > 0 ? '8px' : 0 }}
      extra={
        <>
          <a
            className="primary-color"
            onClick={() => {
              open();
            }}>
            + 添加
          </a>
        </>
      }>
      {buttons.length > 0 && renderButtons()}
      {visible && (
        <ButtonModal
          current={row!}
          rules={props.current.formRules}
          executors={props.current.executors}
          work={props.work}
          onOk={(button) => {
            if (openType == 'add') {
              addButton(button);
            } else {
              updateButtons([...buttons]);
            }
            setVisible(false);
          }}
          onCancel={() => setVisible(false)}
        />
      )}
    </Card>
  );
};
export default ButtonConfig;

import { model } from '@/ts/base';
import { IWork } from '@/ts/core';
import { Button, InputNumber, Modal, Space } from 'antd';
import { CheckBox } from 'devextreme-react';
import React, { useEffect, useMemo, useState } from 'react';
import ButtonConfig from './button';
import VariableMapping from '../Rule/modal/VariableMapping';

const DataModal = (props: {
  operateRule: any;
  departData: any;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [mappingData, setMappingData] = useState<model.MappingData[]>(
    props.operateRule.showChangeData ?? [],
  );
  const [triggers, setTriggers] = useState<model.MappingData[]>([]);

  useEffect(() => {
    const tgs: model.MappingData[] = [];
    if (props.departData) {
      props.departData.forEach((a: any) => {
        tgs.push(
          ...a.attributes.map((s: any) => {
            return {
              id: s.id,
              formName: a.name,
              key: a.id + s.id,
              formId: a.id,
              typeName: '集合',
              trigger: a.id,
              code: s.code,
              name: s.name,
            };
          }),
        );
      });
    }
    setTriggers(tgs);
  }, [props.departData]);

  if (!props.isOpen) return null;

  return (
    <Modal
      destroyOnClose
      title={'绑定属性'}
      width={800}
      open={props.isOpen}
      bodyStyle={{ border: 'none', padding: 0, marginLeft: '32px', marginRight: '32px' }}
      onOk={() => {
        (props.operateRule.showChangeData = mappingData), props.onClose();
      }}
      onCancel={props.onClose}>
      <Space direction="vertical" size={15} style={{ width: '100%' }}>
        <VariableMapping
          mappingData={mappingData}
          forms={props.departData}
          onChange={(v: any, _def: any) => {
            setMappingData(v);
          }}
          triggers={triggers}
        />
      </Space>
    </Modal>
  );
};

const loadOperateRule = (
  label: string,
  operateRule: any,
  operate: string,
  departData?: { name: string; id: string; type?: string }[],
) => {
  const [isShow, setIsShow] = useState<boolean | null>(
    operateRule.allowShowChangeData ?? false,
  );
  const [isOpen, setIsOpen] = useState(false);

  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Space>
      <CheckBox
        defaultValue={operateRule[operate] ?? false}
        onValueChange={(e) => ((operateRule[operate] = e), setIsShow(e))}
      />
      {label === '仅显示变更数据' ? (
        isShow == true ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 110 }}>{label}</div>
            <div style={{ cursor: 'pointer' }} onClick={() => toggleModal()}>
              绑定
            </div>
          </div>
        ) : (
          <div style={{ width: 110 }}>{label}</div>
        )
      ) : (
        <div style={{ width: 30 }}>{label}</div>
      )}
      <DataModal
        operateRule={operateRule}
        departData={departData}
        isOpen={isOpen}
        onClose={toggleModal}
      />
    </Space>
  );
};

export const FormOption = (props: {
  operateRule: model.FormInfo;
  typeName: string;
  departData?: { name: string; id: string; type?: string }[];
  work: IWork;
}) => {
  const [center, setCenter] = useState(<></>);
  const isGroupDetailFrom = useMemo(() => {
    return (
      props.work.directory.target.typeName === '组织群' &&
      props.operateRule.typeName === '子表'
    );
  }, [props.work.directory.target.typeName, props.operateRule.typeName]);

  return (
    <Space>
      <Space>
        <InputNumber
          value={props.operateRule.order}
          onChange={(e) => (props.operateRule.order = e!)}
          controls
          step={1}
          placeholder="排序"
        />
      </Space>
      {loadOperateRule('新增', props.operateRule, 'allowAdd')}
      {loadOperateRule('变更', props.operateRule, 'allowEdit')}
      {loadOperateRule('选择', props.operateRule, 'allowSelect')}
      {loadOperateRule('生成', props.operateRule, 'allowGenerate')}
      {loadOperateRule('选择文件', props.operateRule, 'allowSelectFile')}
      {loadOperateRule(
        isGroupDetailFrom ? '集群空间' : '单位空间',
        props.operateRule,
        'selectBelong',
      )}
      {loadOperateRule('关闭锁', props.operateRule, 'closeLock')}
      {props.operateRule.typeName === '子表' &&
        loadOperateRule(
          '仅显示变更数据',
          props.operateRule,
          'allowShowChangeData',
          props.departData,
        )}
      {props.operateRule.typeName === '子表' && (
        <Space>
          {loadOperateRule('带出数据', props.operateRule, 'autoFill')}
          <Button
            size="small"
            onClick={() =>
              setCenter(
                <ButtonConfig
                  operateRule={props.operateRule}
                  work={props.work}
                  finished={() => setCenter(<></>)}
                />,
              )
            }>
            按钮配置
          </Button>
        </Space>
      )}
      {center}
    </Space>
  );
};

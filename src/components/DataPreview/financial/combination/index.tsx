import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Select } from 'antd';
import { IWork, IWorkApply } from '@/ts/core';
import { model } from '@/ts/base';
import DefaultWayStart from '@/executor/tools/task/start/default';

interface Iprops {
  current: IWork;
  finished: (success: boolean) => void;
  apply: IWorkApply;
}

const Combination: React.FC<Iprops> = ({ current, apply, finished }) => {
  const [selectDetailFormId, setSelectDetailFormId] = useState<string>(
    current.detailForms[0]?.id,
  );
  const [curBusinessType, setCurBusinessType] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const combinationRules: model.Rule<model.RuleType>[] | undefined =
      current.node?.formRules.filter((i) => i.type === 'combination');
    if (combinationRules) {
      setCurBusinessType(combinationRules[0].applyType || '');
      if (combinationRules[0].applyType === '拆分') {
        current.primaryForms[0].metadata.options!.businessType = '拆分';
        combinationRules[0].combination!.detailFormId = selectDetailFormId;
      } else if (combinationRules[0].applyType === '合并') {
        setSelectDetailFormId('');
      }
    }
  }, [selectDetailFormId]);

  useEffect(() => {
    if (current.detailForms.length > 0 && curBusinessType === '拆分') {
      setOpen(true);
    }
  }, [curBusinessType]);

  const renderModalElement = () => {
    return (
      <Modal
        title="请选择本次拆分的业务单据"
        open={open}
        onCancel={() => {
          setOpen(false);
          finished(false);
          setCurBusinessType('');
        }}
        onOk={() => {
          setOpen(false);
        }}>
        <Select
          style={{ width: '280px' }}
          value={selectDetailFormId}
          options={current.detailForms.map((item) => ({
            label: item.name,
            value: item.id,
          }))}
          onChange={(value) => {
            setSelectDetailFormId(value);
          }}
        />
      </Modal>
    );
  };

  const renderElement = useMemo(() => {
    if (!open) {
      return (
        <DefaultWayStart
          apply={apply}
          work={current}
          splitDetailFormId={selectDetailFormId}
          finished={finished}
        />
      );
    }
    return null;
  }, [open, selectDetailFormId]);

  return <React.Fragment>{open ? renderModalElement() : renderElement}</React.Fragment>;
};

export default Combination;

import React, { useState, useEffect } from 'react';
import { Card } from 'antd';
import { SelectBox } from 'devextreme-react';
import { model, schema } from '@/ts/base';
import { getUuid } from '@/utils/tools';
import FullScreenModal from '@/components/Common/fullScreen';
import { Combination } from './components';

interface Iprops {
  primarys: schema.XForm[];
  details: schema.XForm[];
  current: model.NodeCombinationRule;
  onOk: (rule: model.NodeCombinationRule) => void;
  onCancel: () => void;
}

const CombinationWork: React.FC<Iprops> = ({
  primarys,
  details,
  current,
  onOk,
  onCancel,
}) => {
  const [applyType, setApplyType] = useState<string>(current?.applyType || '拆分');
  const [targetSource, setTargetSource] = useState<model.MappingData[]>([]);
  const [combination, setCombination] = useState(current?.combination);

  useEffect(() => {
    const tgs: model.MappingData[] = [];
    primarys.forEach((a, index) => {
      tgs.unshift(
        ...a.attributes.map((s) => {
          return {
            id: s.id,
            key: index.toString() + s.id,
            formId: a.id,
            formName: a.name,
            typeName: '属性',
            trigger: s.id,
            code: s.code,
            name: s.name,
            widget: s.widget,
            valueType: s.valueType,
          };
        }),
      );
    });
    setTargetSource(tgs);
  }, [primarys]);

  const conditionChange = (combinationInfo: model.CombinationType) => {
    setCombination({
      ...combination,
      ...combinationInfo,
    });
  };

  const renderElement = () => {
    switch (applyType) {
      case '拆分':
      case '合并':
        return (
          <Combination.CombinationSplit
            targetSource={targetSource}
            detailForms={details}
            combination={combination}
            onValueChange={conditionChange}
            applyType={applyType}
          />
        );
      default:
        return <>{applyType}业务配置处理</>;
    }
  };

  return (
    <FullScreenModal
      open={true}
      title={'组合办事规则'}
      destroyOnClose
      width={'40vw'}
      bodyHeight={'60vh'}
      onSave={() => {
        onOk.apply(this, [
          {
            id: current?.id ?? getUuid(),
            type: 'combination',
            name: combination.name,
            applyType: applyType,
            remark: combination.remark,
            combination: combination,
            trigger: [],
          },
        ]);
      }}
      onCancel={onCancel}>
      <div>
        <SelectBox
          label="请选择业务类型"
          showClearButton
          value={applyType}
          dataSource={[
            { text: '拆分', value: '拆分' },
            { text: '合并', value: '合并' },
            { text: '变动', value: '变动' },
          ]}
          displayExpr={'text'}
          valueExpr={'value'}
          onValueChange={(e) => {
            setApplyType(e);
          }}
        />
        <Card title={`${applyType}业务配置`} style={{ marginTop: '12px' }}>
          {renderElement()}
        </Card>
      </div>
    </FullScreenModal>
  );
};
export default CombinationWork;

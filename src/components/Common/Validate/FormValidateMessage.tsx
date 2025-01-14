import { ValidateErrorInfo } from '@/ts/base/model';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import { Button, Tag } from 'antd';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { ValidateMessagePanel } from './ValidateMessagePanel';
import {
  isRequiredValidateError,
  isRuleValidateError,
} from '@/ts/scripting/core/rule/ValidateHandler';
import cls from './validateMessage.module.less';
import { AiOutlineEdit } from 'react-icons/ai';
import { XValidation } from '@/ts/base/schema';
import { ValidationModal } from './ValidationModal';

interface IProps {
  service: WorkFormService;
  onErrorClick?: (error: ValidateErrorInfo) => void;
}

const FormValidateMessage: React.FC<IProps> = (props) => {
  const [validateVisible, setValidateVisible] = useState(false);
  const [validateErrors, setValidateErrors] = useState<ValidateErrorInfo[]>([]);

  const needFillValidation = useMemo(() => {
    return validateErrors.filter((e) => e.errorLevel != 'error').length > 0;
  }, [validateErrors]);

  const [validations, setValidation] = useState<XValidation[]>([]);
  const [fillVisible, setFillVisible] = useState(false);

  useEffect(() => {
    const dispose = props.service.onScoped('afterValidate', (args) => {
      setValidateErrors([...args]);
      if (args.length > 0) {
        setValidateVisible(true);
      } else {
        setValidateVisible(false);
      }
    });
    return () => {
      dispose();
    };
  }, []);

  function fillValidation() {
    const list = props.service.validate.validationInfo;
    setValidation(list);
    setFillVisible(true);
  }

  function renderPosition(error: ValidateErrorInfo) {
    let ret: ReactNode = error.position;

    let formId = (error as any).formId;
    let formName = formId ? (
      <Tag color="processing" style={{ marginLeft: '8px' }}>
        {props.service.formInfo[formId]?.form.name ?? formId}
      </Tag>
    ) : (
      <></>
    );

    if (isRequiredValidateError(error)) {
      return (
        <>
          <span>{error.field.name}</span>
          {formName}
        </>
      );
    } else if (isRuleValidateError(error)) {
      return (
        <>
          <span>规则：{error.rule.name}</span>
          {formName}
        </>
      );
    }
    return ret;
  }

  return (
    <ValidateMessagePanel
      validateErrors={validateErrors}
      visible={validateVisible}
      onVisibleChange={setValidateVisible}
      onErrorClick={props.onErrorClick}
      renderPosition={renderPosition}>
      <>
        {needFillValidation && (
          <div className={cls['edit-toolbar']}>
            <Button size="middle" onClick={fillValidation}>
              <AiOutlineEdit style={{ marginRight: '8px' }} /> 填写说明
            </Button>
          </div>
        )}
        {fillVisible && (
          <ValidationModal
            data={validations}
            onCancel={() => setFillVisible(false)}
            allowEdit
            onFinish={async (data) => {
              setValidation(data);
              props.service.validate.validationInfo = data;
              return true;
            }}
          />
        )}
      </>
    </ValidateMessagePanel>
  );
};

export default FormValidateMessage;

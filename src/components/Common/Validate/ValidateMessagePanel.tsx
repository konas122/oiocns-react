import { ValidateErrorInfo } from '@/ts/base/model';
import { CloseOutlined } from '@ant-design/icons/lib';
import { Alert, Button, Checkbox } from 'antd';
import React, { ReactNode, useMemo, useState } from 'react';
import cls from './validateMessage.module.less';

interface ValidateMessageProps {
  validateErrors: ValidateErrorInfo[];
  visible: boolean;
  onVisibleChange?: (v: boolean) => void;
  onErrorClick?: (error: ValidateErrorInfo) => void;
  closable?: boolean;
  width?: string;
  renderPosition?: (error: ValidateErrorInfo) => ReactNode;
  children?: ReactNode;
}

export const ValidateMessagePanel: React.FC<ValidateMessageProps> = (props) => {
  const [filterTypes, setFilterTypes] = useState(['error', 'warning', 'info']);

  const filterValidateErrors = useMemo(
    () => props.validateErrors.filter((item) => filterTypes.includes(item.errorLevel)),
    [props.validateErrors, filterTypes],
  );

  const wrapperStyle = { width: props.visible ? props.width || '360px' : 0 };

  function renderPosition(error: ValidateErrorInfo) {
    let content: ReactNode = error.position || '';
    if (props.renderPosition) {
      content = props.renderPosition(error);
    }
    return <span className={cls['position']}>{content}</span>;
  }

  return (
    <div className={cls['relative-placeholder']}>
      <div className={cls['handle-wrapper']}>
        {!props.visible && (
          <Button
            className={cls['open-handle']}
            type="primary"
            onClick={() => props.onVisibleChange?.(true)}>
            校验信息
          </Button>
        )}
      </div>
      <div
        className={[
          cls['validate-message-wrapper'],
          !props.visible ? cls['is-hidden'] : '',
        ].join(' ')}
        style={wrapperStyle}>
        <div className={cls['validate-message-header']}>
          <span>校验信息</span>
          <Checkbox.Group
            options={[
              { label: '错误', value: 'error' },
              { label: '警告', value: 'warning' },
              { label: '提醒', value: 'info' },
            ]}
            defaultValue={filterTypes}
            onChange={setFilterTypes as any}
          />
          {props.closable && (
            <CloseOutlined
              onClick={() => {
                props.onVisibleChange?.(false);
              }}
            />
          )}
        </div>
        <div className={cls['validate-message-body']}>
          {props.children}
          {filterValidateErrors.map((error) => (
            <Alert
              key={(error.position || '') + error.message}
              showIcon
              type={error.errorLevel}
              message={renderPosition(error)}
              description={<span className={cls['message']}>{error.message}</span>}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

ValidateMessagePanel.defaultProps = {
  closable: true,
};

import { Modal, message } from 'antd';
import React, { useState, useEffect, useRef } from 'react';

interface IProps {
  open: boolean;
  onOk: Function;
  onCancel?: () => void;
}

const Confirm: React.FC<IProps> = ({ open, onOk, onCancel }) => {
  const saveStatus = useRef<boolean>(false);

  useEffect(() => {
    saveStatus.current = false;
  }, []);
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <Modal
      width={300}
      open={open}
      onOk={async () => {
        if (saveStatus.current) {
          message.warn('请勿重复提交单据！稍后可重试');
          return false;
        }
        saveStatus.current = true;
        setTimeout(() => {
          saveStatus.current = false;
        }, 2000);
        setLoading(true);
        await onOk();
        setLoading(false);
      }}
      confirmLoading={loading}
      onCancel={() => {
        onCancel && onCancel();
      }}>
      <p>您确认进行当前操作吗？</p>
    </Modal>
  );
};

export default Confirm;

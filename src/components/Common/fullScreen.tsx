import React, { useState } from 'react';
import { Divider, Modal, ModalProps, Space, Typography, Button } from 'antd';
import { AiOutlineSave } from 'react-icons/ai';
import TypeIcon from '@/components/Common/GlobalComps/typeIcon';
import Confirm from '@/executor/open/reconfirm';

interface IFullModalProps extends ModalProps {
  hideMaxed?: boolean;
  fullScreen?: boolean;
  onSave?: () => void;
  onSaveModal?: () => void;
  modal?: boolean;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  slot?: React.ReactNode;
  bodyHeight?: number | string;
  isCusClsNames?: boolean;
}

const FullScreenModal: React.FC<IFullModalProps> = (props) => {
  const [open, setOpen] = useState(false);
  const [modalState, setModalState] = useState(!props.fullScreen);

  const loadModalProps = () => {
    if (modalState)
      return {
        ...props,
        bodyStyle: {
          height: props.bodyHeight,
          padding: 6,
          margin: 2,
          maxHeight: 'calc(100vh - 80px)',
          ...props.bodyStyle,
        },
      };
    return {
      ...props,
      width: '100vw',
      style: {
        top: 0,
        height: '100vh',
        maxWidth: '100vw',
        overflow: 'hidden',
        ...props.style,
      },
      bodyStyle: {
        padding: 6,
        margin: 2,
        height: 'calc(100vh - 58px)',
        maxHeight: React.isValidElement(props.footer)
          ? 'calc(100vh - 90px)'
          : 'calc(100vh - 58px)',
        ...props.bodyStyle,
      },
    };
  };

  const readerTitle = () => {
    return (
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
        <Space wrap split={<Divider type="vertical" />} size={2}>
          {props.icon}
          {props.title}
        </Space>
        <Space
          wrap
          split={<Divider type="vertical" />}
          size={2}
          style={{ lineHeight: '16px' }}>
          {props.slot}
          {props.onSave && !props.modal && (
            <Button
              size="small"
              type="primary"
              onClick={() => {
                setOpen(true);
              }}>
              <AiOutlineSave size={16} style={{ verticalAlign: 'middle' }} />
              <span
                style={{
                  fontSize: '12px',
                  marginLeft: '2px',
                  lineHeight: '24px',
                  verticalAlign: 'middle',
                }}>
                存储
              </span>
            </Button>
          )}
          {props.onSave && props.modal && (
            <Typography.Link
              title={'保存'}
              style={{ fontSize: 18 }}
              onClick={() => {
                props.onSaveModal?.apply(this, []);
              }}>
              <AiOutlineSave size={20} />
            </Typography.Link>
          )}
          {!props.hideMaxed && (
            <Typography.Link
              title={modalState ? '全屏' : '居中'}
              style={{ fontSize: 18 }}
              onClick={() => {
                setModalState(!modalState);
              }}>
              {modalState ? (
                <span style={{ cursor: 'pointer' }}>
                  <TypeIcon iconType={'centerScreen'} size={20} />
                </span>
              ) : (
                <span style={{ cursor: 'pointer' }}>
                  <TypeIcon iconType={'fullScreen'} size={20} />
                </span>
              )}
            </Typography.Link>
          )}
          <Typography.Link
            title={'关闭'}
            style={{ fontSize: 18 }}
            onClick={(e) => {
              props.onCancel?.apply(this, [e]);
            }}>
            <TypeIcon iconType={'close'} size={20} />
          </Typography.Link>
        </Space>
      </div>
    );
  };

  return (
    <>
      <Confirm
        open={open}
        onOk={() => {
          setOpen(false);
          props.onSave?.apply(this, []);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
      <Modal
        {...loadModalProps()}
        title={readerTitle()}
        closable={false}
        className={`${props.isCusClsNames ? 'custom-modalStyle' : ''}`}
        okButtonProps={{
          style: {
            display: 'none',
          },
        }}
        cancelButtonProps={{
          style: {
            display: 'none',
          },
        }}
      />
    </>
  );
};

export default FullScreenModal;

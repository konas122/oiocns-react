import { Modal, ModalFuncProps } from 'antd';

type ModalFuncPropsInit = Omit<ModalFuncProps, 'onOk' | 'onCancel'>;

export function $confirm(props: ModalFuncPropsInit) {
  return new Promise<void>((s, e) => {
    Modal.confirm({
      cancelText: '取消',
      okText: '确定',
      ...props,
      onOk: () => s(),
      onCancel: () => e('cancel'),
    });
  });
}

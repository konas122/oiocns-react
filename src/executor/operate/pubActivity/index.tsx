import React, { useState } from 'react';
import FullScreenModal from '@/components/Common/fullScreen';
import { Button, Form, Input } from 'antd';
import SelectMultFiles from '@/components/TargetActivity/SelectMultFiles';
import { IActivity, MessageType } from '@/ts/core';
import { model } from '@/ts/base';

const { TextArea } = Input;

const ActivityPublisher: React.FC<{
  activity: IActivity;
  finish: () => void;
}> = (props) => {
  const [resource, setResource] = useState<model.FileItemShare[]>([]);
  const [message, setMessage] = useState<string>('');
  const [linkInfo, setLinkInfo] = useState<string>('');
  const publishActivity = () => {
    if (message) {
      props.activity.send(message, MessageType.Text, resource, [], linkInfo);
      props.finish();
    }
  };

  return (
    <FullScreenModal
      open
      isCusClsNames
      {...props}
      width={'60vw'}
      bodyHeight={'60vh'}
      destroyOnClose
      title={'发布动态'}
      hideMaxed
      footer={
        <React.Fragment>
          <Button onClick={() => props.finish()}>取消</Button>
          <Button type="primary" onClick={publishActivity}>
            发布动态
          </Button>
        </React.Fragment>
      }
      onCancel={() => props.finish()}>
      <Form autoComplete="off" style={{ padding: '12px 14px' }}>
        <Form.Item style={{ marginBottom: '16px' }}>
          <TextArea
            style={{ backgroundColor: '#fff' }}
            placeholder="在此输入内容..."
            allowClear={true}
            bordered={false}
            autoSize={{ minRows: 9, maxRows: 9 }}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
          />
        </Form.Item>
        <Form.Item>
          <TextArea
            bordered={false}
            style={{ backgroundColor: '#fff' }}
            placeholder="请输入外部引用链接地址..."
            allowClear={true}
            autoSize={{ minRows: 1, maxRows: 1 }}
            onChange={(e) => {
              setLinkInfo(e.target.value);
            }}
          />
        </Form.Item>
        <Form.Item>
          <SelectMultFiles
            maxCount={9}
            types={['图片', '视频']}
            currentKey={props.activity?.session.target.directory.key}
            onChange={(fileList) => {
              setResource(fileList.map((item) => item.shareInfo()));
            }}></SelectMultFiles>
        </Form.Item>
      </Form>
    </FullScreenModal>
  );
};

export default ActivityPublisher;

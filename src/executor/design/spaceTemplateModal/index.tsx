import FullScreenModal from '@/components/Common/fullScreen';
import OpenFileDialog from '@/components/OpenFileDialog';
import { ISpaceTemplate } from '@/ts/core/thing/standard/page/spaceTemplate';
import { Card, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import cls from './index.module.less';

interface IProps {
  current: ISpaceTemplate;
  finished: () => void;
}

interface IRenderCard {
  current: ISpaceTemplate;
  keyword: 'form' | 'hot' | 'work';
  title: string;
  accepts: string[];
}

const RenderCard = (props: IRenderCard) => {
  const [center, setCenter] = useState(<></>);
  const [bind, setBind] = useState(props.current.metadata.params?.[props.keyword]);
  useEffect(() => {
    const id = props.current.subscribe(() => {
      setBind(props.current.metadata.params?.[props.keyword]);
    });
    return () => {
      props.current.unsubscribe(id);
    };
  }, []);
  return (
    <>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Card
          type="inner"
          title={
            <div>
              <span>{props.title}</span>
            </div>
          }
          bodyStyle={{ padding: '12px' }}
          extra={
            <a
              onClick={() => {
                setCenter(
                  <OpenFileDialog
                    title={`选择`}
                    accepts={props.accepts}
                    rightShow={false}
                    rootKey={props.current.directory.key}
                    showFile
                    onCancel={() => setCenter(<></>)}
                    onOk={async (files) => {
                      if (files.length > 0) {
                        const file = files[0].metadata as any;
                        await props.current.update({
                          ...props.current.metadata,
                          params: {
                            ...props.current.metadata.params,
                            [props.keyword]: {
                              id: file.id,
                              name: file.name,
                              directoryId: file.directoryId,
                              applicationId: file.applicationId ?? file.directoryId,
                              typeName: file.typeName,
                            },
                          },
                        });
                      }
                      setCenter(<></>);
                    }}
                  />,
                );
              }}>
              绑定
            </a>
          }>
          <div className={cls.row}>
            <Typography.Text
              style={{
                fontSize: 14,
                width: '200px',
                lineHeight: '24px',
                color: '#888',
              }}
              title={bind?.name}
              ellipsis>
              {bind?.name}
            </Typography.Text>
            <div className={cls.closeIconWrapper}>
              <AiOutlineCloseCircle
                onClick={() =>
                  props.current.update({
                    ...props.current.metadata,
                    params: {
                      ...props.current.metadata.params,
                      [props.keyword]: undefined,
                    },
                  })
                }
              />
            </div>
          </div>
        </Card>
      </Space>
      {center}
    </>
  );
};
const spaceTemplateModal: React.FC<IProps> = ({ current, finished }) => {
  return (
    <FullScreenModal
      open
      centered
      fullScreen={false}
      width={'80vw'}
      bodyHeight={'80vh'}
      destroyOnClose
      title={'空间模板配置'}
      onCancel={() => finished()}>
      <div className={cls.spacetemplateModal}>
        <div className={cls.config}>
          <RenderCard
            keyword={'form'}
            current={current}
            title={'常规场地'}
            accepts={['表单']}
          />
          <RenderCard
            keyword={'hot'}
            current={current}
            title={'推荐场地'}
            accepts={['表单']}
          />
          <RenderCard
            keyword={'work'}
            current={current}
            title={'预约办事'}
            accepts={['办事']}
          />
        </div>
      </div>
    </FullScreenModal>
  );
};

export default spaceTemplateModal;

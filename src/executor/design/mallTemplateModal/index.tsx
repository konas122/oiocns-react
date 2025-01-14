import FullScreenModal from '@/components/Common/fullScreen';
import OpenFileDialog from '@/components/OpenFileDialog';
import { schema } from '@/ts/base';
import { IMallTemplate } from '@/ts/core/thing/standard/page/mallTemplate';
import { Card, Input, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import cls from './index.module.less';

interface IProps {
  current: IMallTemplate;
  finished: () => void;
}

interface IRenderCard {
  current: IMallTemplate;
  keyword: 'form' | 'hot' | 'work' | 'text' | 'borrow';
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

  const renderList = (_bind: schema.Binding) => {
    return (
      <div className={cls.row} key={_bind.id}>
        <Typography.Text
          style={{
            fontSize: 14,
            width: '200px',
            lineHeight: '24px',
            color: '#888',
          }}
          title={_bind?.name as string}
          ellipsis>
          {_bind?.name}
        </Typography.Text>
        {!!_bind?.name && (
          <div className={cls.closeIconWrapper}>
            <AiOutlineCloseCircle
              onClick={() => {
                props.current.update({
                  ...props.current.metadata,
                  params: {
                    ...props.current.metadata.params,
                    [props.keyword]: Array.isArray(bind)
                      ? bind.filter((work) => work.id !== _bind.id)
                      : undefined,
                  },
                });
              }}
            />
          </div>
        )}
      </div>
    );
  };
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
                        const _data = {
                          id: file.id,
                          name: file.name,
                          directoryId: file.directoryId,
                          applicationId: file.applicationId ?? file.directoryId,
                          typeName: file.typeName,
                        };
                        if (props.keyword === 'work') {
                          let work = props.current.metadata.params?.[props.keyword];
                          if (work) {
                            if (!Array.isArray(work)) {
                              work = [work];
                            }
                          } else {
                            work = [];
                          }
                          await props.current.update({
                            ...props.current.metadata,
                            params: {
                              ...props.current.metadata.params,
                              [props.keyword]: [...work, _data],
                            },
                          });
                        } else {
                          await props.current.update({
                            ...props.current.metadata,
                            params: {
                              ...props.current.metadata.params,
                              [props.keyword]: _data,
                            },
                          });
                        }
                      }
                      setCenter(<></>);
                    }}
                  />,
                );
              }}>
              绑定
            </a>
          }>
          {bind ? (
            Array.isArray(bind) ? (
              bind.map((item) => {
                return renderList(item);
              })
            ) : (
              renderList(bind as schema.Binding)
            )
          ) : (
            <></>
          )}
        </Card>
      </Space>
      {center}
    </>
  );
};

const TemplateModal: React.FC<IProps> = ({ current, finished }) => {
  return (
    <FullScreenModal
      open
      centered
      fullScreen={false}
      width={'80vw'}
      bodyHeight={'80vh'}
      destroyOnClose
      title={'商城模板配置'}
      onCancel={() => finished()}>
      <div className={cls.templateModal}>
        <div className={cls.config}>
          <RenderCard
            keyword={'form'}
            current={current}
            title={'常规商品'}
            accepts={['表单']}
          />
          <RenderCard
            keyword={'hot'}
            current={current}
            title={'热度商品'}
            accepts={['表单']}
          />
          <RenderCard
            keyword={'work'}
            current={current}
            title={'领用办事'}
            accepts={['办事']}
          />
          <RenderCard
            keyword={'borrow'}
            current={current}
            title={'借用办事'}
            accepts={['办事']}
          />
        </div>
      </div>
    </FullScreenModal>
  );
};

export default TemplateModal;

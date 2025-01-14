import { Button, Carousel, Empty, message } from 'antd';
import React, {
  useRef,
  useState,
  useEffect,
  ReactNode,
  useImperativeHandle,
} from 'react';
import FullScreenModal from '../Common/fullScreen';
import LoadingView from '../Common/Loading';

interface Iprops {
  title: string;
  des?: ReactNode;
  refNode?: React.Ref<any>;
  leftBtn?: string;
  imgList?: any[];
  onDesignService?: () => void;
  bodyHeight?: string;
  image?: string;
  footer?: boolean;
  btnDisabled?: boolean; //办事 是否有设计权限
  loading?: boolean;
}

const GuideLink = (props: Iprops) => {
  const {
    imgList,
    title,
    des,
    refNode,
    onDesignService,
    leftBtn,
    bodyHeight,
    image,
    footer = true,
    btnDisabled = false,
    loading = false,
  } = props;

  const carouselRef = useRef<any>();
  const [open, setOpen] = useState(false);
  const [flowSize, setFlowSize] = useState(0);
  useImperativeHandle(
    refNode,
    () => ({
      setOpen,
    }),
    [refNode],
  );

  useEffect(() => {
    if (btnDisabled) {
      message.warn('没有设计办事权限！请联系单位管理员。');
    }
  }, [btnDisabled]);

  // 引导
  const onGuide = () => {
    setOpen(true);
  };

  const onLeft = () => {
    carouselRef?.current?.prev();
  };
  const onRight = () => {
    if (flowSize === 3) {
      setOpen(false);
      return;
    }
    carouselRef?.current?.next();
  };

  // 根据加载状态决定显示内容
  if (loading) {
    return (
      <div className="loading-page">
        <LoadingView text="努力加载中..." />
      </div>
    );
  }

  return (
    <Empty
      image={image ?? undefined}
      imageStyle={{ height: 200 }}
      description={
        <>
          <p>{title}</p>
          <p>{des}</p>
          {footer && (
            <>
              <Button type="primary" disabled={btnDisabled} onClick={onDesignService}>
                {leftBtn}
              </Button>
              <Button onClick={onGuide} style={{ marginLeft: 12 }}>
                操作示意
              </Button>
            </>
          )}
          <FullScreenModal
            open={open}
            hideMaxed
            title="操作示意"
            onCancel={() => {
              setOpen(false);
            }}
            width={'840px'}
            footer={
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0 20px',
                }}>
                <Button
                  onClick={() => {
                    setOpen(false);
                  }}>
                  关闭
                </Button>
                <div>
                  <Button disabled={!flowSize} onClick={onLeft}>
                    上一步
                  </Button>
                  <Button type="primary" onClick={onRight}>
                    {flowSize < 3 ? `下一步 ${flowSize + 1}/4` : `完成 4/4`}
                  </Button>
                </div>
              </div>
            }
            bodyHeight={bodyHeight || '51vh'}>
            <div>
              <Carousel
                afterChange={(current) => {
                  setFlowSize(current);
                }}
                infinite={false}
                ref={carouselRef}
                easing={'linear'}>
                {imgList?.map((item) => {
                  return (
                    <div key={item}>
                      <img
                        style={{
                          width: '100%',
                        }}
                        src={item}
                      />
                    </div>
                  );
                })}
              </Carousel>
            </div>
          </FullScreenModal>
        </>
      }
    />
  );
};

export default GuideLink;

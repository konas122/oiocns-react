import React, { useRef } from 'react';
import GuideLink from '@/components/GuideLink';
import { useHistory } from 'react-router-dom';
import createWorkOne from '/img/orginone/work/createWork_one.png';
import createWorktwo from '/img/orginone/work/createWork_two.png';
import createWorkThree from '/img/orginone/work/createWork_three.png';
import createWorkFour from '/img/orginone/work/createWork_four.png';
import inCommonUse from '/img/orginone/work/inCommonUse.jpg';
import defaultEmptyImg from '/img/empty/defaultEmpty.png';
import todoEmmotyImg from '/img/empty/todoEmpty.png';
import TodoEmpty from './todoEmpty';

function Guidance(props: { type: string; loading?: boolean }) {
  const { type, loading = true } = props;
  const history = useHistory();
  let imgList: Array<string> = [];
  const RefNode = useRef<React.Ref<any>>();
  const renderNode = () => {
    switch (type) {
      case '待办':
        imgList = [createWorkOne, createWorktwo, createWorkThree, createWorkFour];
        return (
          <GuideLink
            title=""
            des={<TodoEmpty refNode={RefNode} />}
            onDesignService={() => {}}
            refNode={RefNode}
            footer={false}
            image={todoEmmotyImg}
            imgList={imgList}
            loading={loading}
            bodyHeight={'60vh'}
          />
        );
      case '已办':
      case '抄送':
      case '已发起':
      case '草稿':
        imgList = [createWorkOne, createWorktwo, createWorkThree, createWorkFour];
        return (
          <GuideLink
            title="新建应用"
            des={
              <span>
                在数据栏目下，右键新建应用
                <br />
                然后新建办事并设计流程。
              </span>
            }
            onDesignService={() => history.push('store')}
            image={defaultEmptyImg}
            leftBtn="前往数据"
            imgList={imgList}
            bodyHeight={'60vh'}
          />
        );
      case '常用':
        return (
          <GuideLink
            title="如何添加常用?"
            des={'右键菜单-设置为常用应用'}
            imgList={imgList}
            bodyHeight={'60vh'}
            image={inCommonUse}
            footer={false}
          />
        );
      case '任务':
        return (
          <GuideLink
            title={`暂无${type}`}
            des={''}
            imgList={imgList}
            bodyHeight={'60vh'}
            image={defaultEmptyImg}
            footer={false}
          />
        );
      default:
        break;
    }
  };

  return (
    <div
      className="oiocns-empty-compent"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}>
      {renderNode()}
    </div>
  );
}

export default Guidance;

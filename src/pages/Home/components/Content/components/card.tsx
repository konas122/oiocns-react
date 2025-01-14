import { command } from '@/ts/base';
import { IBelong, IFile } from '@/ts/core';
import { Dropdown, Spin, message } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { cleanMenus } from '@/utils/tools';
import { loadFileMenus, operatesToMenus } from '@/executor/fileOperate';
import OpenFileDialog from '@/components/OpenFileDialog';
import { loadSettingMenu } from '@/components/OpenFileDialog/config';
import orgCtrl from '@/ts/controller';
import { ImBooks } from 'react-icons/im';
import { useHistory } from 'react-router-dom';
import { orgAuth } from '@/ts/core/public';
import { homeOperates } from '@/ts/core/public/operates';
interface IProps {
  space: IBelong;
}

interface IContent {
  groupName: string;
  content: IFile[];
}

const ContentCard: React.FC<IProps> = ({ space }) => {
  // 发送快捷命令
  const history = useHistory();
  const [loaded, setLoaded] = useState(false);
  const [content, setContent] = useState<IContent[]>([]);

  useEffect(() => {
    const id = command.subscribeByFlag(orgCtrl.home.commentsFlag(space), async () => {
      setLoaded(false);
      // 给空间下的数据加载1s后再加载常用，降低常用加载不全情况
      setTimeout(async () => {
        await loadComments();
        setLoaded(true);
      }, 1000);
    });
    return () => {
      command.unsubscribeByFlag(id);
    };
  }, [space]);

  const loadComments = async () => {
    const newContent: IContent[] = [];
    const comments = await orgCtrl.home.loadCommons(space);
    comments.forEach((item) => {
      var index = newContent.findIndex((i) => i.groupName === item.typeName);
      if (index > -1) {
        newContent[index].content.push(item);
      } else {
        newContent.push({
          groupName: item.typeName,
          content: [item],
        });
      }
    });
    setContent(newContent);
  };

  return (
    <div style={{ flexWrap: 'wrap' }} className="cardGroup">
      <div className="cardItem" style={{ minHeight: 80 }}>
        <div className="cardItem-header">
          <span className="title">常用</span>
          <span className="extraBtn" onClick={() => history.push('store')}>
            <ImBooks size={15} /> <span>去设常用</span>
          </span>
        </div>
        <div style={{ width: '100%', minHeight: 60 }} className="cardItem-viewer">
          <Spin spinning={!loaded} tip={'加载中...'}>
            {content.map((item) => {
              return (
                <LoadGroupCard
                  key={item.groupName}
                  groupName={item.groupName}
                  content={item.content}
                />
              );
            })}
          </Spin>
        </div>
      </div>
    </div>
  );
};
const homeTops = ['商城模板', '页面模板', '应用', '视图', '目录'];
const LoadGroupCard = (props: { groupName: string; content: IFile[] }) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [showNum, setShowNum] = useState<number>(14);
  const containerRef = useRef(null);
  const [isShow, setIsShow] = useState<string>();
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        const num = Math.floor(width / 190);
        setShowNum(num * 2);
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [props.content]);

  const addExtraMenus = (file: IFile) => {
    if (!homeTops.includes(file.typeName)) return;
    const operates = [];
    const isCompany = orgCtrl.home.current.typeName === '单位';
    if (isCompany) {
      if (orgCtrl.home.current.hasAuthoritys([orgAuth.SuperAuthId])) {
        if (orgCtrl.home.homeConfig.tops?.includes(file.id)) {
          operates.push(homeOperates.DelPageTab);
        } else {
          operates.push(homeOperates.SetPageTab);
        }
      }
    } else {
      if (orgCtrl.home.homeConfig.tops?.includes(file.id)) {
        operates.push(homeOperates.DelPageTab);
      } else {
        operates.push(homeOperates.SetPageTab);
      }
    }
    return operatesToMenus(operates, file);
  };

  const contextMenu = (file: IFile) => {
    let menus = loadFileMenus(file);
    const extraMenus = addExtraMenus(file);
    if (extraMenus) {
      menus = menus?.concat(extraMenus);
    }
    return {
      items: cleanMenus(menus) || [],
      onClick: ({ key }: { key: string }) => {
        command.emitter('executor', key, file);
      },
    };
  };

  const getTopIcon = (file: IFile) => {
    if (!homeTops.includes(file.typeName)) return;
    let img = '';
    const isCompany = orgCtrl.home.current.typeName === '单位';
    if (isCompany) {
      if (orgCtrl.home.current.hasAuthoritys([orgAuth.SuperAuthId])) {
        if (orgCtrl.home.homeConfig.tops?.includes(file.id)) {
          img = '/svg/home/fixed.svg';
        } else {
          img = '/svg/home/noFixed.svg';
        }
      }
    } else {
      if (orgCtrl.home.homeConfig.tops?.includes(file.id)) {
        img = '/svg/home/fixed.svg';
      } else {
        img = '/svg/home/noFixed.svg';
      }
    }
    if (!img) return <></>;
    return (
      <div
        style={{ position: 'absolute', right: '10px', top: '5px' }}
        onClick={async (e) => {
          e.stopPropagation();
          await orgCtrl.home.switchTops(file.id);
        }}>
        <img src={img} style={{ width: '18px' }} />
      </div>
    );
  };
  const isDisplay = useCallback(
    (id: string): boolean => {
      const isCompany = orgCtrl.home.current.typeName === '单位';
      if (isCompany) {
        if (!orgCtrl.home.current.hasAuthoritys([orgAuth.SuperAuthId])) {
          return isShow === id;
        }
      }
      return isShow === id || orgCtrl.home.homeConfig.tops?.includes(id);
    },
    [isShow, orgCtrl.home.homeConfig.tops],
  );
  const loadCommonCard = (item: IFile) => {
    const style = isDisplay(item.id)
      ? { borderRadius: '10px', background: '#f7f8fa' }
      : {};
    return (
      <Dropdown key={item.key} menu={contextMenu(item)} trigger={['contextMenu']}>
        <div
          className="appCard"
          onMouseOver={() => setIsShow(item.id)}
          onMouseOut={() => setIsShow(undefined)}
          style={{ position: 'relative', ...style }}
          onClick={() => {
            command.emitter('executor', 'open', item);
          }}>
          <EntityIcon entity={item.metadata} size={35} />
          {isDisplay(item.id) && getTopIcon(item)}
          <div className="appName">{item.name}</div>
          <div className="teamName">{item.directory.target.name}</div>
        </div>
      </Dropdown>
    );
  };

  return (
    <div style={{ minHeight: 80 }} className="cardItem" ref={containerRef}>
      <span className="cardItem-header" style={{ display: 'block', height: '20px' }}>
        <span className="title">{props.groupName}</span>
        {props.content.length > showNum && (
          <span
            className="extraBtn"
            style={{ paddingTop: '2px', paddingRight: '20px' }}
            onClick={() => setExpanded(!expanded)}>
            {expanded ? '收起' : '展开'}
          </span>
        )}
      </span>
      {props.content.length === 0 && <div style={{ textAlign: 'center' }}>暂无数据</div>}
      {props.content.length > 0 && (
        <div className="cardItem-viewer">
          <div className="cardGroup" style={{ flexWrap: 'wrap' }}>
            {expanded
              ? props.content.map((item) => loadCommonCard(item))
              : props.content.slice(0, showNum).map((item) => loadCommonCard(item))}
          </div>
        </div>
      )}
      {editMode && (
        <OpenFileDialog
          title={`选择`}
          rightShow={false}
          accepts={[props.groupName]}
          showFile
          rootKey={''}
          excludeIds={props.content.map((item) => item.id)}
          onLoadMenu={() => loadSettingMenu('', false, ['单位', '目录', '应用'])}
          onCancel={() => {
            setEditMode(false);
          }}
          onOk={(files) => {
            if (files.length > 0) {
              files[0].toggleCommon().then((success: boolean) => {
                if (success) {
                  message.info('设置成功');
                  setEditMode(false);
                }
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default ContentCard;

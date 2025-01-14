import React, { useEffect, useState } from 'react';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import FullScreenModal from '@/components/Common/fullScreen';
import DirectoryViewer from '@/components/Directory/views';
import cls from './index.module.less';
import { RightOutlined } from '@ant-design/icons';
import { ICompany, IFile } from '@/ts/core';

interface IProps {
  content: any[]; //数据源
  selectFiles: IFile[]; //选中的文件
  typeName: string; //类型名称
  searchText: string; //要查询的关键字
  selectType: number; //1单选
  onChange: Function; //回调
}

// 工作台
const SwitchSpace: React.FC<IProps> = (props) => {
  const [configOpen, setConfigOpen] = useState(false);
  const [content, setContent] = useState<any[]>([]);
  const [selectFiles, setSelectFiles] = useState<any[]>([]);
  const [currentTag, setCurrentTag] = useState('全部');
  const [workBench, setWorkBench] = useState<any[]>([]);
  const [customTags, setCustomTags] = useState<{ tag: string; count: number }[]>([]);

  useEffect(() => {
    setContent(props.content);
    getTags();
  }, [props.content]);

  useEffect(() => {
    if (!props.selectFiles) {
      return;
    }
    // if (!props.selectFiles.length) {
    //   return;
    // }
    setSelectFiles(props.selectFiles.filter((i) => i != undefined));

    let data: any[] = [];
    props.selectFiles.forEach((element) => {
      if (element) {
        data.push(element.metadata);
      }
    });
    setWorkBench(data);
    if (props.typeName == '动态') {
      getContent();
    }
  }, [props.selectFiles]);

  const getTags = () => {
    var tags: { tag: string; count: number }[] = [];
    props.content
      .filter((it) => it.name !== '全部')
      .forEach((entity) => {
        const index = tags.findIndex((i) => i.tag === entity.typeName);
        if (index > -1) {
          tags[index].count += 1;
        } else {
          tags.push({ tag: entity.typeName, count: 1 });
        }
      });
    setCustomTags(tags);
  };
  const getContent = () => {
    const result = props.content.filter((it) => it.name !== '全部');
    if (currentTag === '全部') {
      return result;
    }
    if (currentTag == '已选中') {
      return result.filter((item) =>
        selectFiles.map((it) => it.name).includes(item.name),
      );
    } else {
      return result.filter((it) => it.typeName === currentTag);
    }
  };
  const contextMenu = (_app: any | undefined) => {
    return {};
  };
  const FileOpen = (app: any) => {
    let data: any = [];
    let selectData: ICompany[] = [];
    if (props.selectType === 1) {
      data = [app.metadata];
      selectData = [app];
    } else {
      let index = workBench.findIndex((element: any) => element.id == app._metadata.id);
      if (index === -1) {
        data = [...workBench, app._metadata];
        selectData = [...selectFiles, app];
      } else {
        if (workBench.length > 1) {
          data = [...workBench.filter((a) => a.id != app.id)];
          selectData = [...selectFiles.filter((a) => a.id != app.id)];
        }
      }
    }
    setWorkBench(data);
    setSelectFiles(selectData);
    props.onChange(selectData);
    setConfigOpen(false);
  };

  const defaultAllTxt = () => {
    return (
      <div className={cls['selectspan']}>
        <img src="/img/home/all.png" style={{ width: '30px', height: '30px' }} alt="" />
        <div style={{ color: '#15181D', fontSize: 20 }}>全部</div>
      </div>
    );
  };

  const showCheck = () => {
    switch (workBench.length) {
      case 0:
        return props.typeName == '动态' ? (
          defaultAllTxt()
        ) : (
          <div className={cls['selectspan']}>请选择</div>
        );
      case 1:
        return (
          <div className={cls['selectspan']}>
            <EntityIcon entityId={workBench[0].belongId} size={30} />
            <div style={{ fontSize: 20, color: '#15181D' }}>{workBench[0].name}</div>
          </div>
        );
      case content.length - 1:
        return defaultAllTxt();
      default:
        return (
          <>
            <div style={{ lineHeight: '38px' }}>
              <img
                src="/img/home/all.png"
                style={{ width: '30px', height: '30px' }}
                alt=""
              />
              {/* <div>{workBench.length > 15 && <span className={cls['select-more']}>...</span>}</div> */}
            </div>
            <div style={{ color: '#15181D', fontSize: 20, lineHeight: '38px' }}>
              <span className="iconfont icon-arrow-down" />
              选中{workBench.length}个
            </div>
          </>
        );
    }
  };

  return (
    <div>
      <div className="cardGroup">
        <div className={cls['select-space']} style={{}}>
          {showCheck()}
          <div
            style={{ cursor: 'default', color: 'rgba(54, 110, 244, 1)' }}
            onClick={() => {
              setConfigOpen(true);
            }}>
            切换空间
          </div>
          <RightOutlined
            onClick={() => {
              setConfigOpen(true);
            }}
          />
        </div>
      </div>
      <FullScreenModal
        open={configOpen}
        title={'全部空间'}
        width={'80vw'}
        bodyHeight={'70vh'}
        onCancel={() => setConfigOpen(false)}>
        <DirectoryViewer
          extraTags={false}
          initTags={['全部']}
          selectFiles={selectFiles}
          content={props.typeName == '动态' ? getContent() : content}
          excludeTags={['已删除']}
          currentTag={currentTag}
          isDynamic
          customTags={customTags}
          tagChanged={(t) => setCurrentTag(t)}
          fileOpen={(entity) => FileOpen(entity as any)}
          contextMenu={(entity) => contextMenu(entity as any)}
        />
      </FullScreenModal>
    </div>
  );
};

export default SwitchSpace;

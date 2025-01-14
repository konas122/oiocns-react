import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import IconMode from './iconMode';
import ListMode from './listMode';
import useStorage from '@/hooks/useStorage';
import SegmentContent from '@/components/Common/SegmentContent';
import { IContainer, IDEntity } from '@/ts/core';
import { MenuProps } from 'antd';
import TagsBar from '../tagsBar';
import SearchBar from '../searchBar';

interface IProps {
  elemId?: string;
  content: IDEntity[];
  accepts?: string[];
  selectFiles: IDEntity[];
  excludeIds?: string[];
  initTags: string[];
  extraTags: boolean;
  excludeTags?: string[];
  preDirectory?: IDEntity;
  focusFile?: IDEntity;
  rightBars?: ReactNode;
  height?: number | string;
  currentTag: string;
  directory?: IContainer;
  isMenu?: boolean;
  isNav?: boolean;
  isDynamic?: boolean;
  customTags?: { tag: string; count: number }[];
  badgeCount?: (tag: string) => number;
  tagChanged?: (tag: string) => void;
  fileOpen: (file: IDEntity | undefined, dblclick: boolean) => void;
  contextMenu: (file?: IDEntity) => MenuProps;
  onScrollEnd?: () => void;
  onFilter?: (filter: string) => void;
  onFocusFile?: (file: IDEntity | undefined) => void;
  onViewChanged?: (files: IDEntity[]) => void;
}
/**
 * 存储-文件系统
 */
const DirectoryView: React.FC<IProps> = (props) => {
  const [filterText, setFilter] = useState<string>('');
  const [segmented, setSegmented] = useStorage('segmented', 'list');
  useEffect(() => {
    const content = getContent();
    if (props.onViewChanged) {
      props.onViewChanged(content);
    }
    if (props.onFocusFile) {
      if (content.length > 0) {
        if (content.every((i) => i.id != props.focusFile?.id)) {
          return props.onFocusFile(content[0]);
        }
        return;
      }
      if (props.focusFile != undefined) {
        props.onFocusFile(undefined);
      }
    }
  }, [props.content, props.currentTag, filterText]);

  const getContent = useCallback(
    (filter: boolean = true) => {
      const filters = filterText.split('$$').filter((item) => item && item.length > 1);
      const filterExp = (file: IDEntity) => {
        return (
          filters.length < 1 ||
          filters.some(
            (item) =>
              file.code?.includes(item) ||
              file.name.includes(item) ||
              file.remark.includes(item) ||
              file.typeName.includes(item) ||
              file.filterTags.filter((i) => i.includes(item)).length > 0 ||
              file.groupTags.filter((i) => i.includes(item)).length > 0,
          )
        );
      };
      if (props.extraTags) {
        if (filter && props.currentTag == '已选中') {
          return props.selectFiles.filter(filterExp);
        }
        const tagFilter = (file: IDEntity) => {
          let success = true;
          if (props.excludeIds && props.excludeIds.length > 0) {
            success = !props.excludeIds.includes(file.id);
          }
          if (filter && success) {
            if (props.currentTag !== '全部' && props.currentTag != '最近') {
              success = file.filterTags.includes(props.currentTag);
            } else {
              success = !file.filterTags.includes('已删除');
            }
          }
          if (success && props.accepts && props.accepts.length > 0) {
            success = file.filterTags.some((i) => props.accepts!.includes(i));
          }
          return success;
        };
        return props.content.filter(filterExp).filter(tagFilter);
      }
      return props.content.filter(filterExp);
    },
    [props.content, props.currentTag, filterText],
  );

  const renderMode = () => {
    return segmented === 'icon' ? (
      <IconMode
        selectFiles={props.selectFiles}
        focusFile={props.focusFile}
        content={getContent()}
        fileOpen={props.fileOpen}
        contextMenu={props.contextMenu}
      />
    ) : (
      <ListMode
        selectFiles={props.selectFiles}
        focusFile={props.focusFile}
        isMenu={props.isMenu}
        isNav={props.isNav}
        isDynamic={props.isDynamic}
        content={getContent()}
        directory={props.directory}
        fileOpen={props.fileOpen}
        contextMenu={props.contextMenu}
      />
    );
  };

  return (
    <>
      <SearchBar
        value={filterText}
        rightBars={props.rightBars}
        onValueChanged={(value) => {
          setFilter(value);
          props.onFilter?.apply(this, [value]);
        }}
        menus={props.contextMenu()}
      />
      <TagsBar
        select={props.currentTag}
        showBack={props.preDirectory != undefined}
        extraTags={props.extraTags}
        isDynamic={props.isDynamic}
        customTags={props.customTags}
        excludeTags={props.excludeTags || []}
        initTags={props.initTags}
        selectFiles={props.selectFiles}
        entitys={getContent(false)}
        badgeCount={props.badgeCount}
        onBack={() => props.fileOpen(props.preDirectory, true)}
        onChanged={(t) => props.tagChanged && props.tagChanged(t)}></TagsBar>
      <SegmentContent
        height={props.height}
        onScrollEnd={props.onScrollEnd}
        onSegmentChanged={setSegmented}
        descriptions={`${getContent().length}个项目`}
        currentTag={props.currentTag}>
        {renderMode()}
      </SegmentContent>
    </>
  );
};
export default DirectoryView;

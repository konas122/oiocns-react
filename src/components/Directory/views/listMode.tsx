import React, { useRef, useState } from 'react';
import { IContainer, IDEntity } from '@/ts/core';
import { Badge, Dropdown, List, MenuProps, Tag, Tooltip } from 'antd';
import { showChatTime } from '@/utils/tools';
import css from './less/list.module.less';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { XFileLink } from '@/ts/base/schema';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import { IReception } from '@/ts/core/work/assign/reception';
import { command } from '@/ts/base';
import { statusMap } from '@/ts/core/work/assign/reception/status';

const ListMode = ({
  focusFile,
  content,
  fileOpen,
  contextMenu,
  selectFiles,
  directory,
  isMenu,
  isNav,
  isDynamic,
}: {
  content: IDEntity[];
  selectFiles: IDEntity[];
  focusFile: IDEntity | undefined;
  fileOpen: (file: IDEntity | undefined, dblclick: boolean) => void;
  contextMenu: (file?: IDEntity) => MenuProps;
  directory?: IContainer;
  isMenu?: boolean;
  isNav?: boolean;
  isDynamic?: boolean;
  currentTag?: string;
}) => {
  const droppable = useRef(directory && directory.id != directory.target.id);
  const [cxtItem, setCxtItem] = useState<IDEntity>();
  const getItemClassName = (item: IDEntity) => {
    if (focusFile?.key === item.key || selectFiles.some((i) => i.key === item.key)) {
      return css.list_item_select;
    }
    return isMenu ? css.vlist_item : `${css.vlist_item} ${css.border_bottom}`;
  };

  const reorder = (list: IDEntity[], startIndex: number, endIndex: number) => {
    const result = Array.from(list);
    const removedItem = result.splice(startIndex, 1)[0];
    result.splice(endIndex, 0, removedItem);
    return result;
  };
  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const ordered = reorder(content, result.source.index, result.destination.index).map(
      (element, index) => {
        return { sort: index, id: element.id };
      },
    );
    await directory?.updateSorts(ordered);
    command.emitter('container', 'sort');
  };

  function renderSpecialTags(e: IDEntity) {
    if (e.isShortcut) {
      return <Tag color="success">快捷方式</Tag>;
    } else if ((e.metadata as unknown as XFileLink)?.isLinkFile) {
      return <Tag color="success">引用文件</Tag>;
    } else if (e.typeName == '接收任务') {
      const reception = e as IReception;
      return reception.status != 'empty' ? (
        <Tag color={statusMap[reception.status].color}>
          {statusMap[reception.status].label}
        </Tag>
      ) : (
        <></>
      );
    }
    return <></>;
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <DragDropContext onDragEnd={onDragEnd}>
        {/* 可放置的容器 */}
        <Droppable isDropDisabled={!droppable.current} droppableId="droppable">
          {(provided: any) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{ width: '100%', height: '100%' }}>
              <Dropdown
                menu={contextMenu(cxtItem)}
                trigger={['contextMenu']}
                destroyPopupOnHide>
                <div
                  onContextMenu={(e) => e.stopPropagation()}
                  style={{ width: '100%', height: '100%' }}>
                  <List itemLayout="horizontal" dataSource={content}>
                    {content.map((item, index) => (
                      <Draggable
                        isDragDisabled={!droppable.current}
                        key={item.key}
                        draggableId={item.id}
                        index={index}>
                        {(provided: any) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}>
                            <div className={getItemClassName(item)}>
                              <List.Item
                                onClick={() => {
                                  fileOpen(item, false);
                                }}
                                onDoubleClick={() => {
                                  fileOpen(item, true);
                                }}
                                onContextMenu={() => setCxtItem(item)}
                                actions={[
                                  <div
                                    key={item.id}
                                    title={item.updateTime}
                                    style={{ fontSize: '12px' }}>
                                    {showChatTime(item.updateTime)}
                                  </div>,
                                ]}>
                                <List.Item.Meta
                                  title={
                                    <>
                                      <div className={css.item_title}>{item.name}</div>
                                      {renderSpecialTags(item)}
                                      {!isDynamic &&
                                        item.groupTags
                                          .filter((i) => i.length > 0)
                                          .map((label) => {
                                            return (
                                              <Tag key={label} color="processing">
                                                {label}
                                              </Tag>
                                            );
                                          })}
                                      {isNav ? (
                                        <>
                                          <Tag color="processing">
                                            {
                                              (item as IPageTemplate).directory.target
                                                .name
                                            }
                                          </Tag>
                                          <Tag color="processing">
                                            {
                                              (item as IPageTemplate).directory.target
                                                .space.name
                                            }
                                          </Tag>
                                        </>
                                      ) : isDynamic ? (
                                        <>
                                          <Tag color="processing">{item.typeName}</Tag>
                                        </>
                                      ) : (
                                        <></>
                                      )}
                                      {'score' in item && (
                                        <span className={css.score}>
                                          {item.score as number}
                                        </span>
                                      )}
                                    </>
                                  }
                                  avatar={
                                    <Badge count={item.badgeCount} size="small">
                                      <EntityIcon entity={item.metadata} size={40} />
                                    </Badge>
                                  }
                                  description={
                                    // TODO 后期需要优化
                                    <div
                                      style={{ lineHeight: '16px' }}
                                      title={item.remark}>
                                      <div className="ellipsis1">
                                        {item.remark || item.code}
                                      </div>
                                    </div>
                                  }
                                />
                              </List.Item>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </List>
                  <div
                    style={{ height: `calc(100% - ${content.length * 78}px)` }}
                    className={css.blank_area}
                    onContextMenu={() => setCxtItem(undefined)}></div>
                </div>
              </Dropdown>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};
export default ListMode;

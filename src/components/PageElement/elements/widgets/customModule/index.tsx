import React, { useState, useEffect } from 'react';
import { Spin, Dropdown, Badge } from 'antd';
import { IFile } from '@/ts/core';
import { command } from '@/ts/base';
import { cleanMenus } from '@/utils/tools';
import { loadFileMenus } from '@/executor/fileOperate';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { ExistTypeMeta } from '@/ts/element/ElementMeta';
import { SEntity } from '@/ts/element/standard';
import { Context } from '../../../render/PageContext';
import { defineElement } from '../../defineElement';
import { Form } from '@/ts/core/thing/standard/form';

interface IProps {
  height: number;
  templateName?: string;
  props: any;
  ctx: Context;
  form: {
    id: string;
    value: string;
  }[];
  work: {
    id: string;
    value: string;
  }[];
}

const View: React.FC<IProps> = (props) => {
  const [selectData, setSelectData] = useState<any[]>([]);
  const [selectForms, setSelectForms] = useState<any[]>([]);
  const [selectWorks, setSelectWorks] = useState<any[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);

  /** 加载数据 */
  const loadData = async () => {
    setLoaded(true);
    await loadForms();
    await loadWorks();
  };
  async function loadForms() {
    const formList: any[] = props.form?.map(async (item) => {
      return await props.ctx?.view?.pageInfo?.directory?.target?.resource?.formColl?.find(
        [item.id],
      );
    });
    try {
      const formValues = await (await Promise.all(formList)).flat().filter(Boolean);

      const allForms = formValues.map((itez) => {
        return new Form(
          { ...itez, id: itez.id + '_' },
          props.ctx?.view?.pageInfo?.directory,
        );
      });
      setSelectForms(allForms);
    } catch (error) {
      setLoaded(false);
    }
  }

  async function loadWorks() {
    const workList: any[] = props.work?.map(async (ita) => {
      return await props.ctx?.view?.pageInfo.loadWork(ita.id);
    });
    try {
      const workValues = await (await Promise.all(workList)).filter(Boolean);
      setSelectWorks(workValues);
      setLoaded(false);
    } catch (error) {
      setLoaded(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [props.form, props.work]);

  useEffect(() => {
    setSelectData([...selectForms, ...selectWorks]);
  }, [selectForms, selectWorks]);

  const contextMenu = (file: IFile) => {
    return {
      items: cleanMenus(loadFileMenus(file)) || [],
      onClick: ({ key }: { key: string }) => {
        command.emitter('executor', key, file);
      },
    };
  };

  // 渲染模版页面
  const renderTempalte = (item: IFile) => {
    return (
      <Dropdown key={item.key} menu={contextMenu(item)} trigger={['contextMenu']}>
        <div
          className="appCard"
          onClick={() => {
            command.emitter('executor', 'open', item);
          }}>
          {item.cache.tags?.includes('常用') ? (
            <Badge dot>
              <EntityIcon entity={item.metadata} size={35} />
            </Badge>
          ) : (
            <EntityIcon entity={item.metadata} size={35} />
          )}
          <div className="appName">{item.name}</div>
          <div className="teamName">{item.directory.target.name}</div>
          <div className="teamName">{item.directory.target.space.name}</div>
        </div>
      </Dropdown>
    );
  };

  return (
    <div className="workbench-wrap">
      <div className="cardItem">
        <div className="cardItem-header">
          <span className="title">{props.templateName || ''}</span>
        </div>
        <Spin spinning={loaded} tip={'加载中...'}>
          <div className="cardItem-viewer">
            <div className="cardGroup" style={{ flexWrap: 'wrap' }}>
              {selectData.map((app) => {
                return renderTempalte(app);
              })}
            </div>
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default defineElement({
  render(props, ctx) {
    return <View {...(props as any)} ctx={ctx} />;
  },
  displayName: 'CustomModule',
  meta: {
    props: {
      height: {
        type: 'number',
        default: 200,
      },
      templateName: {
        type: 'string',
        label: '模板名称',
        default: '模块设计',
      },
      form: {
        type: 'type',
        label: '关联表单',
        typeName: 'formFile',
        multiple: true,
      } as ExistTypeMeta<SEntity | undefined>,
      work: {
        type: 'type',
        label: '关联办事',
        typeName: 'workFile',
        multiple: true,
      } as ExistTypeMeta<SEntity | undefined>,
    },
    label: '自定义拖拽',
    type: 'Element',
  },
});

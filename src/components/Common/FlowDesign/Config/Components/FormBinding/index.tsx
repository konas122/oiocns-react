import React, { useEffect, useState } from 'react';
import { Card, Divider } from 'antd';
import cls from './index.module.less';
import { WorkNodeDisplayModel } from '@/utils/work';
import { FormInfo } from '@/ts/base/model';
import { command, schema } from '@/ts/base';
import { IForm, Form as SForm } from '@/ts/core/thing/standard/form';
import { IBelong } from '@/utils/excel';
import ShareShowComp from '@/components/Common/ShareShowComp';
import { FormOption } from './option';
import { IWork } from '@/ts/core';
import OpenFileDialog from '@/components/OpenFileDialog';
import useAsyncLoad from '@/hooks/useAsyncLoad';

interface IProps {
  title: string;
  work: IWork;
  belong: IBelong;
  formType: '主表' | '子表';
  current: WorkNodeDisplayModel;
  xforms: schema.XForm[];
}

const FormBinding: React.FC<IProps> = (props) => {
  const [open, setOpen] = useState<boolean>(false);
  const [forms, setForms] = useState<FormInfo[]>([]);
  useEffect(() => {
    setForms(props.current.forms.filter((a) => a.typeName == props.formType));
  }, [props.current]);
  const [loaded, allFiles] = useAsyncLoad(async () => {
    const reports = await props.work.application.loadAllReports();
    const forms = await props.work.application.loadAllForms();
    return [...reports, ...forms];
  });

  const formViewer = React.useCallback((form: schema.XForm) => {
    command.emitter(
      'executor',
      'open',
      new SForm({ ...form, id: '_' + form.id }, props.belong.directory),
      'preview',
    );
  }, []);
  return (
    <>
      <Card
        type="inner"
        title={
          <div>
            <Divider type="vertical" className={cls['divider']} />
            <span>{props.title}</span>
          </div>
        }
        className={cls[`card-info`]}
        extra={
          <a
            onClick={() => {
              setOpen(true);
            }}>
            添加
          </a>
        }>
        {forms.length > 0 && (
          <span>
            <ShareShowComp
              key={'表单'}
              departData={props.xforms}
              onClick={formViewer}
              deleteFuc={(id: string) => {
                props.xforms.splice(
                  props.xforms.findIndex((a) => a.id != id),
                  1,
                );
                props.current.forms = props.current.forms.filter((a) => a.id != id);
                setForms(props.current.forms.filter((a) => a.typeName == props.formType));
              }}
              tags={(id) => {
                const info = props.current.forms.find((a) => a.id == id);
                if (info) {
                  return (
                    <FormOption work={props.work} operateRule={info} typeName="主表" />
                  );
                }
              }}
            />
          </span>
        )}
      </Card>
      <>
        {open && loaded && (
          <OpenFileDialog
            multiple
            title={`选择${props.formType}表单`}
            rootKey={props.work.application.key}
            accepts={['表单', '报表', '表格']}
            fileContents={allFiles}
            excludeIds={props.xforms.map((i) => i.id)}
            leftShow={false}
            rightShow={false}
            onCancel={() => setOpen(false)}
            onOk={(files) => {
              if (files.length > 0) {
                const forms = (files as unknown[] as IForm[]).map((i) => i.metadata);
                props.xforms.push(...forms);
                props.current.forms = [
                  ...(props.current.forms ?? []),
                  ...forms.map((item) => {
                    return {
                      id: item.id,
                      typeName: props.formType,
                      allowAdd: false,
                      allowEdit: false,
                      allowSelect: false,
                    };
                  }),
                ];
                setForms(props.current.forms.filter((a) => a.typeName == props.formType));
              }
              setOpen(false);
            }}
          />
        )}
      </>
    </>
  );
};
export default FormBinding;

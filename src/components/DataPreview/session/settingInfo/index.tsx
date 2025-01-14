import React, { useRef, useState } from 'react';
import orgCtrl from '@/ts/controller';
import WorkFormViewer from '@/components/DataStandard/WorkForm/Viewer';
import OpenFileDialog from '@/components/OpenFileDialog';
import { ISession, IForm, ITarget, IFile, XCollection } from '@/ts/core';
import { Button, Card } from 'antd';
import { Xbase } from '@/ts/base/schema';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { Form } from '@/ts/core/thing/standard/form';
import FullScreenModal from '@/components/Common/fullScreen';
import { DataResource } from '@/ts/core/thing/resource';
import FormService from '@/ts/scripting/core/services/FormService';

export type InfoID = {
  // 信息名称
  InfoTypeName: string;
  // 信息的表单
  InfoFormID: string;
} & Xbase;

interface ICardProps {
  //权限
  auth: Array<string>;
  //信息名称
  title: string;
  //信息存储的空间
  space: ITarget;
  //当前查看的对象
  target?: ITarget;
}

export type IContentProps = {
  InfoTypeName: string;
  targetID: string;
} & Xbase & { [key: string]: any };
// 用于创建自定义集合
const collName = '-resource-info';
const contentCollName = '-resource-content';

interface ISettingInfoEntity {
  space: ITarget;
  coll: XCollection<InfoID>;
  title: string;
  form: IForm | undefined;
  contentColl: XCollection<IContentProps> | undefined;
  content: IContentProps | undefined;
}
//设置信息实体
class SettingInfoEntity implements ISettingInfoEntity {
  space: ITarget;
  coll: XCollection<InfoID>;
  title: string;
  form: IForm | undefined;
  contentColl: XCollection<IContentProps> | undefined;
  content: IContentProps | undefined;
  infoId: InfoID | undefined;
  changeValue: any;
  resource: DataResource;
  constructor(space: ITarget, title: string) {
    this.space = space;

    let resource = this.space.resource;
    if (!resource) {
      resource = new DataResource(this.space.metadata, [], [this.space.metadata.id]);
    }
    this.resource = resource;
    this.coll = resource.genColl<InfoID>(collName);
    this.contentColl = resource.genColl<IContentProps>(contentCollName);
    this.title = title;
  }

  async loadForm(): Promise<void> {
    const res = await this.coll.load({});
    const targetInfoId = res.findLast((infoId) => {
      return infoId.InfoTypeName == this.title;
    });

    if (targetInfoId) {
      this.infoId = targetInfoId;

      const formArr = await this.resource.formColl.find([targetInfoId?.InfoFormID]);
      if (formArr[0]) {
        const formInst = new Form(
          { ...formArr[0], id: formArr[0].id + '_' },
          this.space.directory,
        );
        await formInst.loadFields();
        this.form = formInst;
        this.contentColl = this.resource.genColl<IContentProps>(
          this.form.metadata.collName || '_system-things',
        );
      }
    }
  }

  async changeForm(form: IForm): Promise<void> {
    if (this.infoId) {
      this.infoId.InfoFormID = form.id;
      await this.coll.update(this.infoId.id, {
        _set_: {
          InfoTypeName: this.infoId.InfoTypeName,
          InfoFormID: this.infoId.InfoFormID,
        },
      });
    } else {
      const data = {
        InfoTypeName: this.title,
        InfoFormID: form.id,
      };
      await this.coll.insert(data as unknown as InfoID);
    }
  }

  async loadInfo(target: ITarget): Promise<any> {
    // 使用新的集合去存储表单的数据
    if (this.contentColl) {
      const res = await this.contentColl.load({});
      const typeContentArr = res.filter((data) => {
        return data.InfoTypeName == this.title;
      });
      const content = typeContentArr.find((data) => {
        return data.targetID === target.id;
      });
      if (!content) {
        const newContent = {
          InfoTypeName: this.title,
          targetID: target.id,
          labels: ['F' + this.form?.id],
          name: this.form?.name,
        };
        this.content = await this.contentColl.insert(
          newContent as unknown as IContentProps,
        );
      } else {
        this.content = content;
      }
      return this.getContentValue();
    }
  }

  getContentValue() {
    if (this.content) {
      const data: { [key: string]: any } = {};
      if (this.form?.fields) {
        this.form.fields.forEach((fieldId) => {
          if (this.content![fieldId.code]) {
            data[fieldId.id] = this.content![fieldId.code];
          }
        });
      }
      return data;
    }
  }

  setContentValue() {}

  changeContent(data: any) {
    this.changeValue = data;
  }

  async saveInfo(): Promise<void> {
    if (this.content) {
      const saveData: { [key: string]: any } = {};
      for (let key in this.changeValue) {
        if (this.changeValue[key] && key !== 'name') {
          saveData['T' + key] = this.changeValue[key];
        }
      }
      if (this.contentColl) {
        await this.contentColl.update(this.content?.id, {
          _set_: { ...saveData },
        });
      }
    }
  }
}

const InfoCard: React.FC<ICardProps> = (props) => {
  const { space, target, title } = props;
  // 表单选择器开关
  const [needType, setNeedType] = useState('');
  // 选定的表单
  const [form, setForm] = useState<IForm | undefined>(undefined);

  const [formData, setFormData] = useState<any | undefined>(undefined);
  const [infoEntity] = useState<SettingInfoEntity>(new SettingInfoEntity(space, title));
  const server = useRef<FormService>();
  const setAuth = props.auth.indexOf('set') > -1;
  const editAuth = props.auth.indexOf('edit') > -1;
  const previewAuth = props.auth.indexOf('preview') > -1;
  // 使用useAsyncLoad 加载表单的信息
  useAsyncLoad(async () => {
    await loadForm();
    if (previewAuth) {
      await loadInfo();
    }
  });

  // 加载信息绑定的表单
  const loadForm = async () => {
    // await infoEntity.loadForm();
    // setForm(infoEntity.form);
  };

  // 加载信息
  const loadInfo = async () => {
    // setFormData(await infoEntity.loadInfo(target || space));
  };
  // 设置信息
  const setInfo = (fieldId: string, value: any, data: any) => {
    // infoEntity.changeContent(data);
  };
  // 保存信息
  const saveInfo = async () => {
    // await infoEntity.saveInfo();
  };

  const getButtons = () => {
    const bottonArr = [];
    if (setAuth)
      bottonArr.push(
        <Button
          onClick={() => {
            setNeedType('表单');
          }}>
          {form ? '切换表单' : '设置表单'}
        </Button>,
      );
    return bottonArr;
  };
  const getContent = () => {
    //根据权限 数据 当前选择切换展示的信息
    return (
      <>
        <Button
          onClick={async () => {
            setNeedType('信息预览');
          }}>
          {form ? form.name : '未绑定表单'}
        </Button>
      </>
    );
  };
  const onSelectFinish = async (files: IFile[]) => {
    if ('表单' == needType) {
      const form = files[0] as IForm;
      await form.loadFields();
      setForm(form);
      server.current = FormService.fromIForm(form);
      // infoEntity.changeForm(form);
    }
    setNeedType('');
  };
  return (
    <>
      <Card title={props.title} extra={getButtons()}>
        {getContent()}
      </Card>

      {form && server.current && (
        <FullScreenModal
          open={needType === '信息预览'}
          width={'80vw'}
          bodyStyle={{
            maxHeight: '100vh',
          }}
          onSave={editAuth ? saveInfo : undefined}
          closable={true}
          maskClosable={true}
          onCancel={() => {
            setNeedType('');
          }}>
          <WorkFormViewer data={formData} allowEdit={editAuth} service={server.current} />
        </FullScreenModal>
      )}

      {needType == '表单' && (
        <OpenFileDialog
          title={`选择${title}`}
          rootKey={space.directory.key}
          accepts={[needType]}
          onCancel={() => setNeedType('')}
          onOk={onSelectFinish}
        />
      )}
    </>
  );
};

interface IProps {
  target: ITarget;
  session: ISession;
}

const SettingInfoArr: React.FC<IProps> = (props) => {
  const { target, session } = props;
  // 本人对象
  const mySelf = orgCtrl.user;

  //
  const arr = [];
  // 群权限
  const hasRelationAuth = session.target.hasRelationAuth();
  // 基本信息-公开信息
  // const reloadFinish = () => {
  //   orgCtrl.changCallback();
  // };
  // arr.push(
  //   <Card title="公开信息">
  //     {/* <TargetForm formType={'remark'} current={target as any} finished={reloadFinish} /> */}
  //   </Card>,
  // );

  // 基本信息-备注信息
  let lastItemAuth = ['edit', 'preview'];

  // 对象类型
  switch (target.typeName) {
    case '人员':
      if (session.typeName == '人员') {
        if (target.metadata.id === orgCtrl.user.id) {
          // 本人
          lastItemAuth = ['set'];
          arr.push(
            <InfoCard
              title="好友申请信息"
              auth={['set']}
              space={mySelf}
              target={mySelf}></InfoCard>,
          );
          arr.push(
            <InfoCard
              title="个人名片"
              auth={['set', 'edit', 'preview']}
              space={mySelf}
              target={mySelf}></InfoCard>,
          );
          // arr.push(<AccoutSetting {...props} />);
        } else {
          // 好友
          arr.push(
            <InfoCard
              title="个人名片"
              auth={['preview']}
              //这里需要切换到target
              space={target}
              target={target}></InfoCard>,
          );
          arr.push(
            <InfoCard
              title="好友申请信息"
              auth={['preview']}
              space={mySelf}
              target={mySelf}></InfoCard>,
          );
        }
      } else if (session.typeName == '单位') {
        // 同事
        arr.push(
          <InfoCard
            title="群名片"
            auth={['preview']}
            space={session.target}
            target={target}></InfoCard>,
        );
        if (hasRelationAuth)
          arr.push(
            <InfoCard
              title="加入该群的信息"
              auth={['preview']}
              space={session.target}
              target={target}></InfoCard>,
          );
      }
      break;
    case '单位':
      if (hasRelationAuth) {
        arr.push(
          <InfoCard
            title="群信息"
            auth={['set', 'edit', 'preview']}
            space={session.target}
            target={session.target}></InfoCard>,
        );
        arr.push(
          <InfoCard
            title="群名片"
            auth={['set', 'edit', 'preview']}
            space={session.target}
            target={mySelf}></InfoCard>,
        );
        arr.push(
          <InfoCard
            title="加入该群的信息"
            auth={['set', 'preview']}
            space={session.target}
            target={mySelf}></InfoCard>,
        );
      } else {
        arr.push(
          <InfoCard
            title="群信息"
            auth={['preview']}
            space={session.target}
            target={session.target}></InfoCard>,
        );
        arr.push(
          <InfoCard
            title="群名片"
            auth={['edit', 'preview']}
            space={session.target}
            target={mySelf}></InfoCard>,
        );
        arr.push(
          <InfoCard
            title="加入该群的信息"
            auth={['preview']}
            space={session.target}
            target={mySelf}></InfoCard>,
        );
      }
      break;
    default:
      break;
  }
  const lastItem = (
    <InfoCard
      auth={lastItemAuth}
      title="备注信息"
      space={mySelf}
      target={target}></InfoCard>
  );
  arr.push(lastItem);

  return <>{arr}</>;
};

export default SettingInfoArr;

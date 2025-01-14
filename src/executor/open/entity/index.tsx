import React, { useRef } from 'react';
import { Image } from 'antd';
import { ProFormColumnsType } from '@ant-design/pro-components';
import SchemaForm from '@/components/SchemaForm';
import { TargetModel } from '@/ts/base/model';
import UploadItem from '../../tools/uploadItem';
import { model, parseAvatar, schema } from '@/ts/base';
import QrCode from 'qrcode.react';
import { formatZhDate } from '@/utils/tools';
import orgCtrl from '@/ts/controller';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import UploadBanners from '../../tools/uploadBanners';

interface Iprops {
  entity: schema.XEntity | schema.XTarget;
  finished: () => void;
}
/*
  编辑
*/
const EntityPreview: React.FC<Iprops> = ({ entity, finished }) => {
  const canvasRef = useRef(null);

  const handleDownloadQrcode = (title: string) => {
    const divElement: any = canvasRef.current;
    if (!divElement) return;
    const canvasElement = divElement.querySelector('canvas');
    // 将 canvas 转换为图片的 Base64 格式
    const imageDataURL = canvasElement.toDataURL('image/png');
    // 创建 Blob 对象
    const blob = dataURItoBlob(imageDataURL);
    // 创建下载链接
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = title;

    // 触发下载
    downloadLink.click();
  };

  // 将 Data URI 转换为 Blob 对象
  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const columns: ProFormColumnsType<TargetModel>[] = [
    {
      dataIndex: 'id',
      renderFormItem: () => {
        const avatar: model.FileItemShare = parseAvatar(entity.icon);
        return (
          <div ref={canvasRef} style={{ display: 'flex' }}>
            <QrCode
              level="H"
              size={150}
              renderAs="canvas"
              title={`${location.origin}/${entity.id}`}
              value={`${location.origin}/${entity.id}`}
              imageSettings={{
                src: avatar?.thumbnail ?? '',
                width: 50,
                height: 50,
                excavate: true,
              }}
            />
            <Image
              onClick={() => handleDownloadQrcode(entity.name)}
              width={18}
              preview={false}
              src={`/svg/operate/download.svg?v=1.0.1`}
              style={{ cursor: 'pointer', marginLeft: '12px' }}
            />
          </div>
        );
      },
    },
    {
      title: '图标',
      dataIndex: 'icon',
      renderFormItem: (_, __, form) => {
        return (
          <UploadItem
            readonly
            typeName={entity.typeName}
            icon={entity.icon}
            onChanged={(icon) => {
              form.setFieldValue('icon', icon);
            }}
            directory={orgCtrl.user.directory}
          />
        );
      },
    },
    {
      title: '名称',
      dataIndex: 'name',
      readonly: true,
    },
    {
      title: '类型',
      dataIndex: 'typeName',
      valueType: 'select',
      initialValue: entity.typeName,
      readonly: true,
    },
    {
      title: '代码',
      dataIndex: 'code',
      readonly: true,
    },
  ];
  if ('storeId' in entity) {
    columns.push({
      title: '当前数据核',
      dataIndex: 'storeId',
      readonly: true,
      render: () => <EntityIcon entityId={entity.storeId} showName />,
    });
  }
  if (entity.belongId !== entity.id) {
    columns.push({
      title: '归属',
      dataIndex: 'belongId',
      readonly: true,
      render: () => <EntityIcon entityId={entity.belongId} showName />,
    });
  }
  if (entity.createUser !== entity.id) {
    columns.push({
      title: '创建人',
      dataIndex: 'createUser',
      readonly: true,
      render: () => <EntityIcon entityId={entity.createUser} showName />,
    });
  }
  columns.push({
    title: '创建时间',
    dataIndex: 'createTime',
    readonly: true,
    render: () => formatZhDate(entity.createTime),
  });
  if (entity.updateUser != entity.createUser) {
    columns.push({
      title: '更新人',
      dataIndex: 'updateUser',
      readonly: true,
      render: () => <EntityIcon entityId={entity.updateUser} showName />,
    });
  }
  if (entity.createTime != entity.updateTime) {
    columns.push({
      title: '更新时间',
      dataIndex: 'updateTime',
      readonly: true,
      render: () => formatZhDate(entity.updateTime),
    });
  }
  if ('applicationId' in entity) {
    columns.push({
      title: '版本',
      dataIndex: 'version',
      readonly: true,
      render: () => `v${(entity as schema.XWorkDefine).version}`,
    });
  }
  columns.push({
    title: '简介',
    dataIndex: 'remark',
    valueType: 'textarea',
    colProps: { span: 24 },
    readonly: true,
  });

  if (entity.typeName === '应用') {
    columns.push({
      title: '封面',
      dataIndex: 'banners',
      readonly: true,
      render: () => {
        const { banners } = entity as schema.XApplication;
        const bannersList = banners ? JSON.parse(banners) : [];
        return (
          <UploadBanners
            readonly={true}
            banners={Array.isArray(bannersList) ? bannersList : [bannersList]}
            onChanged={() => {}}
            directory={orgCtrl.user.directory}
          />
        );
      },
    });
  }
  return (
    <SchemaForm<TargetModel>
      open
      title={
        <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center' }}>
          {entity.name}
        </div>
      }
      width={640}
      columns={columns}
      initialValues={entity}
      rowProps={{
        gutter: [24, 0],
      }}
      layoutType="ModalForm"
      onOpenChange={(open: boolean) => {
        if (!open) {
          finished();
        }
      }}
      onFinish={() => {
        finished();
      }}></SchemaForm>
  );
};

export default EntityPreview;

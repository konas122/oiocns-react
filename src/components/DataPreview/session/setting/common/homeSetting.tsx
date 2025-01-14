import React from 'react';
import { Card, Row, Col } from 'antd';
import Banner from '../components/banner';
import CompanyList from '../components/companyList';
import { ISession, IPerson, ICompany, ITarget } from '@/ts/core';
import PersonList from '../components/personList';
interface IProps {
  target: ITarget;
  session: ISession;
}
const HomeSetting: React.FC<IProps> = ({ target, session }) => {
  const { typeName } = target;
  const hasAvtivityBanerSettingTypeName = ['群组', '人员', '单位'];
  const haseWorkbenchBanerSettingTypeName = ['单位', '人员'];
  const hasCompanyTypeName = ['单位'];
  const haspersonTypeName = ['人员'];
  // TODO 群组字段未确定 先隐形
  if (typeName === '群组') return <></>;
  return (
    <>
      <Card title="门户设置" bodyStyle={{ padding: '10px' }}>
        <Row>
          <Col span={12}>
            {~hasAvtivityBanerSettingTypeName.indexOf(typeName) ? (
              <Banner
                session={session}
                target={target}
                title="工作台封面"
                bannerkey="workbench"
                multi={false}
              />
            ) : null}
          </Col>
          <Col span={12}>
            {~haseWorkbenchBanerSettingTypeName.indexOf(typeName) ? (
              <Banner
                session={session}
                target={target}
                title="动态封面"
                bannerkey="activity"
                multi={false}
              />
            ) : null}
          </Col>
        </Row>
      </Card>
      {~haspersonTypeName.indexOf(typeName) ? (
        <PersonList title={'常用'} target={target as IPerson} />
      ) : null}
      {~hasCompanyTypeName.indexOf(typeName) ? (
        <CompanyList current={target as ICompany}/>
      ) : null}
    </>
  );
};

export default HomeSetting;

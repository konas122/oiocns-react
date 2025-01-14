import React from 'react';
import Login from './login';
import Register from './register';
import Forget from './forget';
import AuthLayout from '../layout';

const authContent: React.FC = () => {
  const [current, setCurrent] = React.useState('login');
  const RenderContent = () => {
    switch (current) {
      case 'register':
        return <Register to={(flag) => setCurrent(flag)} />;
      case 'forget':
        return <Forget to={(flag) => setCurrent(flag)} />;
      default:
        return <Login to={(flag) => setCurrent(flag)} />;
    }
  };
  return (
    <AuthLayout>
      <RenderContent />
    </AuthLayout>
  );
};
export default authContent;

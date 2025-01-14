import React from 'react';
import { useHistory } from 'react-router-dom';

const style = {
  msgBox: {
    backgroundColor: '#F7F8FA',
    padding: '10px 20px',
    listStyle: 'none',
  },
  msgBoxLi: {
    color: '#15181D',
    fontWeight: 600,
    fontSize: '14px',
    height: '24px',
  },
  link: {
    color: '#366EF4',
    marginLeft: '4px',
    fontSize: '14px',
  },
};

interface TodoEmptyType {
  refNode: any;
}
const TodoEmpty: React.FC<TodoEmptyType> = ({ refNode }) => {
  const history = useHistory();

  return (
    <ul style={style.msgBox}>
      <p>你还可以</p>
      <li style={style.msgBoxLi}>
        查看全部应用和数据
        <a style={style.link} onClick={() => history.push('store')}>
          前往数据
        </a>
      </li>
      <li style={style.msgBoxLi}>
        新建应用
        <a style={style.link} onClick={() => refNode.current.setOpen(true)}>
          查看操作示意
        </a>
      </li>
      <li style={style.msgBoxLi}>
        完善组织关系、设立权限岗位角色等<a style={style.link} onClick={() => history.push('relation')}>前往关系</a>
      </li>
    </ul>
  );
};

export default TodoEmpty;

export const styleTemplate = `
.Content{
  width: 1000px;
  height: 100%;
  page-break-before: always;
  // background-color: red;
  margin: auto;
}
@media print {
  .ContentTitle {
    page-break-before: always;
  }
}
.printContent {
  width: 100%;
  border-collapse:collapse;
}
  .table-cell {
    flex: 1;
    line-height:50px;
    border: 1px solid black;
    box-sizing: border-box;
    text-align: center;
    margin: -1px 0 0 -1px;
}
.head{
  text-align: center;
  font-weight: 600;
  margin: 20px 0;
}
.tableData{
  text-align: center;
}
//   .height50 {
//     height: 50px;
//   }
.marginleft50{
margin: 10px 50px;
}

.height50 {
  height: 50px;
}

.height200{
  height: 200px;
}

.height300 {
  height: 300px;
}

.tableName {
  width: 15%;
  text-align: center;
}

.width12 {
  width: 12%;
  text-align: center;
}
.qianzi{
  text-align: right;
  margin-top: 20px;
  margin-right: 100px;
}
.template3_qz{
  // height: 150px;
  text-align: left;
}
.qz{
  margin: 75px 0 0 30px;
}
.time{
  margin: 10px;
}
`;

**orginone接口文档**

# 请求地址

<https://asset.orginone.cn/orginone/kernel/rest>

# 请求接口

## **Thing:**



### 1.折旧depreciationThing

**接口类型**

http

**接口地址**

dataproxy

**请求类型**

POST

**输入参数**
| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | Depreciation |
| flag | 集合名称 | 是   | string | depreciationThing |
| module | 模块  | 是   | string | Thing |
| params | 参数  | 是   | object | {id: "123", type: "Calculate"} |
| relations | [user=>relations=>target],(最大支持2级关系) | 否   | string[] | ["123"] |
| targetId | 目标ID | 是   | string | 123 |

**请求参数**
```json
{  
    "module": "Thing",
    "action": "Depreciation",
    "belongId": "445708344880140288",
    "relations": [
        "445708344880140288"
    ],
    "targetId": "445708344880140288",
    "flag": "depreciationThing",
    "params": {
        "id": "592015253307535361",
        "type": "Calculate"
    }

}
```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "labels": [],
        "createTime": "2024-07-29 09:52:35.079",
        "isDeleted": false,
        "createUser": "445899863230648320",
        "version": 1,
        "updateTime": "2024-07-29 09:52:35.079",
        "belongId": "445708344880140288",
        "name": "计提折旧",
        "updateUser": "445899863230648320",
        "instanceId": "592015253307535361",
        "progress": 0,
        "typeName": "Calculate",
        "id": "7223505372563480576",
        "status": 1
    },
    "msg": "成功",
    "success": true
}
```

### 2、物的快照snapshotThing

**接口类型**

http

**接口地址**

dataproxy

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | "Snapshot" |
| flag | 集合名称 | 是   | string | "snapshotThing" |
| module | 模块  | 是   | string | Thing |
| params | 参数  | 是   | object | {<br><br>"collName": "_system-things", "dataPeriod": "2024-06"<br><br>} |
| relations | [user=>relations=>target],(最大支持2级关系) | 否   | string[] | ["123"] |
| targetId | 目标ID | 是   | string | 123 |

**请求参数**
```json
{
    "module": "Thing",
    "action": "Snapshot",
    "belongId": "445708344880140288",
    "relations": ["445708344880140288"],
    "targetId": "445708344880140288",
    "flag": "snapshotThing",
    "params": {
        "collName": "_system-things",
        "dataPeriod": "2024-06"
    }
}
```
**响应示例**
```json
{
    "code": 200,
    "data": {},
    "msg": "成功",
    "success": true
}
```
### 3、创建物createThing

**接口类型**

http

**接口地址**

dataproxy

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | Create |
| flag | 集合名称 | 是   | string | createThing |
| module | 模块  | 是   | string | Thing |
| params | 参数  | 是   | object | {<br><br>name: "12", count: 1<br><br>} |
| relations | [user=>relations=>target],(最大支持2级关系) | 否   | string[] | ["123"] |
| targetId | 目标ID | 是   | string | 123 |

**请求参数**
```json
{

 "module":"Thing",
    "action":"Create",
    "flag":"createThing",
    "belongId":"552572603894738944",
    "relations":[],
    "params": {
        "name": "资产接收申请表", "count":1
    },
    "targetId":"552572603894738944"

}
```
**响应示例**
```json
{
    "code": 200,
    "data": [
        {
            "id": "603178445060579328",
            "name": "资产接收申请表",
            "code": "T603178445060579328",
            "chainId": "503875f8-8102-4cea-95b8-92cb654b49f1",
            "remark": "初次生成",
            "shareId": "552572603894738944",
            "belongId": "552572603894738944",
            "status": 1,
            "createUser": "445899863230648320",
            "updateUser": "445899863230648320",
            "version": "1",
            "createTime": "2024-07-22 10:55:47.816",
            "updateTime": "2024-07-22 10:55:47.816"
        }
    ],
    "msg": "success",
    "success": true
}
```

## **Collection:**

### 1.添加数据到数据集collectionInsert

**接口类型**

http

**接口地址**

dataproxy

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | Insert |
| targetId | 目标id | 是   | string | 123 |
| copyId | 抄送id | 否   | string |     |
| flag | 标签  | 是   | string | _system-things |
| module | 模块  | 是   | string | Collection |
| params | 参数  | 是   | object | 见上  |
| relations | [user=>relations=>target],(最大支持2级关系) | 是   | string\[] | ["123"] |

**请求参数**
```json
{
    "action": "Insert",
    "belongId": "112233", 
    "copyId": null,
    "flag": "_system-things", 
    "module": "Collection", 
    "params": {
        "data": [
               {
                "****": "****",
                "****": "****"
                }
         ],
         "collName": "_system-things"
    },
    "relations": [ 
        "112233"
    ]
}
```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "data": [
            {
                "T527635705355182080": "ZCTY20221200766089",
                "T527635505714700288": "台",
                "T527635508780736512": "S527634629218410497",
                "T527635705304850432": "01136174500107255840"
            }
        ]
    },
    "msg": "成功",
    "success": true
}
```

### 2、变更数据集数据collectionSetFields

**接口类型**

http

**接口地址**

dataproxy

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | String | SetFields |
| belongId | 归属ID | 是   | String | 123 |
| flag | 标签  | 是   | String | chat-messages |
| module | 模块  | 是   | String | Collection |
| params | 参数  | 是   | Object | 见下示例  |
| relations | [user=>relations=>target],(最大支持2级关系) | 是   | []string | ["123"] |
| targetId | 目标id | 是   | String | 123 |


**请求参数**
```json
{
    "module": "Collection",
    "action": "SetFields",
    "targetId": "526826613321637888",
    "belongId": "445967867377225728",
    "relations": [
        "445967867377225728"
    ],
    "flag": "chat-messages",
    "params": {
        "collName": "chat-messages",
        "collSet": {
            "ids": [
                "603187014929670145",
                "603187246404919297"
            ],
            "update": {
                "_push_": {
                    "comments": {
                        "label": "已读",
                        "time": "sysdate()",
                        "userId": "445899863230648320",
                        "designateId": "445899863230648320"
                    }
                }
            }
        }
    }
}
```
**响应示例**
```json
{
    "code": 200,
    "data": [
        {
            "version": 1,
            "isDeleted": false,
            "typeName": "文本",
            "shareId": "526826613321637888",
            "status": 1,
            "updateUser": "445635922516643840",
            "fromId": "445635922516643840",
            "content": "^!:spRr3eJxFTzsOwlAMO413eN90TOjjHhQ6gESfBF24fd2oEosTOXbiIFufXsgjqiGEqT9+LIhK/My3+4qWIQIpaAVDgl7REsygEa1CT5DzwQxxF5t6IzCOortIJteo74kQjsIuVi6s3jRY8VsUu4uo4i5et7+L6cKF+J6X9dmX7xE3mz8xbjDiLjI*TfEzX",
            "updateTime": "2024-07-22 11:29:51.031",
            "toId": "526826613321637888",
            "belongId": "445967867377225728",
            "id": "603187014929670145",
            "name": null,
            "createUser": "445635922516643840",
            "createTime": "2024-07-22 11:29:51.031",
            "labels": [],
            "comments": [
                {
                    "time": "2024-07-22 11:29:51.112",
                    "userId": "445694024414793728",
                    "designateId": "445694024414793728",
                    "label": "已读"
                },
                {
                    "label": "已读",
                    "time": "2024-07-22 11:29:51.141",
                    "userId": "580325576036986880",
                    "designateId": "580325576036986880"
                },
                {
                    "designateId": "358221262448889856",
                    "label": "已读",
                    "time": "2024-07-22 11:31:17.115",
                    "userId": "358221262448889856"
                },
                {
                    "label": "已读",
                    "time": "2024-07-22 11:34:10.320",
                    "userId": "589022118327496704",
                    "designateId": "589022118327496704"
                },
                
            ],
            "designateId": "445635922516643840"
        },
        {
            "id": "603187246404919297",
            "updateTime": "2024-07-22 11:30:46.220",
            "typeName": "文本",
            "fromId": "445635922516643840",
            "comments": [
                {
                    "label": "已读",
                    "time": "2024-07-22 11:30:46.278",
                    "userId": "445694024414793728",
                    "designateId": "445694024414793728"
                },
               
            ],
            "content": "^!:JZjpzeJxtkLEOwjAMRL/m9pI2qTPaTfohFQwg0SJg4e+x3QgYWJxTnn1nGVG25YJYMApCWLbjSx/0bLUSqAMdUEdkBg2oA0SQe9QI4SbyBOlcFOu3nmKfJsjaFPEAGtu40tq7c2iIRxcVklATaEbefVjp7W6QyEMScnLx2cgR+VxWp7nFEv+E/N1aUTEfDd+dJYAPbqj59B3XS4RJ6/W0Ps/b+mgHiuJnK2+ATUTZMS3cb",
            "createUser": "445635922516643840",
            "version": 1,
            "createTime": "2024-07-22 11:30:46.220",
            "toId": "526826613321637888",
            "updateUser": "445635922516643840",
            "belongId": "445967867377225728",
            "name": null,
            "status": 1,
            "isDeleted": false,
            "labels": [],
            "designateId": "445635922516643840",
            "shareId": "526826613321637888"
        }
    ],
    "msg": "成功",
    "success": true
}
```

### 3、替换数据集数据collectionReplace

**接口类型**

http

**接口地址**

dataproxy

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | String | Replace |
| belongId | 归属ID | 是   | String | 123 |
| flag | 标签  | 是   | String | standard-form |
| module | 模块  | 是   | String | Collection |
| params | 参数  | 是   | Object | 见下示例  |
| relations | [user=>relations=>target],(最大支持2级关系) | 是   | []string | ["123"] |
| targetId | 目标id | 是   | String | 123 |

**请求参数**
```json
{
    "module": "Collection",
    "action": "Replace",
    "targetId": "571748758350606336",
    "belongId": "571748758350606336",
    "relations": [
        "571748758350606336"
    ],
    "flag": "standard-form",
    "params": {
        "collName": "standard-form",
        "replace": {
            "id": "603191002987106305",
            "version": 1,
            "isDeleted": false,
            "labels": [],
            "status": 1,
            "createUser": "445899863230648320",
            "createTime": "2024-07-22 11:45:41.859",
            "attributes": [],
            "shareId": "571748758350606336",
            "belongId": "571748758350606336",
            "name": "测试1",
            "updateTime": "2024-07-22 11:45:41.859",
            "code": "CS1",
            "typeName": "表单",
            "remark": "123",
            "updateUser": "445899863230648320",
            "directoryId": "585843566182539265",
            "rule": []
        }
    }
}
```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "createUser": "445899863230648320",
        "isDeleted": false,
        "attributes": [],
        "id": "603191002987106305",
        "status": 1,
        "createTime": "2024-07-22 11:45:41.859",
        "code": "CS1",
        "version": 1,
        "labels": [],
        "shareId": "571748758350606336",
        "typeName": "表单",
        "directoryId": "585843566182539265",
        "name": "测试1",
        "updateUser": "445899863230648320",
        "updateTime": "2024-07-22 14:57:49.773",
        "belongId": "571748758350606336",
        "remark": "123",
        "rule": []
    },
    "msg": "成功",
    "success": true
}
```
### 4、更新数据到数据集collectionUpdate

**接口类型**

http

**接口地址**

dataproxy

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | String | Update |
| belongId | 归属ID | 是   | String | 123 |
| flag | 标签  | 是   | String | standard-form |
| module | 模块  | 是   | String | Collection |
| params | 参数  | 是   | Object | 见下示例 |
| relations | [user=>relations=>target],(最大支持2级关系) | 是   | []string | ["123"] |
| targetId | 目标id | 是   | String | 123 |

**请求参数**
```json
{
    "module": "Collection",
    "action": "Update",
    "belongId": "571748758350606336",
    "targetId": "571748758350606336",
    "relations": [
        "571748758350606336"
    ],
    "flag": "standard-form",
    "params": {
        "collName": "standard-form",
        "update": {
            "match": {
                "id": "603243082158317569"
            },
            "update": {
                "_set_": {
                    "isDeleted": true
                }
            }
        }
    }
}
```
**响应示例**
```json
{
    "code": 200,
    "data": {
    "MatchedCount": 1,
    "ModifiedCount": 1
    },
    "msg": "成功",
    "success": true
}
```
### 5、从数据集移除数据collectionRemove

**接口类型**

http

**接口地址**

dataproxy

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | String | "Remove" |
| belongId | 归属ID | 是   | String | 123 |
| flag | 标签  | 是   | String | "work-instance-staging" |
| module | 模块  | 是   | String | Collection |
| params | 参数  | 是   | Object | 见下示例 |
| relations | [user=>relations=>target],(最大支持2级关系) | 是   | []string | ["123"] |
| targetId | 目标id | 是   | String | 123 |

**请求参数**
```json
{
    "module": "Collection",
    "action": "Remove",
    "belongId": "445899863230648320",
    "targetId": "445899863230648320",
    "relations": ["445899863230648320"],
    "flag": "work-instance-staging",
    "params": {
        "collName": "work-instance-staging",
        "match": {
            "id": {
                "_in_": ["606420952003297281"]
            }
        }
    }
}
```
**响应示例**
```json
{
    "code": 200,
    "data": 1,
    "msg": "成功",
    "success": true
}
```
### 6、查询数据集数据collectionLoad

**接口类型**

http

**接口地址**

dataproxy

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | Load |
| targetId | 目标ID | 是   | string | 123 |
| flag | 集合名称 | 是   | string | _system-things |
| module | 模块  | 是   | string | Collection |
| params | 参数  | 是   | object | 下见  |
| relations | [user=>relations=>target],(最大支持2级关系) | 是   | string[] | [123] |

**params结构**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| requireTotalCount | 总数  | 否   | boolean | false |
| skip | 跳过个数 | 否   | number | 0   |
| take | 获取个数 | 否   | number | 10  |
| userData | 目标id集合 | 否   | string[] | [123] |
| options | 参数  | 否   | object | {}  |
| targetId | 目标id | 否   | string | 123 |
| collName | 存储位置 | 否   | string | _system-things |
| data | 数据  | 否   | array | [] |
| filter | 过滤条件 | 否   | array | 见下示例 |

**请求参数**
```json
{
    "action": "Load", 
    "targetId": "1112233",  
    "flag": "_system-things",  
    "module": "Collection",
    "params": {
        "requireTotalCount": false,  
        "skip": 0,  
        "take": 100,
        "userData": [], 
        "options": {}, 
        "targetId": "1112233", 
        "collName": "_system-things",
        "filter": [   //过滤条件
            [
                "id",
                "=",
                "****"
            ],
            "and",
            [
                "name",
                "<>",
                "****"
            ]   
         ]
    },
    "relations": [  // 归属id
        "1112233"
    ]
}
```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "data": [
            {
                "T527635705355182080": "ZCTY20221200766089",
                "T527635505714700288": "台",
                "T527635508780736512": "S527634629218410497",
                "T527635705304850432": "01136174500107255840"
            }
        ]
    },
    "msg": "成功",
    "success": true
}
```

### 7、从数据集查询数据collectionAggregate

**接口类型**

http

**接口地址**

dataproxy

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | Aggregate |
| flag | 集合名称 | 是   | string | _system-things-changed |
| module | 模块  | 是   | string | Collection |
| params | 参数  | 是   | object | 下见示例 |
| relations | [user=>relations=>target],(最大支持2级关系) | 否   | string[] | ["123"] |
| targetId | 目标ID | 是   | string | 123 |

**请求参数**
```json
{
"module": "Collection",
	"action": "Aggregate",
	"flag": "_system-things-changed",
	"belongId": "445708344880140288",
	"targetId": "445708344880140288",
	"relations": ["445708344880140288"],
	"params": {
		"collName": "_system-things-changed",
		"options": [{
			"match": {
				"belongId": "445708344880140288",
				"propId": "T527635532138815488",
				"changeTime": "2024-05",
				"name": "计提折旧",
				"_or_": [{
					"labels": {
						"_exists_": false
					}
				}, {
					"labels": {
						"_size_": 0
					}
				}, {
					"labels": {
						"_nin_": []
					}
				}],
				"T527635424630415360": "S527634689146626049",
				"T527635708853231616": {
					"_ne_": null
				}
			}
		}, {
			"group": {
				"key": ["T527635708853231616"],
				"change": {
					"_sum_": "$change"
				}
			}
		}, {
			"limit": 65535
		}]
	}
}
```
**响应示例**
```json
{
 "code": 200,
    "data": [
        {
            "_id": {
                "T527635708853231616": "S527634976942989340"
            },
            "change": 2963.460000000001,
            "T527635708853231616": "S527634976942989340"
        },
        {
            "T527635708853231616": "S527634961998684163",
            "_id": {
                "T527635708853231616": "S527634961998684163"
            },
            "change": 165923.88999999998
        },
        {
            "_id": {
                "T527635708853231616": "S527634938388946946"
            },
            "change": 7688.650000000003,
            "T527635708853231616": "S527634938388946946"
        },
        {
            "_id": {
                "T527635708853231616": "S527634910136115218"
            },
            "change": 62698.48999999997,
            "T527635708853231616": "S527634910136115218"
        },
    ],
    "msg": "成功",
    "success": true
}
```
## **Target:**

### 1. 激活存储activateStorage

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | ActivateStorage |
| module | 模块  | 是   | string | target |
| params | 激活存储 | 是   | object | {id: "505510432631558144", subId: "603178893817561088"} |

**请求参数**  
```json
{
  "module": "target",
  "action": "ActivateStorage",
  "params": {
    "id": "505510432631558144",
    "subId": "603178893817561088"
  }
}
```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "id": "603178893817561088",
        "name": "测试单位2",
        "code": "9131000071788056XP",
        "remark": "123",
        "typeName": "单位",
        "belongId": "603178893817561088",
        "storeId": "505510432631558144",
        "status": 1,
        "createUser": "445888887320088576",
        "updateUser": "445888887320088576",
        "version": "2",
        "createTime": "2024-07-22 10:57:34.808",
        "updateTime": "2024-07-22 15:31:51.617"
    },
    "msg": "success",
    "success": true
}
```
### 2. 创建权限createAuthority

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | CreateAuthority |
| module | 模块  | 是   | string | target |
| params | 权限信息 | 是   | object | {name: "资产管理权", code: "ZCGLQ", shareId: "571749323461767168", public: true, remark: "123",shareId: "571749323461767168"} |

**请求参数** 
```json
{
  "module": "target",
  "action": "CreateAuthority",
  "params": {
    "name": "资产管理权",
    "code": "ZCGLQ",
    "shareId": "571749323461767168",
    "public": true,
    "remark": "123",
    "shareId": "571749323461767168"
  }
}
```
**响应示例**
```json
{
  "code": 200,
  "data": {
    "id": "603180931716673536",
    "code": "ZCGLQ",
    "createTime": "2024-07-22 11:05:40.681",
    "createUser": "445888887320088576",
    "name": "资产管理权",
    "parentId": "361356410044420096",
    "public": true,
    "remark": "123",
    "shareId": "571749323461767168",
    "status": 1,
    "updateTime": "2024-07-22 11:05:40.681",
    "updateUser": "445888887320088576",
    "version": "1"
  },
  "msg": "success",
  "success": true
}

```
### 3. 创建身份createIdentity

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | CreateIdentity |
| module | 模块  | 是   | string | target |
| params | 身份信息 | 是   | object | {name: "管理员3", code: "GLY3", authId: "603180931716673536", person: ["445888887320088576"],remark: "123",shareId: "571749323461767168"} |

**请求参数**  
```json
{
  "module": "target",
  "action": "CreateAuthority",
  "params": {
    "name": "管理员3",
    "code": "GLY3",
    "authId": "603180931716673536",
    "person": [
      "445888887320088576"
    ],
    "remark": "123",
    "shareId": "571749323461767168"
  }
}
```

**响应示例**
```json
{
  "code": 200,
  "data": {
    "authId": "603180931716673536",
    "belongId": "571749323461767168",
    "code": "GLY3",
    "createTime": "2024-07-22 11:24:55.486",
    "createUser": "445888887320088576",
    "id": "603185775319887872",
    "name": "管理员3",
    "remark": "123",
    "shareId": "571749323461767168",
    "status": 1,
    "updateTime": "2024-07-22 11:24:55.486",
    "updateUser": "445888887320088576",
    "version": "1"
  },
  "msg": "success",
  "success": true
}

```
### 4. 创建用户createTarget

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | CreateTarget |
| module | 模块  | 是   | string | target |
| params | 创建用户信息 | 是   | object | 见下示例 |
| belongId | 所属ID | 是   | string | 571749323461767168 |
| code | 代码  | 是   | string | CSGW1 |
| name | 名称  | 是   | string | 测试岗位1 |
| public | 是否公开 | 是   | boolean | false |
| remark | 备注  | 是   | string | 无   |
| teamCode | 团队代码 | 是   | string | CSGW1 |
| teamName | 团队名称 | 是   | string | 测试岗位1 |
| typeName | 类型名称 | 是   | string | 岗位  |

**请求参数**  
```json
{
    "module": "target",
    "action": "CreateTarget",
    "params": {
        "name": "测试岗位1",
        "code": "CSGW1",
        "remark": "无",
        "public": false,
        "typeName": "岗位"
    },
    "belongId": "571749323461767168",
    "code": "CSGW1",
    "name": "测试岗位1",
    "public": false,
    "remark": "无",
    "teamCode": "CSGW1",
    "teamName": "测试岗位1",
    "typeName": "岗位"
}

```

**响应示例**
```json
{
    "code": 200,
    "data": {
      	"id": "603248822281482240",
        "name": "测试岗位1",
        "code": "CSGW1",
        "remark": "123",
        "typeName": "岗位",
        "belongId": "603178893817561088",
        "status": 1,
        "createUser": "445888887320088576",
        "updateUser": "445888887320088576",
        "version": "1",
        "createTime": "2024-07-22 15:35:27.056",
        "updateTime": "2024-07-22 15:35:27.056",
        "team": {
            "id": "603248822302453761",
            "name": "测试岗位1",
            "code": "CSGW1",
            "targetId": "603248822281482240",
            "status": 1,
            "createUser": "445888887320088576",
            "updateUser": "445888887320088576",
            "version": "1",
            "createTime": "2024-07-22 15:35:27.058",
            "updateTime": "2024-07-22 15:35:27.058"
        }
    },    "msg": "success",
    "success": true
}
```
### 5. 删除权限deleteAuthority

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | DeleteAuthority |
| module | 模块  | 是   | string | target |
| params | 权限id | 是   | object | {id: "603180931716673536"} |

**请求参数**  
```json
{
  "module": "target",
  "action": "CreateAuthority",
  "params": {
    "id": "603180931716673536"
  }
}
```
**响应示例**
```json
{  
    "code": 200,  
    "data": true,  
    "msg": "success",  
    "success": true  
}
```
### 6. 删除身份deleteIdentity

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | DeleteIdentity |
| module | 模块  | 是   | string | target |
| params | 身份id | 是   | object | {id: "603190895197736960"} |

**请求参数**  
```json
{
  "module": "target",
  "action": "CreateAuthority",
  "params": {
    "id": "603190895197736960"
  }
}
```
**响应示例**
```json
{
  "code": 200,
  "data": true,
  "msg": "success",
  "success": true
}
```
### 7. 删除用户deleteTarget

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | DeleteTarget |
| module | 模块  | 是   | string | target |
| params | 删除用户 | 是   | object | {id: "603248822197563392"} |

**请求参数**  
```json
{
  "module": "target",
  "action": "CreateAuthority",
  "params": {
    "id": "603190895197736960"
  }
}
```
**响应示例**
```json
{  
    "code": 200,  
    "data": true,  
    "msg": "success", 
    "success": true  
}
```
### 8.创建身份 createIdentity

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | UpdateAuthority |
| module | 模块  | 是   | string | target |
| params | 权限更新信息 | 是   | object | {name: "管理权测试", code: "GLQCS", shareId: "603178893817561088", public: true, remark: "1",shareId: "603178893817561088"} |

**请求参数**
```json  
{
  "module": "target",
  "action": "UpdateAuthority",
  "params": {
    "name": "管理权测试",
    "code": "GLQCS",
    "shareId": "603178893817561088",
    "public": true,
    "remark": "1"
  }
}
```
**响应示例**
```json
{
  "code": 200,
  "data": {
    "belongId": "603178893817561088",
    "code": "GLQCS",
    "createTime": "2024-07-22 11:51:00.827",
    "createUser": "445888887320088576",
    "id": "603192340831715328",
    "name": "管理权测试",
    "parentId": "361356410623234048",
    "public": true,
    "remark": "1",
    "shareId": "603178893817561088",
    "status": 1,
    "updateTime": "2024-07-22 11:51:20.927",
    "updateUser": "445888887320088576",
    "version": "2"
  },
  "msg": "success",
  "success": true
}
```
### 9. 更新用户updateTarget

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | UpdateTarget |
| module | 模块  | 是   | string | target |
| params | 用户更新信息 | 是   | object | {id: "603248822281482240", name: "测试岗位3", code: "CSGW3", remark: "123", typeName: "岗位", public: true } |
| belongId | 所属ID | 是   | string | 571749323461767168 |
| code | 代码  | 是   | string | PTGW2 |
| id  | ID  | 是   | string | 606141454255050752 |
| name | 名称  | 是   | string | 普通岗位2 |
| public | 是否公开 | 是   | boolean | true |
| remark | 备注  | 是   | string | 普通得岗位 |
| teamCode | 团队代码 | 是   | string | PTGW2 |
| teamName | 团队名称 | 是   | string | 普通岗位2 |
| typeName | 类型名称 | 是   | string | 岗位  |

**请求参数**  
```json
{
  "action": "UpdateTarget",
  "module": "target",
  "params": {
    "name": "普通岗位2",
    "code": "PTGW2",
    "remark": "普通得岗位",
    "id": "606141454255050752",
    "typeName": "岗位"
  },
  "belongId": "571749323461767168",
  "code": "PTGW2",
  "id": "606141454255050752",
  "name": "普通岗位2",
  "public": true,
  "remark": "普通得岗位",
  "teamCode": "PTGW2",
  "teamName": "普通岗位2",
  "typeName": "岗位"
}


```
**响应示例**
```json
{
  "code": 200,
  "data": {
    "id": "606141454255050752",
    "name": "普通岗位2",
    "code": "PTGW2",
    "remark": "普通得岗位",
    "typeName": "岗位",
    "public": true,
    "belongId": "571749323461767168",
    "status": 1,
    "createUser": "468445748065865728",
    "updateUser": "468445748065865728",
    "version": "2",
    "createTime": "2024-07-30 15:09:44.261",
    "updateTime": "2024-07-30 15:17:43.229"
  },
  "msg": "success",
  "success": true
}


```
### 10. 分配身份giveIdentity

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | GiveIdentity |
| module | 模块  | 是   | string | target |
| params | 分配身份信息 | 是   | object | {id: "603178893821755392", subIds: ["519153922967998464"]} |

**请求参数**  
```json
{
  "module": "target",
  "action": "UpdateAuthority",
  "params": {
    "id": "603178893821755392",
    "subIds": ["519153922967998464"]
  }
}
```
**响应示例**
```json
{  
   "code": 200,  
   "data": true,  
   "msg": "success",  
   "success": true  
}
```
### 11. 移除身份removeIdentity

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | RemoveIdentity |
| module | 模块  | 是   | string | target |
| params | 移除身份信息 | 是   | object | {id: "603178893821755392", subIds: ["519153922967998464"]} |

**请求参数**  
```json
{
  "module": "target",
  "action": "RemoveIdentity",
  "params": {
    "id": "603178893821755392",
    "subIds": ["519153922967998464"]
  }
}
```
**响应示例**
```json
{  
"code": 200,  
"data": true,  
"msg": "success",  
"success": true  
}
```
### 12. 申请加入用户applyJoinTeam

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | ApplyJoinTeam |
| module | 模块  | 是   | string | target |
| params | 申请加入用户信息 | 是   | object | {id: "603227251483480064", subId: "445888887320088576"} |

**请求参数**  
```json
{
  "module": "target",
  "action": "RemoveIdentity",
  "params": {
    "id": "603178893821755392",
    "subIds": ["519153922967998464"]
  }
}

```
**响应示例**
```json
{  
    "code": 200,  
    "data": true,  
    "msg": "success",  
    "success": true  
}
```
### 13. 拉入用户的团队pullAnyToTeam

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | PullAnyToTeam |
| module | 模块  | 是   | string | target |
| params | 拉入用户的团队信息 | 是   | object | {id: "603178893817561088", subIds: ["468445748065865728"]} |

**请求参数**  
```json
{
    "module": "target",
    "action": "PullAnyToTeam",
    "params": {
    "id": "603178893817561088",
    "subId": "519153922967998464"
    }
}
```
**响应示例**
```json
{  
    "code": 200,  
    "data": ["468445748065865728"],  
    "msg": "success",  
    "success": true  
}
```
### 14. 移除或退出用户的团队removeOrExitOfTeam

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | RemoveOrExitOfTeam |
| module | 模块  | 是   | string | target |
| params | 移除用户身份信息 | 是   | object | {id: "603178893817561088", subId: "519153922967998464"} |

**请求参数**  
```json
{
    "module": "target",
    "action": "RemoveOrExitOfTeam",
    "params": {
        "id": "603178893817561088",
        "subId": "519153922967998464"
    }
}
```
**响应示例**
```json
{  
    "code": 200,  
    "data": true,  
    "msg": "success",  
    "success": true  
}
```
### 15. 根据ID查询用户信息queryTargetById

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | QueryTargetById |
| module | 模块  | 是   | string | target |
| params | 用户信息 | 是   | object | 见下示例 |

**请求参数**  
```json
{
  "module": "target",
  "action": "QueryTargetById",
  "params": {
    "ids": [
      "445967867377225728",
      "499615987113529344",
      "446719087343702016",
      "445720097923928064"
    ],
    "page": {
      "offset": 0,
      "limit": 65535,
      "filter": ""
    }
  }
}
```
**响应示例**
```json
{
  "code": 200,
  "data": {
    "limit": 65535,
    "total": 8,
    "result": [
      {
        "id": "445720097923928064",
        "name": "豪波安全科技有限公司",
        "code": "91330100727601552N",
        "remark": "豪波安全科技有限公司",
        "typeName": "单位",
        "belongId": "445720097923928064",
        "storeId": "505510432631558144",
        "status": 1,
        "createUser": "445719016259063808",
        "updateUser": "447079121533669376",
        "version": "13",
        "createTime": "2023-05-14 22:52:32.426",
        "updateTime": "2024-07-09 09:27:24.362"
      }
    ]
  },
  "msg": "success",
  "success": true
}
```

### 16. 模糊查找用户searchTargets

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | SearchTargets |
| module | 模块  | 是   | string | target |
| params | 子用户信息 | 是   | object | 见下示例 |

**请求参数**  
```json
{
  "module": "target",
  "action": "SearchTargets",
  "params": {
    "id": {
      "name": "183343463",
      "typeNames": ["人员"],
      "page": {
        "offset": 0,
        "limit": 65535,
        "filter": ""
      }
    }
  }
}
```

**响应示例**
```json
{
  "code": 200,
  "data": {
    "limit": 65535
  },
  "msg": "success",
  "success": true
}
```
### 17. 根据ID查询子用户信息querySubTargetById

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | QuerySubTargetById |
| module | 模块  | 是   | string | target |
| params | 子用户信息 | 是   | object | 见下示例 |

**请求参数**  
```json
{
  "module": "target",
  "action": "QuerySubTargetById",
  "params": {
    "id": "501900873509773312",
    "subTypeNames": ["单位"],
    "page": {
      "offset": 0,
      "limit": 30,
      "filter": "16"
    }
  }
}
```
**响应示例**
```json
{
  "code": 200,
  "data": {
    "limit": 30,
    "total": 3,
    "result": [
      {
        "id": "520195672977313792",
        "name": "平湖市财政局",
        "code": "113304820025628161",
        "remark": "平湖市财政局",
        "typeName": "单位",
        "belongId": "520195672977313792",
        "storeId": "585827042348638208",
        "status": 1,
        "createUser": "512590255845675008",
        "updateUser": "512590255845675008",
        "version": "16",
        "createTime": "2023-12-06 11:11:53.207",
        "updateTime": "2024-06-20 10:27:17.674"
      },
      {
        "id": "524968766380052480",
        "name": "嘉兴市南湖区教育体育局",
        "code": "11330402MB1686745D",
        "remark": "区教育体育局贯彻落实党中央和省委、市委、区委关于教育体育工作的方针政策和决策部署，在履行职责过程中坚持和加强党对教育体育工作的集中统一领导。",
        "typeName": "单位",
        "belongId": "524968766380052480",
        "storeId": "585815855376510976",
        "status": 1,
        "createUser": "524963399260573696",
        "updateUser": "524963399260573696",
        "version": "4",
        "createTime": "2023-12-19 15:18:27.353",
        "updateTime": "2024-06-20 11:59:46.856"
      },
      {
        "id": "552572940416331776",
        "name": "公益仓受赠单位",
        "code": "91330100716105852F",
        "remark": "公益仓受赠方",
        "typeName": "单位",
        "belongId": "552572940416331776",
        "storeId": "505510432631558144",
        "status": 1,
        "createUser": "445935032910090240",
        "updateUser": "445935032910090240",
        "version": "7",
        "createTime": "2024-03-04 19:27:35.304",
        "updateTime": "2024-06-20 14:43:42.865"
      }
    ]
  },
  "msg": "success",
  "success": true
}

```
### 18. 查询用户加入的用户queryJoinedTargetById

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | QueryJoinedTargetById |
| module | 模块  | 是   | string | target |
| params | 查询参数 | 是   | object | 见下示例|
| id  | ID  | 是   | string | 464369144951869440 |
| page | 分页信息 | 是   | object | {offset: 0, limit: 1, filter: ""} |
| filter | 过滤条件 | 否   | string | ""  |
| limit | 每页限制 | 是   | integer | 1   |
| offset | 偏移量 | 是   | integer | 0   |
| typeNames | 类型名称数组 | 是   | array | \["组织群"\] |
| 0   | 类型名称 | 是   | string | "组织群" |

**请求参数**  
```json
{
  "action": "QueryJoinedTargetById",
  "module": "target",
  "params": {
    "id": "464369144951869440",
    "typeNames": ["组织群"],
    "page": {
      "offset": 0,
      "limit": 1,
      "filter": ""
    }
  },
  "id": "464369144951869440",
  "page": {
    "offset": 0,
    "limit": 1,
    "filter": ""
  },
  "filter": "",
  "limit": 1,
  "offset": 0,
  "typeNames": ["组织群"]
}

```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "limit": 1
    },
    "msg": "success",
    "success": true
}
```

### 19. 查询组织权限树queryAuthorityTree

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | QueryAuthorityTree |
| module | 模块  | 是   | string | target |
| params | 组织权限树 | 是   | object |见下示例 |

**请求参数**  
```json
{
    "module": "target",
    "action": "QueryAuthorityTree",
    "params": {
        "id": "550271312996741120",
        "page": {
            "offset": 0,
            "limit": 65535,
            "filter": ""
        }
    }
}
```

**响应示例**
```json
{
    "code": 200,
    "data": {
        "id": "361356410044420096",
        "public": true,
        "belongId": "358221262448889856",
        "name": "超级管理权",
        "code": "super-auth",
        "remark": "所有权权限。",
        "status": 100,
        "createUser": "358221262448889856",
        "updateUser": "358221262448889856",
        "version": "2",
        "createTime": "2023-05-14 16:47:07.775",
        "updateTime": "2023-05-14 16:47:07.942",
        "nodes": [
            {
                "id": "361356410623234048",
                "public": true,
                "parentId": "361356410044420096",
                "belongId": "358221262448889856",
                "name": "关系管理权",
                "code": "relation-auth",
                "remark": "用户关系管理权限。",
                "status": 100,
                "createUser": "358221262448889856",
                "updateUser": "358221262448889856",
                "version": "1",
                "createTime": "2023-05-14 16:47:07.995",
                "updateTime": "2023-05-14 16:47:07.995",
                "nodes": [
                    {
                        "id": "556549058882310144",
                        "public": true,
                        "parentId": "361356410623234048",
                        "shareId": "550271312996741120",
                        "belongId": "550271312996741120",
                        "name": "捐赠物资审核权",
                        "code": "JZWZSPQ",
                        "remark": "捐赠物资审核权",
                        "status": 1,
                        "createUser": "445899863230648320",
                        "updateUser": "445899863230648320",
                        "version": "2",
                        "createTime": "2024-03-15 18:47:15.819",
                        "updateTime": "2024-03-15 18:47:35.866"
                    }
                ]
            },
        ]
    },
    "msg": "success",
    "success": true
}
```

### 20. 查询拥有权限的成员queryAuthorityTargets

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | QueryAuthorityTargets |
| module | 模块  | 是   | string | target |
| params | 查询拥有权限的成员id | 是   | object | {id: "519162457017683968", subId: "445708344880140288"} |

**请求参数** 
```json 
{
    "module": "target",
    "action": "QueryAuthorityTargets",
    "params": {
        "id": "519162457017683968",
        "subId": "445708344880140288"
    }
}
```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "limit": 10000,
        "total": 39,
        "result": [
            {
                "id": "585431216862400512",
                "name": "张隽瑜",
                "code": "13957083620",
                "remark": "笑一笑十年少",
                "typeName": "人员",
                "belongId": "585431216862400512",
                "storeId": "487319397317349376",
                "status": 1,
                "createUser": "585431216862400512",
                "updateUser": "585431216862400512",
                "version": "2",
                "createTime": "2024-06-03 11:34:38.886",
                "updateTime": "2024-06-20 15:51:49.407"
            },
            {
                "id": "593515604170919936",
                "name": "徐伟丹",
                "code": "13567615772",
                "remark": "一切都是最好的安排",
                "typeName": "人员",
                "belongId": "593515604170919936",
                "storeId": "487319397317349376",
                "status": 1,
                "createUser": "593515604170919936",
                "updateUser": "593515604170919936",
                "version": "1",
                "createTime": "2024-06-25 18:59:07.021",
                "updateTime": "2024-06-25 18:59:07.021"
            }
        ]
    },
    "msg": "success",
    "success": true
}

```
### 21. 查询组织身份queryTargetIdentitys

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | QueryTargetIdentitys |
| module | 模块  | 是   | string | target |
| params | 查询组织身份id | 是   | object | 见下示例 |

**请求参数**  
```json
{
    "module": "target",
    "action": "QueryTargetIdentitys",
    "params": {
        "id": "588319250695991296",
        "page": {
            "offset": 0,
            "limit": 65535,
            "filter": ""
        }
    }
}

```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "limit": 65535,
        "total": 1,
        "result": [
            {
                "id": "588319250956038144",
                "name": "管理员",
                "code": "super-auth",
                "remark": "系统生成的对应组织的超管身份",
                "authId": "361356410044420096",
                "shareId": "588319250695991296",
                "belongId": "576422749229158400",
                "status": 1,
                "createUser": "445878332773502976",
                "updateUser": "445878332773502976",
                "version": "1",
                "createTime": "2024-06-11 10:50:39.872",
                "updateTime": "2024-06-11 10:50:39.872"
            }
        ]
    },
    "msg": "success",
    "success": true
}

```
### 22. 查询赋予身份的用户queryIdentityTargets

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | QueryIdentityTargets |
| module | 模块  | 是   | string | target |
| params | 查询赋予身份的用户 | 是   | object | 见下示例 |

**请求参数**  
```json
{
    "module": "target",
    "action": "QueryIdentityTargets",
    "params": {
        "id": "603178893821755392",
        "page": {
            "offset": 0,
            "limit": 65535,
            "filter": ""
        }
    }
}
```

**响应示例**
```json
{
    "code": 200,
    "data": {
        "limit": 65535,
        "total": 2,
        "result": [
            {
                "id": "445888887320088576",
                "name": "郝润宇",
                "code": "13834082735",
                "remark": "keep on",
                "typeName": "人员",
                "belongId": "445888887320088576",
                "storeId": "581360916038299648",
                "status": 1,
                "createUser": "445888887320088576",
                "updateUser": "445888887320088576",
                "version": "5",
                "createTime": "2023-05-15 10:03:14.954",
                "updateTime": "2024-06-19 23:32:15.416"
            },
            {
                "id": "445899863230648320",
                "name": "彭斐平",
                "code": "15258785613",
                "remark": "JuA",
                "typeName": "人员",
                "public": true,
                "belongId": "445899863230648320",
                "storeId": "581360916038299648",
                "status": 1,
                "createUser": "445899863230648320",
                "updateUser": "445899863230648320",
                "version": "9",
                "createTime": "2023-05-15 10:46:51.815",
                "updateTime": "2024-07-22 15:15:43.920"
            }
        ]
    },
    "msg": "success",
    "success": true
}

```
### 23. 查询赋予的身份queryGivedIdentitys

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | QueryGivedIdentitys |
| module | 模块  | 是   | string | target |
| params | 查询赋予的身份 | 是   | object | {}  |

**请求参数**  
```json
{
    "module": "target",
    "action": "QueryIdentityTargets",
    "params": {}
}

```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "limit": 10000,
        "total": 35,
        "result": [
            {
                "id": "445888887345254400",
                "identityId": "445888887341060096",
                "targetId": "445888887320088576",
                "status": 1,
                "createUser": "445888887320088576",
                "updateUser": "445888887320088576",
                "version": "1",
                "createTime": "2023-05-15 10:03:14.958",
                "updateTime": "2023-05-15 10:03:14.958",
                "identity": {
                    "id": "445888887341060096",
                    "name": "管理员",
                    "code": "super-auth",
                    "remark": "系统生成的对应组织的超管身份",
                    "authId": "361356410044420096",
                    "shareId": "445888887320088576",
                    "belongId": "445888887320088576",
                    "status": 1,
                    "createUser": "445888887320088576",
                    "updateUser": "445888887320088576",
                    "version": "2",
                    "createTime": "2023-05-15 10:03:14.957",
                    "updateTime": "2024-07-22 15:54:47.923"
                }
            },
            {
                "id": "512720310978613248",
                "identityId": "499314551376977920",
                "targetId": "445888887320088576",
                "status": 1,
                "createUser": "445872805339336704",
                "updateUser": "445888887320088576",
                "version": "2",
                "createTime": "2023-11-15 20:07:28.021",
                "updateTime": "2023-12-30 09:40:17.000",
                "identity": {
                    "id": "499314551376977920",
                    "name": "管理员",
                    "code": "super-auth",
                    "remark": "系统生成的对应组织的超管身份",
                    "authId": "361356410044420096",
                    "shareId": "499314551343423488",
                    "belongId": "464368384847515648",
                    "status": 1,
                    "createUser": "445697872881651712",
                    "updateUser": "445888887320088576",
                    "version": "3",
                    "createTime": "2023-10-09 20:17:45.865",
                    "updateTime": "2023-12-30 09:40:18.000"
                }
            }
        ]
    },
    "msg": "success",
    "success": true
}

```
### 24. 查询组织身份集queryTeamIdentitys

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | QueryTeamIdentitys |
| module | 模块  | 是   | string | target |
| params | 组织身份集 | 是   | object | 见下参数 |

**请求参数**  
```json
{
    "module": "target",
    "action": "QueryTeamIdentitys",
    "params": {
        "id": "445989676428431360",
        "page": {
            "offset": 0,
            "limit": 65535,
            "filter": ""
        }
    }
}
```

**响应示例**
```json
{  
    "code": 200,  
    "data":{"limit":65535},

    "msg": "success",  
    "success": true  
}
```
## **Work:**

### 1.创建办事定义createWorkDefine

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | CreateWorkDefine |
| module | 模块  | 是   | string | work |
| params | 参数  | 是   | object | 下见  |

params结构

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| applicationId | 应用申请ID | 否   | string | "573944199842516993" |
| applyAuth | 申请权限 | 否   | string | "0" |
| applyAuths | 申请权限集合 | 否   | string[] | ["0"] |
| code | 代码  | 否   | string | "DJ" |
| name | 名称  | 否   | string | "登记" |
| remark | 描述  | 否   | string | "登记办事" |
| shareId | 分享ID | 否   | string | "571748758350606336" |

**请求参数**
```json
{
    "action": "CreateWorkDefine",
    "module": "work",
    "params": {
        "name": "登记",
        "code": "DJ",
        "applyAuths": ["0"],
        "remark": "登记办事",
        "applyAuth": "0",
        "applicationId": "573944199842516993",
        "shareId": "571748758350606336"
    }
}
```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "id": "603180250003861504",
        "applicationId": "573944199842516993",
        "shareId": "571748758350606336",
        "belongId": "571748758350606336",
        "sourceId": "603180250003861504",
        "name": "登记",
        "code": "DJ",
        "remark": "登记办事",
        "status": 1,
        "createUser": "468445748065865728",
        "updateUser": "468445748065865728",
        "version": "1",
        "createTime": "2024-07-22 11:02:58.152",
        "updateTime": "2024-07-22 11:02:58.152"
    },
    "msg": "success",
    "success": true
}

```
### 2、创建办事实例(启动办事)createWorkInstance

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | CreateWorkInstance |
| module | 模块  | 是   | string | work |
| params | 参数  | 是   | object | 下见  |

params结构

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| applyId | 申请ID | 否   | String | "571748758350606336" |
| content | 内容  | 否   | String | ""  |
| contentType | 内容类型 | 否   | String | "Text" |
| defineId | 定义ID | 否   | String | "596708248103555072" |
| gateways | 网关信息 | 否   | String | "[]" |
| hook | 钩子  | 否   | String | ""  |
| taskId | 任务ID | 否   | String | "0" |
| title | 标题  | 否   | String | "并行办事" |

**请求参数**
```json
{
    "action": "CreateWorkInstance",
    "module": "work",
    "params": {
        "hook": "",
        "taskId": "0",
        "title": "并行办事",
        "defineId": "596708248103555072",
        "applyId": "571748758350606336",
        "content": "",
        "contentType": "Text",
        "data": "…",
        "gateways": []
    }
}

```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "id": "603235457815465984",
        "title": "并行办事",
        "defineId": "596708248103555072",
        "contentType": "Text",
        "data": "……",
        "applyId": "571748758350606336",
        "shareId": "571748758350606336",
        "belongId": "571748758350606336",
        "gateways": "[]",
        "status": 1,
        "createUser": "468445748065865728",
        "updateUser": "468445748065865728",
        "version": "1",
        "createTime": "2024-07-22 14:42:20.716",
        "updateTime": "2024-07-22 14:42:20.716"
    },
    "msg": "success",
    "success": true
}
```

### 3、创建节点网关信息createWorkGeteway

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | QueryWorkGateways |
| module | 模块  | 是   | string | work |
| params | 参数  | 是   | object | {defineId: "596662114198884352", targetId: "571748758350606336"} |

**请求参数**
```json
{
    "action": "QueryWorkGateways",
    "module": "work",
    "params": {
        "defineId": "596662114198884352",
        "targetId": "571748758350606336"
    }
}
```

**响应示例**
```json
{
    "code":200,
    "data":{},
    "msg":"success",
    "success":true
}
```
### 4、删除办事定义deleteWorkDefine

**接口类型**

http

**接口地址**

request

**请求类型**

POST


**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | "DeleteWorkDefine" |
| module | 模块  | 是   | string | work |
| params | 参数  | 是   | object | {id:<br><br>"585855485459181568"<br><br>} |

**请求参数**
```json
{
    "action": "DeleteWorkDefine",
    "module": "work",
    "params": {
        "id": "585855485459181568"
    }
}
```
**响应示例**
```json
{
    "code":200,
    "data":true,
    "msg":"success",
    "success":true
}
```
### 5、删除节点网关deleteWorkGateway

**接口类型**

http

**接口地址**

request

**请求类型**

POST


**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | DeleteWorkGateway |
| module | 模块  | 是   | string | work |
| params | 参数  | 是   | object | {id: "574256894621917184"} |

**请求参数**
```json
{
    "action": "DeleteWorkGateway",
    "module": "work",
    "params": {
        "id": "574256894621917184"
    }
}
```
**响应示例**
```json
{
    "code":200,
    "data":true,
    "msg":"success",
    "success":true
}
```

### 6、查询办事定义queryWorkDefine

**接口类型**

http

**接口地址**

request

**请求类型**

POST


**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | QueryWorkDefine |
| module | 模块  | 是   | string | work |
| params | 参数  | 是   | object | 见下示例 |

**请求参数**
```json
{
    "action": "QueryWorkDefine",
    "module": "work",
    "params": {
        "id": "567724031298646017",
        "belongId": "445708344880140288",
        "page": {
            "offset": 0,
            "limit": 65535,
            "filter": ""
        }
    }
}
```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "limit": 65535,
        "total": 6,
        "result": [
            {
                "id": "590484952584429568",
                "rule": "{\"applyType\":\"财务\",\"hasGateway\":false,\"allow\":true,\"allowInitiate\":true}",
                "applicationId": "567724031298646017",
                "shareId": "445708344880140288",
                "belongId": "445708344880140288",
                "sourceId": "561120362121814016",
                "name": "月结账",
                "code": "56",
                "remark": "用于计提折旧、发起结账",
                "status": 1,
                "createUser": "520588074321846272",
                "updateUser": "520588074321846272",
                "version": "1",
                "createTime": "2024-06-17 10:16:23.377",
                "updateTime": "2024-06-17 10:16:23.377"
            }
        ]
    },
    "msg": "success",
    "success": true
}
```

### 7、查询办事网关节点信息queryWorkGateways

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | QueryWorkGateways |
| module | 模块  | 是   | string | work |
| params | 参数  | 是   | object | {defineId: "571259477748228096", targetId: "571250874295394304"} |

**请求参数**
```json
{
    "action": "QueryWorkGateways",
    "module": "work",
    "params": {
        "defineId": "571259477748228096",
        "targetId": "571250874295394304"
    }
}
```
**响应示例**
```json
{
    "code":200,
    "data":{},
    "msg":"success",
    "success":true
}
```
### 8、查询办事节点queryWorkNodes

**接口类型**

http

**接口地址**

request

**请求类型**

POST


**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | QueryWorkNodes |
| module | 模块  | 是   | string | work |
| params | 参数  | 是   | object | {id: "596662114198884352"} |

**请求参数**
```json
{
    "action": "QueryWorkNodes",
    "module": "work",
    "params": {
        "id": "596662114198884352"
    }
}
```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "id": "603195262667763712",
        "code": "node_20e09ca3-d57e-4173-8aa5-9bf1f531ea4b",
        "type": "起始",
        "name": "办事发起",
        "children": {
            "id": "603195262667763713",
            "code": "node_d792176b-ca41-4c5f-b2b4-836c6c532bd6",
            "type": "审核",
            "name": "审核对象",
            "children": {
                "id": "603195262667763714",
                "code": "node_f109d8cf-a66c-4a9c-b894-f44aedd11962",
                "type": "归档",
                "name": "归档",
                "num": 1,
                "destType": "身份",
                "resource": "{\"forms\":[],\"executors\":[],\"formRules\":[],\"printData\":{\"attributes\":[],\"type\":\"\"},\"print\":[],\"buttons\":[],\"primaryPrints\":[]}"
            },
            "num": 1,
            "destType": "身份",
            "destId": "571748758354800640",
            "destName": "[单位]公益组织2--管理员",
            "resource": "{\"forms\":[],\"executors\":[],\"formRules\":[],\"printData\":{},\"print\":[],\"buttons\":[],\"primaryPrints\":[]}"
        },
        "num": 1,
        "destType": "角色",
        "resource": "{\"forms\":[{\"id\":\"585845544212111361\",\"typeName\":\"主表\",\"allowAdd\":true,\"allowEdit\":false,\"allowSelect\":false}],\"executors\":[],\"formRules\":[],\"printData\":{\"attributes\":[],\"type\":\"\"},\"print\":[],\"buttons\":[],\"primaryPrints\":[]}"
    },
    "msg": "success",
    "success": true
}
```

### 9、查询待审核任务、抄送queryApproveTask

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | "QueryApproveTask" |
| module | 模块  | 是   | string | work |
| params | 参数  | 是   | object | {id: "0"} |

**请求参数**
```json
{
    "action": "QueryApproveTask",
    "module": "work",
    "params": {
         "id": "0"
    }
}
```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "result": [
            {
                "id": "603245990606163968",
                "title": "公益物资接收[[单位]公益组织1--捐赠物资接收审核管理员]",
                "approveType": "审核",
                "taskType": "事项",
                "count": 1,
                "identityId": "574614495490617344",
                "nodeId": "579238796080603137",
                "instanceId": "603245989930881024",
                "defineId": "574706254191140864",
                "shareId": "552572603894738944",
                "belongId": "552572603894738944",
                "applyId": "552572603894738944",
                "status": 1,
                "createUser": "468445748065865728",
                "updateUser": "468445748065865728",
                "version": "1",
                "createTime": "2024-07-22 15:24:11.930",
                "updateTime": "2024-07-22 15:24:11.930"
            }
        ]
    },
    "msg": "success",
    "success": true
}
```

### 10、查询下一节点信息queryNextNodes

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | "QueryNextNodes" |
| module | 模块  | 是   | string | work |
| params | 参数  | 是   | object | {id: "0"} |

**请求参数**
```json
{
    "module": "work",
    "action": "QueryNextNodes",
    "params": {
        "id": "606436053280231424"
    }
}

```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "result": [
            {
                "id": "606431855180439554",
                "rule": "[{\"nextId\":\"606431855180439555\"}]",
                "code": "node_430db10f-f047-4c1e-8c9b-0eda7cebe02c",
                "name": "审核对象",
                "count": 1,
                "defineId": "606425222110965760",
                "destId": "603178893821755392",
                "destName": "[单位]测试单位2--管理员测试",
                "destType": "身份",
                "nodeType": "审核",
                "resource": "{\"forms\":[],\"executors\":[],\"formRules\":[],\"printData\":{},\"print\":[],\"buttons\":[],\"primaryPrints\":[]}",
                "status": 1,
                "createUser": "445899863230648320",
                "updateUser": "445899863230648320",
                "version": "1",
                "createTime": "2024-07-31 10:23:41.235",
                "updateTime": "2024-07-31 10:23:41.235"
            }
        ]
    },
    "msg": "success",
    "success": true
}
```

### 11、办事节点审核approvalTask

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | ApprovalTask |
| module | 模块  | 是   | string | work |
| params | 参数  | 是   | object | {id: "596345295437180928", status: 200, comment: "",…} |

**请求参数**
```json
{
    "action": "ApprovalTask",
    "module": "work",
    "params": {
        "id": "596345295437180928",
        "status": 200,
        "comment": "",
        "data": "{\"data\":{\"568737626299981825\":[{\"rules\":[], \"gateways\": \"[]\"}]}}"
    }
}

```
**响应示例**
```json
{
    "code": 200,
    "data": true,
    "msg": "success",
    "success": true
}
```

## **Object:**

### 1、获取对象数据objectGet

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | “Get” |
| belongId |     | 否   | string | "468445748065865728" |
| flag |     | 否   | String | "target-cache" |
| module | 模块  | 是   | string | object |
| params | 参数  | 是   | object | "target-cache" |
| relations |     | 否   | string | [ ] |
| targetId |     | 是   | string | "468445748065865728" |

**请求参数**
```json
{
    "action": "Get",
    "belongId": "468445748065865728",
    "flag": "target-cache",
    "module": "Object",
    "params": "target-cache",
    "relations": [],
    "targetId": "468445748065865728"
}
```

**响应示例**
```json
{
    "code": 200,
    "data": {
        "status": 1,
        "session": {
            "469072370901061632_469072370901061632": {
                "chatRemark": "畅所欲言",
                "lastMessage": {
                    "shareId": "469072370901061632",
                    "version": 1,
                    "updateUser": "445935032910090240",
                    "typeName": "文本",
                    "content": "^!:JEEZReJxTNXXKT8pSNXVRNXdSNTJKyk+pBFKqxo5A0hAIQBwjZyCZm5pXkpmfVwyVNXUC63EBAAZGD88*asYB7",
                    "fromId": "445935032910090240",
                    "name": null,
                    "status": 1,
                    "createTime": "2023-11-24 16:32:43.656",
                    "updateTime": "2023-11-24 16:32:43.656",
                    "createUser": "445935032910090240",
                    "id": "515927760842133505",
                    "comments": [],
                    "toId": "469072370901061632",
                    "belongId": "445935032910090240",
                    "isDeleted": false
                },
                "lastMsgTime": 1700814763337,
                "fullId": "469072370901061632_469072370901061632",
                "mentionMe": false,
                "noReadCount": 0,
                "isToping": false,
                "chatName": "大白交流群",
                "labels": []
            }
        },
        "pages": {
            
            "445708344880140288_521798581301153792": {
                "fullId": "445708344880140288_521798581301153792",
                "tags": ["常用"]
            }
        },
        "homeConfig": {
            "lastSpaceId": "445708344880140288"
        },
        "updateTime": "2023-09-15 09:00:05.215",
        "isDeleted": false,
        "labels": [],
        "name": null,
        "createUser": "468445748065865728",
        "updateUser": "468445748065865728",
        "version": 1,
        "createTime": "2023-09-15 09:00:05.215",
        "id": "target-cache"
    },
    "msg": "成功",
    "success": true
}
```

### 2、变更对象数据objectSet

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | “Set” |
| belongId |     | 否   | string | "468445748065865728" |
| flag |     | 否   | String | "target-cache.session.468445748065865728_519153922967998464" |
| module | 模块  | 是   | string | work |
| params | 参数  | 是   | object |     |

**请求参数**
```json
{
    "action": "Set",
    "belongId": "468445748065865728",
    "flag": "target-cache.session.468445748065865728_519153922967998464",
    "module": "Object",
    "params": {
        "key": "target-cache.session.468445748065865728_519153922967998464",
        "setData": {
            "data": {
                "fullId": "468445748065865728_519153922967998464",
                "chatName": "演示用户",
                "chatRemark": "keep",
                "isToping": false,
                "labels": [],
                "lastMsgTime": 1721634497940,
                "mentionMe": false,
                "noReadCount": 0,
                "recently": true
            },
            "operation": "replaceAll"
        }
    },
    "relations": [],
    "targetId": "468445748065865728"
}

```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "update": true
    },
    "msg": "成功",
    "success": true
}

```
## **其它**

### 1、根据ID查询实体信息queryEntityById

**接口类型**

http

**接口地址**

request

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | " QueryEntityById" |
| module | 模块  | 是   | string | “core” |
| params | 参数  | 是   | object | {id: "445720097923928064"} |

**请求参数**
```json
{
    "action": "QueryEntityById",
    "module": "core",
    "params": {
        "id": "445720097923928064"
    }
}
```

**响应示例**
```json
{
    "code": 200,
    "data": {
        "id": "445720097923928064",
        "name": "豪波安全科技有限公司",
        "code": "91330100727601552N",
        "remark": "豪波安全科技有限公司，成立于2001年，是一家……”。",
        "icon": " {\"size\":156768,\"name\\……",
        "belongId": "445720097923928064",
        "typeName": "单位",
        "status": 1,
        "createUser": "445719016259063808",
        "updateUser": "447079121533669376",
        "version": "13",
        "createTime": "2023-05-14 22:52:32.426",
        "updateTime": "2024-07-09 09:27:24.362"
    },
    "msg": "success",
    "success": true
}
```

### 2、获取对象数据diskInfo

**接口类型**

http

**接口地址**

request

**请求类型**

POST


**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | "info" |
| belongId |     | 是   | String | "445708344880140288" |
| flag |     | 是   | String | "diskInfo" |
| module | 模块  | 是   | string | “Disk” |
| params | 参数  | 是   | object | { } |
| relations |     | 是   |     | "445708344880140288" |
| targetId |     | 是   |     | "445708344880140288" |

**请求参数**
```json
{
    "action": "QueryEntityById",
    "module": "core",
    "params": {
         "id": "445720097923928064"
    }
}
```
**响应示例**
```json
{
    "code": 200,
    "data": {
        "id": "445720097923928064",
        "name": "豪波安全科技有限公司",
        "code": "91330100727601552N",
        "remark": "豪波安全科技有限公司，成立于2001年，是一家……”。",
        "icon": " {\"size\":156768,\"name\\……",
        "belongId": "445720097923928064",
        "typeName": "单位",
        "status": 1,
        "createUser": "445719016259063808",
        "updateUser": "447079121533669376",
        "version": "13",
        "createTime": "2023-05-14 22:52:32.426",
        "updateTime": "2024-07-09 09:27:24.362"
    },
    "msg": "success",
    "success": true
}
```

### 3、桶操作bucketOpreate

**接口类型**

http

**接口地址**

request

**请求类型**

POST



**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | “Operate” |
| belongId |     | 否   | string | "468445748065865728" |
| flag |     | 否   | string | bucketOpreate |
| module | 模块  | 是   | string | “work” |
| params | 参数  | 是   | object | {key: "NTU2MDU4ODIyOTYwMDk1MjMz", operate: "List"} |
| relations |     | 否   | string | [ ] |
| targetId | 目标id |     | string | "468445748065865728" |

**请求参数**
```json
{
    "action": "Operate",
    "belongId": "468445748065865728",
    "flag": "-bucketOpreate",
    "module": "Bucket",
    "params": {
        "key": "NTU2MDU4ODIyOTYwMDk1MjMz",
        "operate": "List"
    },
    "relations": [],
    "targetId": "468445748065865728"
}

```
**响应示例**
```json
{
    "code": 200,
    "data": [],
    "msg": "成功",
    "success": true
}
```
### 4、请求一个内核授权方法auth
**接口类型**

http

**接口地址**

auth

**请求类型**

POST

**输入参数**

| 名称  | 说明  | 是否必填 | 数据类型 | 举例  |
| --- | --- | --- | --- | --- |
| action | 方法  | 是   | string | "Login" |
| module | 模块  | 是   | string | "auth" |
| params | 参数  | 是   | object | {account: "15212345678", password: "P123456."} |

**请求参数**
```json
{
    "module": "auth",
    "action": "Login",
    "params": {
        "account": "15212345678",
        "password": "P123456."
    }
}

```

**响应示例**
```json
{
    "code": 200,
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MjIzOTQ3MTksImlhdCI6MTcyMjM4NzUxOSwidXNlcklkIjoiNDQ1ODk5ODYzMjMwNjQ4MzIwIn0.******UhpRWng8RccCoXyoXZPIZz1EarXswH805m******",
        "expiresIn": 7200,
        "author": "realVeer",
        "license": "powered by jwt",
        "tokenType": "bearer",
        "target": {
            "id": "445899863230648320",
            "name": "******",
            "code": "15212345678",
            "remark": "JuA",
            "typeName": "人员",
            "public": true,
            "belongId": "445899863230648320",
            "storeId": "581360916038299648",
            "status": 1,
            "createUser": "445899863230648320",
            "updateUser": "445899863230648320",
            "version": "9",
            "createTime": "2023-05-15 10:46:51.815",
            "updateTime": "2024-07-22 15:15:43.920",
            "team": {
                "id": "445899863251619841",
                "name": "******",
                "code": "15212345678",
                "targetId": "445899863230648320",
                "status": 1,
                "createUser": "445899863230648320",
                "updateUser": "445899863230648320",
                "version": "4",
                "createTime": "2023-05-15 10:46:51.819",
                "updateTime": "2024-07-22 15:15:43.921"
            }
        }
    },
    "msg": "success",
    "success": true
}

```
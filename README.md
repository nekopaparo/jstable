|版本|說明|更新時間|
|---|---|---|
|v.0.0.1|初版(產生表單、換頁)|2024-10-30|
|v.0.0.2|新增排序|2024-10-31|

---

``` html
<table id="jstable"></table>
```
``` js
var columns = [
    { 'data': 'name', 'title': '姓名' }
    { 'data': 'age', 'title': '年紀' }
];
var data = [
    { 'name': '貓貓', 'age': 3 },
    { 'name': '兔兔', 'age': 2 },
    { 'name': '狗狗', 'age': 5 }
];
```
``` js
// table
var table = document.getElementById("jstable");
// 宣告
var connect = jstable.createConnection(table);
// 設定
connect.set({
    "column": columns,
    "data": dataTable,
    "pageSize": 2
});
// 建表
connect.load();
// 換頁
connect.page = 2;
// 排序
connect.order_sql("age DESC, name");
```
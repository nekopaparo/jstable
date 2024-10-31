/*!
 * jstable JavaScript Library v.0.0.2
 *
 * Date: 2024-10-31
 * 
 * 1. 2024-10-30 基本功能 : 頁數設定、換頁
 * 2. 2024-10-31 新增排序
 */
/*
// 建立控制
const tableConn = jstable.createConnection(document.querySelector('table'));

// 設定表格
tableConn.set({
    'columns': [
        '姓名',
        {
            'data': '年紀',
            'title': 'age'
        }
    ],
    'data': [
        {
            '姓名': '貓貓',
            '年紀': 3
        },
        ['兔兔', 2],
        {
            '姓名': '狗狗',
            '年紀': 5
        }
    ],
    "rowCallback": function(row, fields, index) {
        // row          = tr
        // fields[i].target  = td;
        // fields[i].data   = 欄位的值
        // index        = row_index
    },
    'pageSize': 2,          // 顯示數量
});

// 排序
connect.order_sql("年紀")
*/
(function (global, factory) {
    "use strict";
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = factory();
    }
    else {
        global["jstable"] = factory();
    }
}(this, function () {
    //#region 元件相關
    function get_thead(table) {
        if (!table) return null;
        var thead = table.getElementsByTagName("thead")[0];
        return thead ? thead : table.appendChild(document.createElement("thead"));
    }
    function get_tbody(table) {
        if (!table) return null;
        var tbody = table.getElementsByTagName("tbody")[0];
        return tbody ? tbody : table.appendChild(document.createElement("tbody"));
    }
    function add_tr(element) {
        return element.appendChild(document.createElement("tr"));
    }
    function add_th(element) {
        return element.appendChild(document.createElement("th"));
    }
    function add_td(element) {
        return element.appendChild(document.createElement("td"));
    }    
    //#endregion 元件相關
    
    //#region 基本資料
    function data_init(target) {
        var _init = {
            "data" : [],             
            "target" : target, // thead/tbody
            "cache" : [],       // 綁定用
            get size() {
                return _init.data.length; 
            }
        };
        return _init;
    }
    function data_clear(data) {
        data.target.innerHTML = '';
        data.cache = [];
    }
    function data_order(colname, by) {
        return {
            "colname" : colname,
            "by" : typeof by != "string" 
            || by.toUpperCase() != "DESC" ? "ASC" : "DESC"
        };
    }
    function sql_to_order(sql) {
        var order = sql.split(",");
        for(var i = 0; i < order.length; ++i) {
            var values = order[i].split(" ");
            if (values.length > 2) { return []; }
            order[i] = data_order(values[0], values[1]);
        }
        return order;
    }
    function order_to_sql(order) {
        var sql = [];
        order.forEach(function (d, index) {
            sql.push(d.colname + " " + d.by);
        })
        return sql.join(", ");
    }
    function jstable_init(table) {
        var jstable_data = {
            "table" : table,             
            "column" : data_init(get_thead(table)),
            "row" : data_init(get_tbody(table)),
            "Page" : 1, // 目前頁數
            "PageSize" : 10, // 每頁顯示數量
            "order" : [], // 排序用
            "fnRowCallback" : function (row, fields, index) {
                fields.forEach(function(field) {
                    field.target.innerHTML = field.data;
                });
            },
            get rowCallback() {
                return jstable_data.fnRowCallback;
            },
            set rowCallback(value) {
                if (typeof value == "function") {
                    jstable_data.fnRowCallback = value;
                }
            },
            get page() {
                return jstable_data.Page;
            },
            set page(value) {
                value = parseInt(value);
                if (!isNaN(value)) {
                    if (value < 1) {
                        jstable_data.Page = jstable_data.totalPage;
                    }
                    else if (value > jstable_data.totalPage) {
                        jstable_data.Page = 1;
                    }
                    else {
                        jstable_data.Page = value;
                    }
                }
            },
            get pageSize() {
                return jstable_data.PageSize;
            },
            set pageSize(value) {
                value = parseInt(value);
                if (!isNaN(value) && value > 0 && value <= jstable_data.row.size) {
                    jstable_data.PageSize = value;
                    jstable_data.Page = 1;
                }
            },
            get totalPage() {
                return Math.ceil(jstable_data.row.size / jstable_data.PageSize);
            }
        };
        return Connection.create(jstable_data);
    }
    //#endregion 基本資料
    
    //#region 欄位相關
    function get_col_title(col_data) {
        return col_data ? typeof col_data == "string" ? col_data
                    : col_data["title"] ? col_data["title"] 
                        : col_data["data"] : null;
    }
    function get_colnames(column) {
        var colnames = [];
        if (column && column.data) {
            column.data.forEach(function (col_data) {
                colnames.push(
                    col_data ? typeof col_data == "string" ? col_data
                        : col_data["data"] : null
                );
            });
        }
        return colnames;
    }
    //#endregion 欄位相關
    
    // 資料綁定 
    const BIND = {
        // 綁定
        "link": function (bind, target, data) {
            if (Array.isArray(bind)) {
                bind.push({
                    "target": target,
                    "data": data
                });
            }
        },
        // 移除綁定
        "remove": function (bind, target) {
            if (Array.isArray(bind)) {
                for (var i = 0; i < bind.length; ++i) {
                    if (bind[i].target == target || bind[i].data == target) {
                        bind.splice(i, 0);
                        return true;
                    }
                }
            }
            return false;
        },
        // 取得綁定
        "get": function (bind, target) {
            if (target && Array.isArray(bind)) {
                for (var i = 0; i < bind.length; ++i) {
                    if (bind[i].target == target || bind[i].data == target) {
                        return bind[i];
                    }
                }
            }
            return undefined
        }
    }
    // 核心
    const Connection = {
        "create" : function (jstable_data) {
            //#region 資料表建立
            function bulid() {
                // 建置標題
                bulid_col();
                // 頁數重置
                jstable_data.page = 1;
                // 建置內容
                bulid_row();
            }
            function bulid_col() {
                data_clear(jstable_data.column);
                var thRow = add_tr(jstable_data.column.target);
                jstable_data.column.data.forEach(function (col_data) {
                    var th = add_th(thRow);
                    // 名稱 colName
                    th.innerText = get_col_title(col_data);
                    // 綁定
                    BIND.link(jstable_data.column.cache, th, col_data);
                });
            }
            function bulid_row() {
                data_clear(jstable_data.row);
                var cols = get_colnames(jstable_data.column);
                for (var row_index = (jstable_data.page - 1) * jstable_data.pageSize; row_index < jstable_data.page * jstable_data.pageSize; ++row_index) {
                    if (row_index >= jstable_data.row.size) break;
                    var row_data = jstable_data.row.data[row_index];
                    var tbRow = add_tr(jstable_data.row.target);
                    // 資料綁定
                    BIND.link(jstable_data.row.cache, tbRow, row_data);
                    // callback
                    var cells = [];
                    for (var i = 0; i < cols.length; ++i) {
                        var td = add_td(tbRow);
                        var value = row_data[cols[i]];
                        td.innerText = (value == undefined && value == null) ? value : "";
                        BIND.link(cells, td, value);
                    }
                    // 自訂內容
                    jstable_data.rowCallback(tbRow, cells, row_index);
                }
            
            }
            //#endregion 資料表建立
            
            //#region 排序
            function get_order_index(colname) {
                for(var index = 0; index < jstable_data.order.length; ++index) {
                    if (jstable_data.order[index].colname == colname) {
                        return index;
                    }
                }
                return -1;
            }
            function order_sort() {
                var colnames = get_colnames(jstable_data.column);
                if (colnames.length == 0) { return; }
                jstable_data.row.data.sort(function(a, b) {
                    var compare = 0;
                    for(var i = 0; i < jstable_data.order.length; ++i) {
                        var index = colnames.indexOf(jstable_data.order[i].colname);
                        if (index < 0) { continue; }
                        var _a = Array.isArray(a) ? a[index] : a[jstable_data.order[i].colname];
                        var _b = Array.isArray(b) ? b[index] : b[jstable_data.order[i].colname];
                        if (_a > _b) {
                            compare = (jstable_data.order[i].by == 'DESC') ? -1 : 1;
                            break;
                        }
                        if (_a < _b) {
                            compare = (jstable_data.order[i].by == 'DESC') ? 1 : -1;
                            break;
                        }
                    }
                    return compare;
                });
            }
            function order_sql(sql) {
                jstable_data.order = sql_to_order(sql);
            }
            function get_order() {
                return order_to_sql(jstable_data.order)
            }
            function add_order(colname, by) {
                if (colname && get_colnames(jstable_data.column).indexOf(colname) >= 0) {
                    var data_order = data_order(colname, by);
                    var index = get_order_index(colname);
                    if (index >= 0) {
                        if (jstable_data.order[index].by != data_order.by) {
                            jstable_data.order[index].by = data_order.by;
                            return true;
                        }
                    }
                    else {
                        jstable_data.order.push(data_order);
                        return true;
                    }
                }
                return false;
            }
            function remove_order(colname) {
                var index = get_order_index(colname);
                if (index >= 0) {
                    jstable_data.order.splice(index, 1);
                    return true;
                }
                return false;
            }
            //#endregion
            
            // 設定
            function set(parameter) {
                if (!parameter) return;
                if (Array.isArray(parameter.column)) {
                    jstable_data.column.data = parameter.column;
                }
                if (Array.isArray(parameter.data)) {
                    jstable_data.row.data = parameter.data;
                }
                if (parameter.page) {
                    jstable_data.page = parameter.page;
                }
                if (parameter.pageSize) {
                    jstable_data.pageSize = parameter.pageSize;
                }
                if (parameter.rowCallback) {
                    jstable_data.rowCallback = parameter.rowCallback;
                }
            }
            // 使用者功能
            return Object.freeze({
                "load": bulid,
                "reload": bulid_row,
                "set": set,
                "get_order": get_order,
                "order": function (colname, by) {
                    if (add_order(colname, by)) {
                        order_sort();
                        bulid_row();
                    }
                },
                "order_sql": function (sql) {
                    //#region 排除多餘空白
                    while (sql.indexOf("  ") >= 0) {
                        sql = sql.replace("  ", " ");
                    }
                    while (sql.indexOf(", ") >= 0) {
                        sql = sql.replace(", ", ",");
                    }
                    if (sql[0] == " ") { sql = sql.substring(1) }
                    if (sql[sql.length - 1] == " ") { sql = sql.substring(0, sql.length - 1) }
                    //#endregion 排除多餘空白
                    order_sql(sql);
                    order_sort();
                    bulid_row();
                },
                "remove_order": function (colname) {
                    if (remove_order(colname)) {
                        order_sort();
                        bulid_row();
                    }
                },
                // 目前頁數
                get page() {
                    return jstable_data.page;
                },
                set page(value) {
                    var tmp = jstable_data.page;
                    jstable_data.page = value;
                    if (tmp != jstable_data.page) {
                        bulid_row();
                    }
                },
                // 顯示數量
                get pageSize() {
                    return jstable_data.pageSize;
                },
                set pageSize(value) {
                    var tmp = jstable_data.pageSize;
                    jstable_data.pageSize = value;
                    if (tmp != jstable_data.pageSize) {
                        bulid_row();
                    }
                },
                // 目前總頁數
                get totalPage() {
                    return jstable_data.totalPage;
                }
            });
        }
    }
    // api
    return Object.freeze({
        "createConnection": function (table) {
            return jstable_init(table);
        }
    });
}));
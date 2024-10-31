/*!
 * jstable JavaScript Library v.0.0.1
 *
 * Date: 2024-10-30
 * 
 * 1. 基本功能 : 頁數設定、換頁
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
    function jstable_init(table) {
        var jstable_data = {
            "table" : table,             
            "column" : data_init(get_thead(table)),
            "row" : data_init(get_tbody(table)),
            "Page" : 1, // 目前頁數
            "PageSize" : 10, // 每頁顯示數量
            "fnRowCallback": function (row, fields, index) {
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
            // 資料表建立
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


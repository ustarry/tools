// 全局元素列表
var STADNARD = "Standard Basic Module"
var add_list = undefined;
var add_tabs = undefined;
var add_views = undefined;
var container = undefined;
var app = undefined;
var pop_up_menu = undefined;
var last_target = undefined;

// 管理模块界面
var views_manager = {}
var views_buffer = undefined;

var current_status = "none"

// 脚本模板的编译与储存
var loaded = []
var purfix = ["any", "int", "bool", "number", "array", "table", "function", "block"]
var secret = {"block": (build, arg)=> {return '';}};


// 初始化操作
document.addEventListener("DOMContentLoaded",function()
{
    complie_config("data/std.json")
    add_list = document.getElementById("add_list");
    add_tabs = document.getElementById("add_tabs");
    add_views = document.getElementById("add_views");
    container = document.getElementById("container");
    app = document.getElementById("app");

    add_tabs.onclick = ui_add_tabs_change;
    add_views.onclick = ui_add_views_new_action;
    app.onclick = ui_container_select_action;
    app.onchange = change;
    ui_show_add_list();
});



function ui_add_new_module(module)
{
    var child = add_tabs.appendChild(document.createElement("li"));
    child.innerText = module.short;
    child.setAttribute("module", module.module)
    var view = add_views.appendChild(document.createElement("div"));
    view.setAttribute("module", module.module);
    views_manager[module.module] = view;
}

function ui_add_new_action_in_buffer(module, buffer, action)
{
    var item = buffer.appendChild(document.createElement("div"));
    item.innerText = action.intro;
    item.setAttribute("key", loaded[module.module].length);
    switch (action.type)
    {
    case "STATEMENT":
        item.className = "normal_statement";
        break;
    case "CONTROL":
        item.className = "control_statement"
        break;
    default:
        item.className = "custom_statement"
    }
}

function ui_update_actions(module, buffer)
{
    views_manager[module.module].appendChild(buffer);
    add_tabs.children[0].click();
}

// 添加列表的展示与隐藏
var add_list_showed = true;
function ui_show_add_list()
{
    add_list.style.display = add_list_showed ? 'none' : 'block';
    add_list_showed = !add_list_showed;
}


// 添加列表的切换tab
function ui_add_tabs_change(e)
{
    if (e.target != add_tabs)
    {
        for (var key = 0; key < add_tabs.children.length; ++key)
        {
            add_tabs.children[key].className = "";
        }
        e.target.className = "selected";
        for (const key in views_manager)
        {
            views_manager[key].style = "display: none";
        }
        views_manager[e.target.getAttribute("module")].style = "";
    }
    
}


function change(e)
{
}

// 添加action
function ui_add_views_new_action(e)
{
    if (e.target != add_views && e.target.getAttribute("key") != void 0)
    {
        var module_name = e.target.parentNode.getAttribute("module");
        var index = parseInt(e.target.getAttribute("key"));
        if (index == NaN) return;
        var target = loaded[module_name][index];
        switch (target.type)
        {
        case "STATEMENT":
            var action = container.appendChild(document.createElement("div"));
            action.className = "normal_statement";
            action.innerHTML = target.build;
            action.setAttribute("module", module_name);
            action.setAttribute("key", index);
            break;
        case "CONTROL":
            var control = container.appendChild(document.createElement("div"));
            control.className = "control";
            control.innerHTML = `<div class="control_statement">${target.build}</div> <div class="block"></div>`
            break;
        default:
            action.remove();
        }
    }
}


// 操作action
function ui_container_select_action(e)
{
    // 初始化弹出菜单
    if (void 0 == pop_up_menu)
    {
        pop_up_menu = container.appendChild(document.createElement("div"));
        pop_up_menu.className = "pop_up_menu";
        pop_up_menu.onclick = ui_click_pop_up_menu;
    }
    if (container.contains(e.target) && container != e.target)
    {
        if (e.target.className == "edit")
        {
            last_target = e.target;
            pop_up_menu.style = `top: ${e.clientY - 10}px; left: ${e.clientX - 10}px;`;
            pop_up_menu.innerHTML = `<div>输入</div><div>函数库</div>`;
        }
        else
        {
            switch (current_status)
            {
            case "none":
                last_target = e.target;
                pop_up_menu.style = `top: ${e.clientY - 10}px; left: ${e.clientX - 10}px;`;
                var statement = e.target.className;
                if (statement == "normal_statement")
                {
                    pop_up_menu.innerHTML = `<div>移动</div><div>移除</div>`
                }
                else if (statement == "control_statement")
                {
                    pop_up_menu.innerHTML = `<div>移动</div><div>移除</div>`
                }
                break;
            case "move": 
                current_status = "none";
                if (e.target.className == "block")
                {
                    e.target.appendChild(last_target);
                }
                else
                {
                    e.target.parentNode.insertBefore(last_target, e.target);
                }
                pop_up_menu.style = "display: none;";
                return;
            }
            
            if (last_target.className == "block" || last_target.className == "control_statement")
            {
                last_target = last_target.parentNode;
            }
        }
    }
    else
    {
        pop_up_menu.style = "display: none;";
    }
    
    current_status = "none";
}

// 处理弹出菜单
function ui_click_pop_up_menu(e)
{
    e.stopPropagation();
    if (e.target != pop_up_menu)
    {
        switch (e.target.innerText)
        {
        case "移除":
            last_target.remove();
            break;
        case "移动":
            Qmsg.info("点击目标action将放置在目标上方，点击其他位置取消移动");
            current_status= "move";
            break;
        case "输入":
            last_target.innerText = prompt("请输入修改的内容", last_target.innerText);
            break;
        }
        pop_up_menu.style = "display: none;";
    }
}


function complie_config(url)
{
    fetch(url).then(response => response.json())
        .then(data => 
        {
            if (data.code == 200) 
            {
                for (var i = 0; i < data.modules.length; ++i) 
                {
                    var current = data.modules[i];
                    var buffer = document.createDocumentFragment();
                    if (void 0 == loaded[current.module])
                    {
                        var loading = Qmsg.loading(`正在编译模块${current.module}`);
                        if (void 0 == loaded[current.module])
                        {
                            loaded[current.module] = [];
                        }
                        var add_to = loaded[current.module];

                        // 在添加列表更新添加项
                        ui_add_new_module(current);

                        // 编译模块的每一个具体积木
                        for (var j = 0; j < current.config.length; ++j)
                        {
                            var t = current.config[j];
                            var build = "";
                            var beg = 0;
                            var end = 0;
                            var not_error = true;
                            t.args = []
                            for (;end < t.template.length && not_error; ++end)
                            {
                                if (t.template[end] == '$')
                                {
                                    build += t.template.slice(beg, end);
                                    ++end;
                                    beg = end;
                                    while (end < t.template.length && not_error)
                                    {
                                        if (t.template[end] == ':')
                                        {
                                            arg = t.template.slice(beg, end);
                                            if (arg.length > 0)
                                            {
                                                t.args.push(arg);
                                            }
                                            ++end;
                                            beg = end;
                                            if (end < t.template.length)
                                            {
                                                var found = t.template.slice(beg);
                                                var alright = false;
                                                for (const key in purfix)
                                                {
                                                    if (found.startsWith(purfix[key]))
                                                    {
                                                        beg += purfix[key].length;
                                                        end = beg;
                                                        if (secret[purfix[key]])
                                                        {
                                                            build += secret[purfix[key]](build, arg);
                                                            
                                                        }
                                                        else
                                                        {
                                                            build += `<span class='edit' name='${arg}' type='${purfix[key]}'>${arg}</span>`
                                                        }
                                                        alright = true;
                                                    }
                                                }
                                                if (alright) break;
                                            }
                                            not_error = false;
                                            console.log(`编译模块${current.module}的[${t.intro}]部分发生错误!`)
                                        }
                                        ++end;
                                    }
                                }
                            }
                            build += t.template.slice(beg, end);
                            t.build = build;

                            if (not_error)
                            {
                                // 添加模块并缓存
                                ui_add_new_action_in_buffer(current, buffer, t);
                                add_to.push(t);
                            }
                        }
                        loading.close();
                        // 显示加载的模块
                        ui_update_actions(current, buffer)
                    }
                }
            }
        })
        .catch((e) => Qmsg.error("解析失败！"))
}


// 生成可视化脚本
function release_build()
{
    var build = `\n-- made by 心鼠工坊\n-- time:${new Date().toLocaleDateString()}\n`;
    var no_err = true;
    for (var k = 0; k < container.children.length && no_err; ++k)
    {
        var current = container.children[k];
        var args_check = {};
        switch (current.className) {
            case "normal_statement":
                var action = loaded[current.getAttribute("module")][parseInt(current.getAttribute("key"))];
                var copy = `${action.release_target}`;
                for (var j = 0; j < current.children.length; ++j)
                {
                    var arg = current.children[j];
                    var name = arg.getAttribute("name");
                    args_check[name] = true;
                    copy = copy.replace(`$` + name, arg.innerText);
                }
                for (var j = 0; j < action.args.length; ++j)
                {
                    if (!args_check[action.args[j]])
                    {
                        no_err = false;
                        console.log(`错误！缺少参数${action.args[j]}`)
                        break;
                    }
                }
                if (!no_err) break;
                // 参数数目检查通过
                build += `${copy}\n`;
                break;
            case "control_statement":
                break;
            default:
                break;
        }
    }
    if (no_err)
    {
        alert("脚本生成结果：\n" + build)
    }
    else
    {
        alert("生成错误!")
    }
}
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
var purfix = ["any", "int", "bool", "number", "array", "string","table", "function", "block"]
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
function ui_show_add_list(status)
{
    if (status != void 0)
    {
        add_list_showed = status;
    }
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



// 添加action
function ui_add_views_new_action(e)
{
    if (e.target != add_views && e.target.getAttribute("key") != void 0)
    {
        if (current_status == "function") 
        {
            var module_name = e.target.parentNode.getAttribute("module");
            var index = parseInt(e.target.getAttribute("key"));
            if (index == NaN) return;
            var target = loaded[module_name][index];
            if (target.type == "STATEMENT")
            {
                var accept_type = last_target.getAttribute("type");
                if (target.return == "void")
                {
                    Qmsg.error(`错误！[${target.intro}]没有返回值！无法在此使用！`)
                }
                else if (accept_type == "any" || accept_type == target.return)
                {
                    last_target.innerHTML = target.build;
                    last_target.setAttribute("module", module_name);
                    last_target.setAttribute("key", index);
                }
                else
                {
                    Qmsg.error(`错误！${target.intro}的接收类型${target.return}与${accept_type}不兼容！无法使用！`)
                }
            }
            ui_show_add_list(true);
        }
        else 
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
                    control.innerHTML = `<div class="control_statement">${target.build}</div> <div class="block"></div>`;
                    control.setAttribute("module", module_name);
                    control.setAttribute("key", index);
                    break;
                default:
                    action.remove();
            }
        }

    }
}


// 操作action
function ui_container_select_action(e)
{
    // 初始化弹出菜单
    if (void 0 == pop_up_menu)
    {
        pop_up_menu = app.appendChild(document.createElement("div"));
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
                    pop_up_menu.innerHTML = `<div>移动</div><div>拷贝</div><div>移除</div>`
                }
                else if (statement == "control_statement")
                {
                    pop_up_menu.innerHTML = `<div>移动</div><div>拷贝</div><div>移除</div>`
                }
                else
                {
                    break;
                }
                break;
            case "move": 
                current_status = "none";
                if (e.target.className == "block")
                {
                    e.target.appendChild(last_target);
                }
                else if (e.target.className == "control_statement")
                {
                    e.target.parentNode.parentNode.insertBefore(last_target, e.target.parentNode);
                }
                else
                {
                    e.target.parentNode.insertBefore(last_target, e.target);
                }
                pop_up_menu.style = "display: none;";
                return;
            case "function":
                break;
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

    if (current_status == "function" && add_tabs.contains(e.target))
    {
        return;
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
            last_target.innerText = prompt("请输入修改的内容", last_target.innerText) ?? last_target.innerText;
            break;
        case "函数库":
            Qmsg.info("点击添加列表的action选择正确的函数");
            ui_show_add_list(false);
            current_status = "function";
            break;
        case "拷贝":
            last_target.parentNode.insertBefore(last_target.cloneNode(true), last_target);
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
                            if (void 0 == t.release_target)
                            {
                                console.log(`错误！${t.intro}必须支持生成release版本！`);
                                continue;
                            }
                            var build = "";
                            var beg = 0;
                            var end = 0;
                            var not_error = true;
                            t.args = [];
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
function build(is_released)
{
    var base = `-- made by 心鼠工坊\n-- time:${new Date().toLocaleDateString()}\n`;
    var result = build_script(base, container, is_released);
    if (void 0 == result)
    {
        alert("生成错误！")
    }
    else
    {
        alert("生成结果:\n" +result)
    }
}


function get_union_target(action, is_released)
{
    var release = action.release_target_union ?? action.release_target;
    var debug = action.debug_target_union ?? action.debug_target;
    return is_released ? release : (debug ? debug : release);
}

function get_target(action, is_released)
{
    return is_released ? action.release_target : (void 0 == action.debug_target ? action.release_target : action.debug_target);
}

function build_last_control(control, is_released, copy)
{
    var last_control = control.children[0];
    var last_block = control.children[1];
    for (var j = 0; j < last_control.children.length; ++j)
    {
        var t = last_control.children[j];
        var name = t.getAttribute("name");
        copy = copy.replace(`$` + name, construct_args(last_control.children[j]));
    }
    return `${copy.replace('$block', build_script("\n", last_block, is_released))}` ;
}

function build_script(base, zone, is_released)
{    
    var no_err = true;
    var last_control_action = undefined;
    var k = 0;
    for (; k < zone.children.length && no_err; ++k)
    {
        var current = zone.children[k];
        switch (current.className) 
        {
            case "normal_statement":
                if (last_control_action) 
                {
                    base += `${build_last_control(zone.children[k - 1], is_released, get_target(last_control_action, is_released))}\n`;
                }
                base += `${construct_args(current, is_released)}\n`;
                last_control_action = undefined;
                break;
            case "control":
                var cur_action = loaded[current.getAttribute("module")][parseInt(current.getAttribute("key"))];
                if (void 0 != cur_action.meet_prev) 
                {
                    if (void 0 == last_control_action || cur_action.meet_prev.indexOf(last_control_action.intro) == -1) 
                    {
                        console.log(k + "该action无法单独存在或组合错误");
                        no_err = false;
                    }
                    else
                    {
                        base += `${build_last_control(zone.children[k - 1], is_released, get_union_target(last_control_action, is_released))}\n`;
                    }
                    last_control_action = undefined;
                }
                if (last_control_action)
                {
                    base += `${build_last_control(zone.children[k - 1], is_released, get_union_target(last_control_action, is_released))}\n`;
                }
                if (k + 1 == zone.children.length)
                {
                    base += `${build_last_control(current, is_released, get_target(cur_action, is_released))}\n`
                };
                last_control_action = cur_action;
                break;
            default:
                break;
        }
    }
    if (no_err)
    {
        return base;
    }
    else
    {
        return undefined;
    }
}

// 递归生成脚本参数
function construct_args(arg, is_released)
{
    if (arg.children.length == 0)
    {
        return arg.innerText;
    }
    else
    {
        var action = loaded[arg.getAttribute("module")][parseInt(arg.getAttribute("key"))];
        var copy = `${get_target(action, is_released)}`;
        for (var j = 0; j < arg.children.length; ++j)
        {
            var t = arg.children[j];
            var name = t.getAttribute("name");
            copy = copy.replace(`$` + name, construct_args(arg.children[j]));
        }
        return copy;
    }
}
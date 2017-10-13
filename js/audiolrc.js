var audiolrc = document.getElementById("audiolrc"); //歌词列表节点
var nolrc    = document.getElementById("nolrc"); //找不到歌词界面节点
var lrctime  = new Array(); //用于保存歌词的时间轴
var liarray  = new Array(); //用于保存歌词的Y坐标
var playing  = null; //用于保存同步歌词定时器的变量
var slogan   = null; //用于保存标语定时器的变量
var songlrc  = ""; //保存歌词文件对象
var geci     = "#18B3EE"; //默认歌词颜色

document.onkeydown = function spacePlay(event){ 
    var e = event || window.event || arguments.callee.caller.arguments[0];
    if(e && e.keyCode==32){
        window.parent.play_pause();
        e.preventDefault();
    }
}

//歌词的读取与处理
function parseLyric(){
    //如果audiolist.html页面传过来的歌词为空，则跳出
    if(!songlrc) return;

    //进行歌词文件的读取
    var reader = new FileReader();
    reader.readAsText(songlrc);
    reader.onload = function(){
        lrctime   = [];
        //将歌词存储在songlrc当中
        songlrc   = reader.result;
        //清空歌词界面
        audiolrc.innerHTML = "";
        nolrc.innerHTML    = "";
        //将歌词按段落切割存入数组当中
        lyric = songlrc.split('\r\n');
        //遍历每行歌词
        for(var i=0;i<lyric.length;i++){
            //提取出时间
            var d = lyric[i].match(/\[\d{2}:\d{2}((\.|\:)\d{2})\]/g);
            //提取出歌词内容
            var t = lyric[i].split(d);
            t = $.trim(t[1]);
            if(d != null){
                //将时间进行处理
                var dt = String(d).split(':');
                var _t = parseInt(dt[0].split('[')[1])*60+parseFloat(dt[1].split(']')[0]);
                lrctime[i] = Math.round(_t*100)/100;
                //将歌词内容写入列表
                audiolrc.innerHTML += '<li id="li'+i+'">'+t+'</li>';
            }
        }

        //清空歌词坐标，并重新计算新的坐标
        liarray    = new Array();
        liarray[0] = parseInt($("ul li:eq(0)").get(0).offsetHeight);
        for(var i=1; i<=lrctime.length-1; i++){
            liarray[i] = liarray[i-1]+parseInt($("ul li:eq("+i+")").get(0).offsetHeight);
        }

        //开始同步歌词
        playlrc();
    };
}


//以下变量仅用于playlrc()方法和父页面的showLrc()方法
var setDelayTime = 0; //设置歌词同步的延时
var num          = 0; //初始化歌词从第0行开始同步
var minsize      = 14; //设置最小字体
var maxsize      = 14; //设置最大字体

//同步歌词，jump为是否点击了进度条进行歌词跳转的参数
function playlrc(jump){
    var audio = window.parent[0].document.getElementById("audio");
    //进行停止滚动动画并清空歌词同步定时器的操作
    $("html,body").stop(true);
    clearInterval(playing);
    clearTimeout(slogan);

    //如果点击了进度条，将停止字体动画，清空所有歌词样式
    if(jump == 1){
        $("ul li:eq("+num+")").stop(true);
        $("ul li:eq("+(num-1)+")").stop(true);
        for(var i = 0; i < lrctime.length; i++){
            if($("#li"+i).attr("style"))
                document.getElementById("li"+i).removeAttribute("style");
        }

        //重新计算当前位置歌词的索引
        num = 0;
        while(audio.currentTime >= (lrctime[num+1]+setDelayTime-0.2)) {num++;}
        if(num == 0){
            document.body.scrollTop = 0;
        }else{
            $("ul li:eq("+num+")").css('fontSize',maxsize+"px");
            $("ul li:eq("+(num-1)+")").css('fontSize',minsize+"px");
        }

    //如果不是跳转操作，则让歌词开始从头播放
    }else{
        var index = window.parent[0].num;
        var musicname = window.parent[0].musicname;
        setDelayTime = parseFloat(JSON.parse(localStorage.getItem(musicname[index]))[3]) || 0;
        $(".delrctime").text(-Math.round(setDelayTime*10)/10);
        document.body.scrollTop = 0;
        num = 0;
    }

    //用于同步歌词的定时器
    playing = setInterval(function(){
        //如果歌词列表是空的，则清除当前定时器，显示标语，并跳出
        if(!songlrc){
            clearInterval(playing);
            if(nolrc.innerText == "找不到歌词文件"){
                clearplay();
            }
            return;
        }

        //如果歌曲时间存在，按时间遍历歌词
        if(audio.currentTime && audio.currentTime >= (lrctime[num]+setDelayTime-0.2)){
            //当前歌词滚动动画，字体变大动画，字体颜色的设置
            $("html,body").animate({"scrollTop": liarray[num]},400);
            $("ul li:eq("+num+")").animate({fontSize: maxsize+"px"});
            document.getElementById("li"+num).style.color = geci;

            //如果存在上一句歌词，则执行字体变小动画，还原字体颜色
            if(num != 0){
                $("ul li:eq("+(num-1)+")").animate({fontSize: minsize+"px"});
                document.getElementById("li"+(num-1)).style.color = "#FFF";
            }

            num++;
        }
    },10);
}

//提示用户找不到歌词
function clearplay(){
    //进行停止滚动动画并清空歌词同步定时器的操作
    $("html,body").stop(true);
    clearInterval(playing);
    clearTimeout(slogan);

    //清空歌词界面，并定位到顶部，提示用户找不到歌词文件
    audiolrc.innerHTML = "";
    document.body.scrollTop = 0;
    nolrc.innerText = "找不到歌词文件";

    //一段时间后显示标语
    slogan = setTimeout(function(){
        nolrc.innerText = "炫听音乐，炫酷生活";
    },5000);
}

//歌词展开界面点击歌手名、专辑名时，打开一个新窗口用于显示搜索结果
function jumplink(obj){
    //提取出歌手名或专辑名，放入搜索链接中进行搜索
    window.open("http://www.baidu.com.cn/s?wd=" + obj.innerText + "&cl=3");
}

function showdelrc(num){
    if(num == 1){
        $('.delrc').css('display','block');
    }else{
        $('.delrc').css('display','none');
    }
}

function delrc(denum){
    if(songlrc){
        setDelayTime += denum;
        $(".delrctime").text(-Math.round(setDelayTime*10)/10);
        playlrc(1);
        var index = window.parent[0].num;
        var musicname = window.parent[0].musicname;
        var temp = JSON.parse(localStorage.getItem(musicname[index]));
        temp[3] = ""+Math.round(setDelayTime*10)/10;
        localStorage.setItem(musicname[index],JSON.stringify(temp));
    }
}
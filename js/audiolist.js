var input      = document.getElementById("files");
var list       = document.getElementById("list");
var audio      = window.parent.document.getElementById("audio");
var files      = new Array();
var musicsrc   = new Array();
var lyric      = new Array();
var musicname  = new Array();
var musictags  = new Array();
var musictitle = new Array();
var singer     = new Array();
var album      = new Array();
var albumimg   = new Array();
var dataexist  = new Array();
var isRuning   = false;
var lastli     = -1;
var mode       = 1;
var count      = 0;
var num        = 0;
var n          = 0;

function init(){
    document.getElementById("audio").volume = 0.5;
    document.getElementById("get").volume = 0;
}

document.onkeydown = function spacePlay(event){ 
    var e = event || window.event || arguments.callee.caller.arguments[0];
    if(e && e.keyCode==32){
        window.parent.play_pause();
        e.preventDefault();
    }
}

input.onchange = function(e){
    files = e.target.files;
    for(var i = 0,f; f = files[i]; ++i){
        var path = f.name || f.webkitRelativePath;
        if(/.*\.mp3$/.test(path) || /.*\.lrc$/.test(path)){
            if(/.*\.lrc$/.test(path) && files[i+1].name.slice(0,path.length-4) == path.slice(0,path.length-4)){
                lyric[count] = files[i];
            }else if(/.*\.mp3$/.test(path)){
                musictags[count] = files[i];
                musicsrc[count]  = window.URL.createObjectURL(files[i]);
                musicname[count] = path.slice(0,path.length-4);
                list.innerHTML  += '<tr id="li'+count+'" ondblclick="changeSrc(0,'+count+')" ><td id="linumber"></td><td id="liname">'+musicname[count]+'</td><td id="lisinger">未知歌手<td id="lialbum">未知专辑</td><td id="litime">00:00</td></tr>';
                count++;
            }
        }
    }

    if(count == 0) return;

    $(".now").css("display","block");

    for(var i = 0; i < count; i++){
        //生成列表序号
        if(count > 999){
            if(i < 9)
                $("#li"+i+" td:eq(0)").text("000"+(i+1));
            else if(i < 99)
                $("#li"+i+" td:eq(0)").text("00"+(i+1));
            else if(i < 999)
                $("#li"+i+" td:eq(0)").text("0"+(i+1));
            else
                $("#li"+i+" td:eq(0)").text(i+1);
        }else if(count > 99){
            if(i < 9)
                $("#li"+i+" td:eq(0)").text("00"+(i+1));
            else if(i < 99)
                $("#li"+i+" td:eq(0)").text("0"+(i+1));
            else
                $("#li"+i+" td:eq(0)").text(i+1);
        }else if(count > 9){
            if(i < 9){
                $("#li"+i+" td:eq(0)").text("0"+(i+1));
            }else
                $("#li"+i+" td:eq(0)").text(i+1);
        }else
            $("#li"+i+" td:eq(0)").text(i+1);
    }

    $("#addfiles").css("display","none");
    $(".addfiles").text("添加更多歌曲");

    //从localStorage从读取数据，如果存在
    for(var i = 0; i < count; i++){
        var info = JSON.parse(localStorage.getItem(musicname[i]));
        if(info){
            $("#li"+i+" td:eq(1)").text(info[0]);
            $("#li"+i+" td:eq(2)").text(info[1]);
            $("#li"+i+" td:eq(3)").text(info[2]);
            musictitle[i] = info[0];
            singer[i] = info[1];
            album[i] = info[2];
            dataexist[i] = true;
        }
    }

    // 从音乐文件中解析ID3信息
    if(!isRuning){
        var url = musictags[n].urn || musictags[n].name;
        ID3.loadTags(url, function() {
            showTigs(url,n);
        },{
            tags: ["title","artist","album","picture"],
            dataReader: ID3.FileAPIReader(musictags[n])
        });
    }

    $("#get").attr("src", musicsrc[0]);
    getTime();
}

var getnum = 0;
function getTime() {
    setTimeout(function () {
        var duration = $("#get")[0].duration;
        if(isNaN(duration)){
            getTime();
        }else{
            var mind = Math.floor(Math.round(duration)/60);
            if(isNaN(mind)) mind  = "00";
            else if(mind<10) mind = "0"+mind;
            var secd = Math.round(duration)%60;
            if(isNaN(secd)) secd  = "00";
            else if(secd<10) secd = "0"+secd;
            $("#li"+getnum+" td:eq(4)").text(mind+":"+secd);
            if(getnum < musicsrc.length){
                getnum++;
                $("#get").attr("src", musicsrc[getnum]);
                getTime();
            }
        }
    }, 20);
}

function showTigs(url,n){
            var tags  = ID3.getAllTags(url);
            var image = tags.picture;
            var info  = JSON.parse(localStorage.getItem(musicname[n])) || new Array();
            isRuning      = true;
            musictitle[n] = tags.title  || musicname[n];
            singer[n]     = tags.artist || "未知歌手";
            album[n]      = tags.album  || "未知专辑";
            if (image) {
                var base64String = "";
                for (var i = 0; i < image.data.length; i++) {
                    base64String += String.fromCharCode(image.data[i]);
                }
                var base64 = "data:" + image.format + ";base64," +
            window.btoa(base64String);
                albumimg[n] = base64;
            }else{
                albumimg[n] = "../image/novinyl.png";
            }
            $("#li"+n+" td:eq(1)").text(musictitle[n]);
            $("#li"+n+" td:eq(2)").text(singer[n]);
            $("#li"+n+" td:eq(3)").text(album[n]);
            info[0] = musictitle[n];
            info[1] = singer[n];
            info[2] = album[n];
            localStorage.setItem(musicname[n],JSON.stringify(info));
            if(n < musictags.length-1){
                do{
                    n++;
                }while(dataexist[n]);
                if(n > musictags.length-1){
                    isRuning = false;
                    return;
                }
                url = musictags[n].urn || musictags[n].name;
                ID3.loadTags(url, function() {
                    showTigs(url,n);
                },{
                    tags: ["title","artist","album","picture"],
                    dataReader: ID3.FileAPIReader(musictags[n])
                });
            }else{
                this.n   = n;
                isRuning = false;
            }
}

function changeSrc(mode,num) {
    if(count == 0) return;
    var audio     = document.getElementById("audio");
    var song_name = window.parent.document.getElementById("song_name");
    var vinylimg  = window.parent.document.getElementById("vinylimg");
    var audioinfo = window.parent[1].document.getElementById("audioinfo");

    if(mode != 0 || mode == 2){
        playmode(this.mode,num);
        num = this.num;
    }

    song_name.innerHTML = '<marquee behavior="alternate" truespeed="truespeed" scrolldelay="100" scrollamount="2">'+musicname[num]+'</marquee>';
    audio.src = musicsrc[num];

    $(audioinfo).find('.span1').html(musictitle[num]||musicname[num]);
    $(audioinfo).find('.span2').html('歌手：<span onclick="jumplink(this)">'+(singer[num]||'未知歌手')+'</span>');
    $(audioinfo).find('.span3').html('专辑：<span onclick="jumplink(this)">'+(album[num]||'未知专辑')+'</span>');
    if(albumimg[num]){
        vinylimg.setAttribute('src',albumimg[num]);
    }else{
        var url = musictags[num].urn || musictags[num].name;
        ID3.loadTags(url, function() {
            var image = ID3.getAllTags(url).picture;
            if (image) {
                var base64String = "";
                for (var i = 0; i < image.data.length; i++) {
                    base64String += String.fromCharCode(image.data[i]);
                }
                var base64 = "data:" + image.format + ";base64," +
            window.btoa(base64String);
                albumimg[num] = base64;
            }else{
                albumimg[num] = "../image/novinyl.png";
            }
            vinylimg.setAttribute('src',albumimg[num]);
        },{
            tags: ["picture"],
            dataReader: ID3.FileAPIReader(musictags[num])
        });
    }


    if(lyric[num]){
        window.parent[1].songlrc = lyric[num];
        window.parent[1].parseLyric();
    }else{
        window.parent[1].songlrc = "";
        window.parent[1].clearplay();
    }

    //改变当前播放歌曲列表的显示样式
    if(lastli != -1){
        $("#li"+lastli+" td:eq(1)").removeAttr("style");
        $("#li"+lastli+" td:eq(0)").removeAttr("value");
    }
    $("#li"+num+" td:eq(1)").css("color","#19B5F0");
    $("#li"+num+" td:eq(0)").attr("value","gif");

    this.num = num;
    lastli = num;
    if(document.body.scrollTop > num*39-436 && document.body.scrollTop < num*39+44 || num == 0 || num == musicsrc.length-1)
        now();
    audio.pause();
    window.parent.play_pause();
}

//定位当前歌曲
function now(){
    if(document.body.scrollTop <= num*39-396 || document.body.scrollTop >= num*39+4){
        $("html,body").animate({"scrollTop":this.num*39-196});
    }
}

function playmode(mode,num){
    var nowli = document.getElementById("li"+num);
    switch(mode){
        case 1:
        case 2: if(num > musicsrc.length-1){
                    num = 0;
                    lastli = musicsrc.length-1;
                }else if(num < 0){
                    num = musicsrc.length-1;
                    lastli = 0;
                }
                this.num = num;
                break;
        case 3: this.num = Math.round(Math.random()*(count-1));
                $("html,body").animate({"scrollTop":this.num*39-196});
                break;
        default:break;
    }
}
function playgif(val){
    if(val == 1){
        $("#li"+num+" td:eq(0)").attr("value","gif");
    }else{
        $("#li"+num+" td:eq(0)").attr("value","png");
    }
}

/*function hiddenNow(num){
    if(num == 1){
        $('.now').css('display','block');
    }else{
        $('.now').css('display','none');
    }
}*/
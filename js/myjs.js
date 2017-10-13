//网页加载完成时监听搜索框的聚集事件
function init(){
	$("#search").focus(function(){inputFocus();});
	$("#search").blur(function(){inputBlur();});
}

//当输入框聚焦时，去除提示文本
function inputFocus(){
	$("#search").attr("placeholder","");
}

//当输入框失焦时，显示提示文本
function inputBlur(){
	$("#search").attr("placeholder","搜索歌曲名/歌手名");
}

//点击添加歌曲按钮，触发type=file的输入框的点击事件
function addlist(){
	window.frames["audiolist"].document.getElementById("files").click();
}

//按键监听，当空格键按下时，控制播放/暂停功能
document.onkeydown = function spacePlay(event){
	var e = event || window.event || arguments.callee.caller.arguments[0];
	//当输入框处于聚焦状态时，不触发播放/暂停功能
	var search = document.getElementById("search");
	if(search == document.activeElement) return;
	//触发播放/暂停功能，并禁用浏览器默认操作
	if(e && e.keyCode==32){
		play_pause();
    		e.preventDefault();
	}
}

//定时器时间选择框和播放模式选择框的隐藏
function hiddenwin(){
	$("#selecttime,#selectmode").css("display","none");
}

//播放按钮的点击事件，判断当前状态需要触发的操作
function play_pause(){
	var play        = document.getElementById("play"); //播放按钮节点
	var audio       = window.frames["audiolist"].document.getElementById("audio"); //audio标签节点
	var protime     = document.getElementById("pro_time"); //进度条小圆圈节点
	var vinyl       = document.getElementById("vinyl"); //专辑CD节点
	var vinylheader = document.getElementById("vinylheader"); //CD触头节点

	//列表加载完成后点击播放按钮执行播放第一首歌曲的操作
	if(!audio.src){
		window.frames["audiolist"].changeSrc(1,0);
		return; //跳出后，子页面audiolist会再次调用play_pause()方法
	}

	//如果当前为暂停状态，则执行播放及相关操作
	if(audio.paused){
		audio.play();

		//将播放小图标设置为动态，并让专辑CD处于旋转状态
		window.frames["audiolist"].playgif(1);
		vinyl.style.animationPlayState = "running";
		vinylheader.style.animation    = "vinyldown 300ms forwards";

		//将播放按钮改为可暂停状态
		play.innerHTML         = "&#xe82f;";
		play.style.paddingLeft = "0px";
		play.style.width       = "44px";
		protime.style.display  = "block"; //显示进度条的小圆球

		//重设进度条和时间的刷新并且跳出
    	clearInterval("play_time()");
		setInterval("play_time()",500);
		return;
	}

	audio.pause();

	//将播放小图标设置为静态，并让专辑CD处于静止状态
	window.frames["audiolist"].playgif(0);
	vinyl.style.animationPlayState = "paused";
	vinylheader.style.animation    = "vinylup 300ms forwards";

	//将播放按钮改为可播放状态
	play.innerHTML         = "&#xe831;";
	play.style.paddingLeft = "2px";
	play.style.width       = "42px";

	//清除进度条和时间的刷新
    	clearInterval("play_time()");
}

var nownum = 0; //用于保存当前播放歌曲的编号，由audiolist.html传值

//播放上一首的操作
function play_last(){
	//获取正在播放歌曲的编号，减1后调用audiolist.html的播放方法
	nownum = window.frames["audiolist"].lastli;
	window.frames["audiolist"].changeSrc(window.frames["audiolist"].mode,nownum-1);
}

//播放下一首的操作
function play_next(){
	//获取正在播放歌曲的编号，加1后调用audiolist.html的播放方法
	nownum = window.frames["audiolist"].lastli;
	window.frames["audiolist"].changeSrc(window.frames["audiolist"].mode,nownum+1);
}

//刷新进度条和时间
function play_time(){
	var play     = document.getElementById("play"); //播放按钮节点
	var audio    = window.frames["audiolist"].document.getElementById("audio"); //音频标签节点
	var songtime = document.getElementById("song_time"); //歌曲时间进度节点
	var protime  = document.getElementById("pro_time"); //进度条小圆圈节点
	var probar   = document.getElementById("pro_bar"); //进度条节点
	var songname = document.getElementById("song_name"); //进度条上的歌曲名称节点

	//获取歌曲当前的播放时间，并处理成00:00的格式
	var minc = Math.floor(Math.round(audio.currentTime)/60);
	if(minc<10) minc = "0"+minc;
	var secc = Math.round(audio.currentTime)%60;
	if(secc<10) secc = "0"+secc;
	var mind = Math.floor(Math.round(audio.duration)/60);
	if(isNaN(mind)) mind = "00";
	else if(mind<10) mind = "0"+mind;
	var secd = Math.round(audio.duration)%60;
	if(isNaN(secd)) secd = "00";
	else if(secd<10) secd = "0"+secd;

	//刷新时间
	songtime.innerText = minc+":"+secc+"/"+mind+":"+secd;

	//刷新进度条
	var marginleft = 538/audio.duration;
	protime.style.marginLeft = Math.round(marginleft*audio.currentTime*100)/100+"px";
	probar.style.backgroundSize = Math.round(marginleft*audio.currentTime*100)/100+5+"px 4px";

	//当前歌曲播放结束后，如果为单曲循环模式，则重新播放当前歌曲
	if(audio.ended && window.frames["audiolist"].mode == 2){
		window.frames["audiolist"].changeSrc(2,window.frames["audiolist"].num);

	//否则播放下一首
	}else if(audio.ended){
		play_next();
	}
}

//下列变量用于临时存储音量相关的数据，仅用于mute()方法
var temp_vol  = 0;
var temp_html = "";
var temp_ml   = "";
var temp_bgs  = "";
var temp_si   = "";
var temp_dec  = false; //用于标记音量是否处于递减/递增状态
//点击音量图标触发的静音/还原操作
function mute(){
	var audio    = window.frames["audiolist"].document.getElementById("audio"); //audio标签节点
	var vol      = document.getElementById("volume"); //音量图标节点
	var valbar   = document.getElementById("volbar"); //音量条节点
	var volvalue = document.getElementById("volvalue"); //音量小圆圈节点
	//如果音量处于递增/递减状态，则跳出不执行操作
	if(temp_dec) return;

	//如果音量不为0，则执行静音操作
	if(audio.volume > 0){
		temp_dec  = true;
		temp_vol  = audio.volume;
		temp_html = vol.innerHTML;
		temp_ml   = volvalue.style.marginLeft;
		temp_bgs  = valbar.style.backgroundSize;
		clearInterval(temp_si);
		temp_si = setInterval(function(){
			if(audio.volume > 0 && audio.volume < 0.02){
				audio.volume = 0;
			}else if(audio.volume > 0){
				audio.volume -= 0.01;
			}else{
				temp_dec = false;
    			clearInterval(temp_si);
			}
		},6);
		vol.innerHTML = "&#xe800";
		volvalue.style.marginLeft   = 0+"px";
		valbar.style.backgroundSize = 0+"px";

	//否则执行音量还原操作
	}else{
		temp_dec  = true;
		clearInterval(temp_si);
		temp_si = setInterval(function(){
			if(audio.volume < temp_vol){
				audio.volume += 0.01;
			}else{
				temp_dec = false;
    			clearInterval(temp_si);
			}
		},6);
		vol.innerHTML = temp_html;
		volvalue.style.marginLeft   = temp_ml;
		valbar.style.backgroundSize = temp_bgs;
	}
}

//点击音量条触发的音量设置操作
function setVolume(){
	var audio    = window.frames["audiolist"].document.getElementById("audio"); //audio标签节点
	var vol      = document.getElementById("volume"); //音量图标节点
	var valbar   = document.getElementById("volbar"); //音量条节点
	var volvalue = document.getElementById("volvalue"); //音量小圆圈节点

	//设置音量值并同步改变进度条
	volvalue.style.marginLeft   = event.offsetX+"px";
	valbar.style.backgroundSize = event.offsetX+"px";
	audio.volume                = 1/100*event.offsetX;

	//判断当前音量大小，并设置对应的图标
	if(audio.volume <= 0.05){
		audio.volume  = 0;
		vol.innerHTML = "&#xe800";
	}else if(audio.volume > 0.5){
		vol.innerHTML = "&#xe803";
	}else{
		vol.innerHTML = "&#xe802";
	}
}

//点击播放进度条触发的时间跳转操作
function bar_val(){
	var audio   = window.frames["audiolist"].document.getElementById("audio"); //audio标签节点
	var protime = document.getElementById("pro_time"); //进度条小圆圈节点
	var probar  = document.getElementById("pro_bar"); //进度条节点

	//如果时间存在，则跳转到对应的时间播放
	if(audio.duration){
		protime.style.marginLeft    = event.offsetX-2+"px";
		probar.style.backgroundSize = event.offsetX-2+"px";
		audio.currentTime           = (audio.duration/538)*event.offsetX;
	}

	//执行刷新歌词的操作
	window.frames["audiolrc"].playlrc(1);
}

//定义一个用于去除特殊符号的正则表达式
var reg = /[\ |\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g;

//当输入框的值发生改变时触发的搜索操作
function search(){
	var audiolist    = document.getElementById("audiolist"); //audiolist.html节点
	var sea          = document.getElementById("search"); //搜索框节点
	var musicname    = window.frames["audiolist"].musicname; //获取歌曲名数组

	//将输入框的汉字转换为全拼，转换为小写后去除所有特殊符号
	var lowerval     = pinyin.getFullChars(sea.value).toLowerCase().replace(reg,""); 
	//将输入框的汉字转换为每个汉字的首字母，转换为小写后去除所有特殊符号
	var lowervallite = pinyin.getCamelChars(sea.value).toLowerCase().replace(reg,"");

	//如果输入框的值不为空
	if(sea.value){

		//如果歌词界面已经展开，则收起歌词界面，以展示搜索结果
		if(isShow == 0){
			showLrc();
		}

		//遍历所有歌曲名
		for(var i=0;i<musicname.length;i++){
			var list = window.frames["audiolist"].document.getElementById("li"+i);
			//将歌曲名的汉字转换为全拼，转换为小写后去除所有特殊符号
			var lowername = pinyin.getFullChars(musicname[i]).toLowerCase().replace(reg,"");
			//将歌曲名的汉字转换为每个汉字的首字母，转换为小写后去除所有特殊符号
			var lowernamelite = pinyin.getCamelChars(musicname[i]).toLowerCase().replace(reg,"");

			//进行对比，把不符合的结果隐藏
			if(lowername.indexOf(lowerval) == -1 && lowernamelite.indexOf(lowervallite) == -1){
				list.style.display = "none";
			//否则把结果显示
			}else{
				list.removeAttribute("style");
			}
		}
	//如果输入框的值为空，则还原列表
	}else{
		for(var i=0;i<musicname.length;i++){
				var list = window.frames["audiolist"].document.getElementById("li"+i);
				list.removeAttribute("style");
		}
	}
}

//点击关闭按钮执行的操作
function closeDown(){
	var all   = document.getElementById("all");
	var audio = window.frames["audiolist"].document.getElementById("audio");
	var body  = document.getElementById("body");
	audio.pause();
	body.style.backgroundImage = "url('./image/thinks.png')";
	all.style.animation = "closeFlash 500ms forwards";
	setTimeout("window.open('','_self');window.close()",2400);
}

//点击定时器按钮执行显示选择框的操作
function timeOff(){
	var selecttime = document.getElementById("selecttime");
	$("#selectmode").css("display","none");
	if(selecttime.style.display == "none"){
		selecttime.style.display = "block";
	}else if(selecttime.style.display == "block"){
		selecttime.style.display = "none";
	}else{
		selecttime.style.display = "block";
	}
}

//选择定时关闭时间执行的操作
var timing;
function setTimeOff(timemin){
	//将时间转为秒，方便后面的调用，并清除定时器
	time = timemin*60;
	clearInterval(timing);

	var selecttime = document.getElementById("selecttime");
	var st = document.getElementsByClassName("showtime")[0];
	var ct = document.getElementsByClassName("cleartime")[0];
	st.style.color = "#FFF";
	st.innerText = convertTime(time--);
	selecttime.style.display = "none";
	st.style.display = "inline";
	ct.style.display = "inline";
	timing = setInterval(function(){
		if(time < 0){
			clearInterval(timing);
			closeDown();
			return;
		}else if(time <= 60){
			st.style.color = "#DD111C";
		}
		st.innerText = convertTime(time);
		time--;
	},1000);
}

function cleartime(){
	clearInterval(timing);
	var st = document.getElementsByClassName("showtime")[0];
	var ct = document.getElementsByClassName("cleartime")[0];
	st.style.display = "none";
	ct.style.display = "none";
}

//时间格式化00:00:00，将秒数转换为时分秒格式
function convertTime(time){
	var hou = Math.floor(time/3600);
	if(hou==0) hou = "";
	else if(hou<10)  hou = "0"+hou+":";
	else if(hou>=10) hou = hou+":";
	var min = Math.floor(time/60-Math.floor(time/3600)*60);
	if(min<10) min = "0"+min;
	var sec = Math.round(time)%60;
	if(sec<10) sec = "0"+sec;
	return hou+""+min+":"+sec;
}

//点击播放模式执行的操作
function setPlayMode(mode){
	var playmode   = document.getElementById("playmode");
	var selectmode = document.getElementById("selectmode");
	var state      = selectmode.style.display;
	$("#selecttime").css("display","none");
	switch(mode){
		case 0 :
			if(state == "none")
				selectmode.style.display = "block";
			else if(state == "block")
				selectmode.style.display = "none";
			else
				selectmode.style.display = "block";
			break;
		case 1 :
			selectmode.style.display = "none";
			playmode.innerHTML = "&#xe83f";
			window.frames["audiolist"].mode = 1;
			break;
		case 2 :
			selectmode.style.display = "none";
			playmode.innerHTML = "&#xe840";
			window.frames["audiolist"].mode = 2;
			break;
		case 3 :
			selectmode.style.display = "none";
			playmode.innerHTML = "&#xe83e";
			window.frames["audiolist"].mode = 3;
			break;
	}
}

var isShow = 1; //用于存储歌词界面的展开状态

//点击歌词展开按钮执行的操作
function showLrc(){
	var flashSpeed = 300; //歌词界面展开的速度设置
	//如果歌曲没有展开
	if(isShow == 1){
		//执行展开动画
		$('#center_left').animate({'width':'0px'},flashSpeed);
		$('#center_right').animate({'width':'997px'},flashSpeed);
		$('#vinylheader').animate({'width':'120px','height':'180px','marginLeft':'-510px','marginTop':'-404px'},flashSpeed);
		$('#vinyl').animate({'marginLeft':'-690px','marginTop':'80px','width':'300px','height':'300px'},flashSpeed);
		$('#vinylimg').animate({'borderRadius':'102px','width':'204px','height':'204px','marginTop':'48px'},flashSpeed);
		$('.open').animate({'marginTop':'230px'},flashSpeed);
		$('.open').html('&#xf105;');
		$('#center_right iframe').animate({'width':'500px','height':'410px','marginTop':'36px','marginRight':'-180px'},flashSpeed);
		$('#audiolrc').contents().find('body').css('width','500px');
		$('#audiolrc').contents().find('body').css('marginLeft','-20px');
		$('#audiolrc').contents().find('html').attr({ onmouseover:"showdelrc(1)",onmouseout:"showdelrc(0)"});
		$('#audiolrc').contents().find('ul').css('margin','260px 0px 260px 0px');
		$('#audiolrc').contents().find('#nolrc').css('marginTop','130px');
		$('#audiolrc').contents().find('#nolrc').css('fontSize','22px');
		$('#audiolrc').contents().find('#audioinfo').css('display','block');
		$('#audiolrc').contents().find('.delrc').css('top','46%');
		window.frames["audiolrc"].maxsize = 20;
		isShow = 0; //重置歌词展开状态

	}else{
		//否则执行收起动画
		$('#center_left').animate({'width':'767px'},flashSpeed);
		$('#center_right').animate({'width':'230px'},flashSpeed);
		$('#vinylheader').animate({'width':'54px','height':'86px','marginLeft':'150px','marginTop':'-190px'},flashSpeed);
		$('#vinyl').animate({'width':'160px','height':'160px','marginLeft':'35px','marginTop':'20px'},flashSpeed);
		$('#vinylimg').animate({'borderRadius':'54px','width':'108px','height':'108px','marginTop':'26px'},flashSpeed);
		$('.open').animate({'marginTop':'-250px'},flashSpeed);
		$('.open').html('&#xf104;');
		$('#center_right iframe').animate({'width':'230px','height':'260px','marginTop':'-30px','marginRight':'0px'},flashSpeed);
		$('#audiolrc').contents().find('body').css('width','189px');
		$('#audiolrc').contents().find('body').css('marginLeft','0px');
		$('#audiolrc').contents().find('html').removeAttr('onmouseover','onmouseout');
		$('#audiolrc').contents().find('ul').css('margin','145px 0px');
		$('#audiolrc').contents().find('#nolrc').css('marginTop','0px');
		$('#audiolrc').contents().find('#nolrc').css('fontSize','18px');
		$('#audiolrc').contents().find('#audioinfo').css('display','none');
		$('#audiolrc').contents().find('.delrc').css('top','30%');
		window.frames["audiolrc"].maxsize = 14;
		isShow = 1;//重置歌词展开状态
		window.frames["audiolrc"].playlrc(1);
	}
    // window.frames["audiolrc"].liarray    = new Array(); //清空歌词坐标

    //如果有歌词，则重新计算歌词的坐标
    if(window.frames["audiolrc"].songlrc){
		window.frames["audiolrc"].liarray[0] = parseInt($('#audiolrc').contents().find("ul li:eq(0)").get(0).offsetHeight);
		for(var i=1; i<=window.frames["audiolrc"].lrctime.length-1; i++){
		    window.frames["audiolrc"].liarray[i] = window.frames["audiolrc"].liarray[i-1]+parseInt($('#audiolrc').contents().find("ul li:eq("+i+")").get(0).offsetHeight);
		}
	}

	//歌词界面的校准
    if(isShow == 0) window.frames["audiolrc"].playlrc(1);
}

//当鼠标移到歌词界面时，显示歌词展开按钮
function openlrc(num){
	if(num == 1){
		document.getElementsByClassName("open")[0].style.display = "block";
	}else{
		document.getElementsByClassName("open")[0].style.display = "none";
	}
}
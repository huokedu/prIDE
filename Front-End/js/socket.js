var sock;
var nickname;
<<<<<<< HEAD
var ntabs = 0;
=======
var ntabs = 1;
var currfile;
var currproject;
>>>>>>> d0edbcd086f95c97d4c7d779eaac6e08889de0d1
function Connection()//works
{

  var port = prompt("Enter port");
  nickname = prompt("Enter nickname");
    sock = new WebSocket("ws://45.55.218.73:"+port);
    sock.onopen = function()
    {
        var connect = {
            "nickname": nickname,
            "contents": "connect"
        };
        sock.send(JSON.stringify(connect));

    };
    sock.onmessage = function(response){
        var res = JSON.parse(response.data);
        var contents = res.contents;
        if(contents.Accepted){
            alert("Connected");
            //nickname = document.getElementById('nickname').value;
            //document.location.href = "IDEMain.html";
        }
        else{
          port = prompt("Enter port");
          nickname = prompt("Enter nickname");
          sock.close();
          sock = new WebSocket("ws://45.55.218.73:"+port);
        }
    }
}



function Update()
{
    var message = {
        "nickname": nickname,
        "contents": "updatefile "+currfile+" "+document.getElementById('codespace').value
    };
    sock.send(JSON.stringify(message));
    sock.onmessage = function(response){
        var res = JSON.parse(response.data);
        var message = res.contents;
        document.getElementById('code').value = message;
    }

}

function compile()//hold on for alec
{
    var message = {
        "nickname": nickname,
        "contents": "compile"
    }
    sock.send(JSON.stringify(message));

    sock.onmessage = function (response) {
      var res = JSON.parse(response.data);

    }
}


function newproject()//works
{
    var name = prompt("name of project");
    var message = {
        "nickname": nickname,
        "contents": "newproject "+name
    }
    sock.send(JSON.stringify(message));

    sock.onmessage = function(response){
      var res = JSON.parse(response.data);
      var contents = res.contents;
      if(contents.Created){
        alert("new project created");
        var fileList = document.getElementById('openproj');
        fileList.innerHTML += '<li><a href="#">'+name+'/</a></li>';
        currproject = name;


      }
      else{
        alert(contents.Reason);
      }
    }
}

function newfile()//works
{
	ntabs++;
    var name = prompt("name file");
    var message = {
        "nickname": nickname,
        "contents": "newfile "+name
    }
    sock.send(JSON.stringify(message));
    sock.onmessage = function(response){
      var res = JSON.parse(response.data);
      var contents = res.contents;
	  var numOfFiles = 0;
      if(contents.Created){
        alert("new file created");
        currfile = name;

		var textareas = document.getElementById("textareas");
		textareas.innerHTML += "<div id=\"class"+ntabs+"\" class=\"tabcontent\">\n\
<ul id='openproj'>\n\
<li>Solution Explorer</li>\n\
</ul>\n\
\n\
\n\
<textarea rows=\"10\" cols=\"25\" id=\"codespace\" onkeydown=\"Update()\">\n\
public class Test "+ntabs+"\n\
{\n\
	public static void main(String[] args)\n\
	{\n\
		//Your Code Here\n\
	}\n\
}</textarea>\n\
<textarea placeholder=\"Console\" id=\"consoleWindow\" rows=\"20\" cols=\"25\"></textarea>\n\
</div>\n\
";
	    var fileList = document.getElementById('openproj');
<<<<<<< HEAD
		fileList.innerHTML += '<li><a href="#">'+name+'</a></li>';
		
=======
		//if(num)
		//var tab1 = document.getElementById('tab1');
        fileList.innerHTML += '<li><a href="#">'+name+'</a></li>';

>>>>>>> d0edbcd086f95c97d4c7d779eaac6e08889de0d1
		var tabList = document.getElementById('tabs');
		tabList.innerHTML += '<li><a href="javascript:void(0)" class="tablinks" id="tab'+ntabs+'" onclick="openTab(event, \'class'+ntabs+'\')">'+name+'</a></li>';
		}
      else{
        alert(contents.Reason);
      }
    }
}

function message()
{//for chat
    var message = {
        "nickname": nickname,
        "contents": "message "+document.getElementById('chat').value
    }
    sock.send(JSON.stringify(message));

    sock.onmessage = function (response) {
      var res = JSON.parse(response.data);
      alert(res.contents);

    }
}

function newdir()//works
{
    var name = prompt("name new directory");
    var message = {
        "nickname": nickname,
        "contents": "newdir "+ name
    }
    sock.send(JSON.stringify(message));
    sock.onmessage = function(response){
      var res = JSON.parse(response.data);
      var contents = res.contents;
      if(contents.Created){
        alert("directory created");
        var fileList = document.getElementById('openproj');
        fileList.innerHTML += '<li><a href="#">'+name+'/</a></li>';
      }
      else{
        alert(contents.Reason);
      }
    }
}

function openproject()//works
{
    var message = {
        "nickname": nickname,
        "contents": "openproject"
    }
    sock.send(JSON.stringify(message));
    sock.onmessage = function(response){
        var res = JSON.parse(response.data);
        var contents = res.contents;
        if(contents.Opened){
          var fileList = document.getElementById('openproj');
          fileList.innerHTML = '';//empty out file explorer
          for(var i = 0; i < contents.Files.length; i++){
            fileList.innerHTML += '<li><a href="#">'+contents.Files[i]+'</a></li>';
          }


        }
        else{
          alert("no projects make one");
        }

    }

}

function run()
{
  var message = {
    "nickname": nickname,
    "contents": "message hellow world"
  }
  sock.send(JSON.stringify(message));

}

import React from 'react';
import Login from './login.component';
import IDE from './ide.component';
import $ from 'jquery';

class Main extends React.Component {
  constructor(props){
	super(props);
	this.state = {
	    connected:false,
	    errorMessage: null,
        terminalMessage: null,
        chatMessage: null,
	    files:{},
    	curdir:'/',
    	curfile:'',
        body:'',
        aceMode:'text',
        logs:{},/*for rtu*/
        rtuQ: [],
        updateflag:true,
	cb:0
	}; 
	this.webSocket = null;
	this.editor = null;
	this.attemptLogin = this.attemptLogin.bind(this);
	this.onWebSocketOpen = this.onWebSocketOpen.bind(this);
	this.onWebSocketMessage = this.onWebSocketMessage.bind(this);
	this.onWebSocketError = this.onWebSocketError.bind(this);
	this.onWebSocketClose = this.onWebSocketClose.bind(this);
  	
	/*File, Proj, Dir, Creator*/
   	this.create = this.create.bind(this);
   	this.build = this.build.bind(this);
        this.message = this.message.bind(this);
	this.changeBackground = this.changeBackground.bind(this);
	this.readFile = this.readFile.bind(this);
	this.sendPath = this.sendPath.bind(this);
    
	/*rtu*/
	this.setEditor = this.setEditor.bind(this);
	this.rtuUpdate = this.rtuUpdate.bind(this);
	this.rtuRcv = this.rtuRcv.bind(this);
	this.rtuEnQ = this.rtuEnQ.bind(this);
	this.rtuDeQ = this.rtuDeQ.bind(this);
	this.rtuAck = this.rtuAck.bind(this);
  }

  attemptReconnect(){
	console.log("Attempting to reconnect to the server " + this.props.url + ":" + this.props.port  + "...");
	this.webSocket = new WebSocket("ws://" + this.props.url + ":" + this.props.port);
	this.webSocket.onopen = this.onWebSocketOpen;
	this.webSocket.onmessage = this.onWebSocketMessage;
	this.webSocket.onerror = this.onWebSocketError;
	this.webSocket.onclose = this.onWebSocketClose;	
  }

  onWebSocketOpen(){
	var message = {
		"nickname": this.nickname,
		"contents": "connect"
	};
	this.webSocket.send(JSON.stringify(message));
  }

  onWebSocketMessage(response){
	console.log("Received message from the server: ");
	console.log(response);
	var res = JSON.parse(response.data);
	var contents = res.contents;
	switch(res.type)
	{	
		case "Connection-Accept"://Connected to Server
			if(contents.Accepted)
		    	{
			    this.setState({connected:true, files:contents.Files});			
			}
			else//Error for Connection
			{
			    this.setState({errorMessage:contents.Reason});
			}
			break;
	    /*File, Proj, Dir, Created*/
		case "Project-Created-Status":
			if(contents.Created)
			{
			    if(contents.nick == this.nickname)
			    {
			    /*needs to be connected to terminal component*/
                this.setState({terminalMessage:"Project: '"+contents.name+"' created.", files:contents.Files});
			    }
			    else
			    {
                    this.setState({terminalMessage:contents.nick+" Just Created Project: '"+contents.name+"'", files:contents.Files});
			    }
			}
			else
			{
			    this.setState({terminalMessage:contents.Reason});
			}
            this.setState({terminalMessage:null});
			break;
		case "Directory-Created-Status":
			if(contents.Created)
			{
			    if(contents.nick == this.nickname)
			    {
			    /*needs to be connected to terminal component*/
                    this.setState({terminalMessage:"Directory: '"+contents.dir+"' created.", files:contents.Files});
                    
			    }
			    else
			    {
                    this.setState({terminalMessage:contents.nick+" Just Created Directory: '"+contents.dir+"'", files:contents.Files});
			    }
			}
			else
			{
			    this.setState({terminalMessage:contents.Reason});
			}
            this.setState({terminalMessage:null});
			break;
		case "File-Created-Status":/*needs connection to solutionexplorer and terminal*/
			if(contents.Created)
			{
			    if(contents.nick == this.nickname)
			    {
			    /*needs to be connected to terminal component*/

                    this.setState({terminalMessage:"File: '"+contents.name+"' created.", files:contents.Files, body: contents.Content});
			    }
			    else
			    {
                    this.setState({terminalMessage:contents.nick+" Just Created File: '"+contents.name+"'", files:contents.Files});
			    }
			}
			else
			{
			    this.setState({terminalMessage:contents.Reason});
			}
            this.setState({terminalMessage:null});
			break;
        case "Read-File":
            /*check for later*/
           this.setState({body:contents.body});
           break;
		/*Chat and Console Messages*/
		case "Console":
		    /*add Message to Terminal component*/
		    break;
		case "Message-Broadcast":
            this.setState({chatMessage:contents}); 
		    break;
		/*Git cases*/
		case "Git":
		    /*add Message to Terminal component*/
		    break;
		case "Git-auth":
		    /*Do something*/
		    break;
		/*Build and Compile*/
		case "Compile-Running-Status":
		    /*add stuff for Terminal component*/
		    break;
		case "Code-Running-Status":
            this.setState({terminalMessage:contents.output});
		    break;

		case "RTU-Broadcast": //RTU 
			if (res.nickname == this.nickname)
			{
				break;
			}
			this.rtuRcv();
			break;
		default:
		    break;
	  }
  }

  onWebSocketError(error){
	console.log("WebSocket error: " + error.message);
	this.setState({errorMessage: error.message});
  }

  onWebSocketClose(){
	console.log("Lost connection to the server!");
	this.setState({errorMessage: "Lost connection to the server! Attempting to reconnect..."});
	this.attemptReconnect();
  }

  attemptLogin(nickname){
	this.nickname = nickname;
	if(this.nickname == "")
	{
		var error = "You cannot enter a blank nickname!";
		this.setState({errorMessage:error});
	}
	else
	{
		console.log("Nickname: " + nickname);
		console.log("Attempting login to host " + this.props.url + ":" + this.props.port + "...");
		this.webSocket = new WebSocket("ws://" + this.props.url + ":" + this.props.port);
		this.webSocket.onopen = this.onWebSocketOpen;
		this.webSocket.onmessage = this.onWebSocketMessage;
		this.webSocket.onerror = this.onWebSocketError;
		this.webSocket.onclose = this.onWebSocketClose;
	}
  }
	
  /*File, Proj, Dir Creator*/
  create(name, type)
  {
    var message = {
      "nickname": this.nickname
    }
    switch(type)
    {
      case "proj":
        message["contents"] = "newproject " + name;
        break;
      case "dir":
        message["contents"] = "newdir " + this.state.curdir+name;
        break;
      case "file":
        message["dir"] = this.state.curdir;
        message["contents"] = "newfile " + name;
        break
    }
      this.webSocket.send(JSON.stringify(message));
   } 
    build(type)
    {
        var message = {
            "nickname": this.nickname,
            "file": this.state.curfile,
            "dir": this.state.curdir,
            "contents": type
        }
        
        this.webSocket.send(JSON.stringify(message));
    }

    message(type, value)
    {
        var message = {
            "nickname": this.nickname,
            "contents": "message "+value
        }
        this.webSocket.send(JSON.stringify(message));
    }
    readFile(path)
    {
        var split = path.split('/');
        var fileName = split[split.length-1];
        split.pop();
        var dir = split.join('/');
        var message = {
            "nickname": this.nickname,
            "dir": dir, 
            "contents": "readfile "+ fileName
        }
        this.webSocket.send(JSON.stringify(message));
	this.setState({curfile:fileName});
    }
    
    sendPath(path)
    {
        console.log("main component path: "+path);
        this.setState({curdir:path});
    }
    changeBackground()
	{
		if(this.state.cb == 0)
		{
			$('#settings').click(function() {
				$('body').css('background', 'linear-gradient(to right, rgba(213,236,246,1) 0%, rgba(59,195,237,1) 50%, rgba(222,240,248,1) 100%');
				$('body').css('filter', 'progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#d5ecf6\', endColorstr=\'#def0f8\', GradientType=1');
		
		});
			this.setState({cb:1});
		}
		if(this.state.cb == 1)
		{
			$('#settings').click(function() {
				$('body').css('background', 'linear-gradient(to right, rgba(198,1,47,1) 0%, rgba(162,1,39,1) 44%, rgba(122,0,29,1) 100%');
				$('body').css('filter', 'progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#c6012f\', endColorstr=\'#7a001d\', GradientType=1');
		
		});
			this.setState({cb:2});
		}
		if(this.state.cb == 2)
		{
			$('#settings').click(function() {
				$('body').css('background', 'radial-gradient(ellipse at center, rgba(242,246,248,1) 0%, rgba(216,225,231,1) 26%, rgba(181,198,208,1) 57%, rgba(224,239,249,1) 100%');
				$('body').css('filter', 'progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#f2f6f8\', endColorstr=\'#e0eff9\', GradientType=1');
		});
			this.setState({cb:0});
		}
	}

    setEditor(editor){
	this.editor = editor;	
    }

    /*RTU code goes here*/
    rtuUpdate(e)
    {

	if (! this.state.updateflag) 
	{
		return;
	}
//	this.enQ(e);
	e['indexstart'] = this.editor.session.doc.positionToIndex(e.start);//Rugs editor needs to be removed and changed with something else
	e['indexend'] = e.indexstart + e.lines.join('\n').length;
	var message = {
		"nickname": this.nickname,
		"dir": this.state.curdir,
		"file": this.state.curfile,
		"change": e,
		"contents": "rtu"
	};
	this.webSocket.send(JSON.stringify(message));
    }

    rtuRcv(){
	var message = {
		"nickname": this.nickname,
		"dir": this.state.curdir,
		"file": this.state.curfile,
		"contents": "gotupdate"
	};
	sock.send(JSON.stringify(message));

	//e = adjustchange(e);  // adjust
	updateflag = false; // implement edit
	if (e.action == "insert")
	{
		this.editor.session.doc.insert(e.start, e.lines.join('\n'));
	}
	else
	{
		this.editor.session.doc.remove({"start": e.start, "end": e.end});
	}
	updateflag = true;	
    }

    rtuEnQ(e){
	this.rtuQ.push(e);
    }
    
    rtuDeQ(){
	this.rtuQ.splice(0, 1);
    }

    rtuAck(){
	this.rtuDeQ();
    }
	
  render(){
    var currComponent = <Login attemptLogin={this.attemptLogin} errorMessage={this.state.errorMessage} url={this.props.url}/>;
    if(this.state.connected)
	currComponent = <IDE rtuUpdate={this.rtuUpdate} sendPath={this.sendPath} readFile={this.readFile} body={this.state.body} files={this.state.files} aceMode={this.state.aceMode} chatMessage={this.state.chatMessage} terminalMessage={this.state.terminalMessage} message={this.message} create={this.create} build={this.build} changeBackground={this.changeBackground} errorMessage={this.state.errorMessage} editorOnLoad={this.setEditor}/>;
    return(
	<div>
		{currComponent}
	</div>
    )

  }
}
export default Main

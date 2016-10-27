var WebSocketServer = require('ws').Server;
var fs = require('fs');
var configObj = {};
function configExists()
{
	var exists = true;
	try
	{
		fs.accessSync("server.conf");
	}
	catch(err)
	{
		exists = false;
	}
	return exists;
}

function createConfig()
{
	console.log("No server.conf file detected! Generating server.conf...");	
	try
	{
		fs.writeFileSync("server.conf", "{\n\t\"port\": 8080,\n\t\"max_clients\": 8,\n\t\"projects\": [],\n\t\"current_project\": \"\",\n\t\"current_file\": \"\",\n\t\"current_directory\": \"\"\n}");
		console.log("Successfully generated server.conf!");
	}
	catch(err)
	{
		console.log("Failed to generate server.conf! Reason: " + err);
	}
}

function readConfig()
{
	try
	{
		configObj = JSON.parse(fs.readFileSync("server.conf"));
	}
	catch(err)
	{
		console.log("Failed to read server.conf! Reason: " + err);
	}
}

function writeConfig()
{
	try
	{
		fs.writeFileSync("server.conf", JSON.stringify(configObj, null, "\t"));
	}
	catch(err)
	{
		console.log("Failed to write server.conf! Reason: " + err);
	}
}

function createFile(fileName)
{
	if(!fs.existsSync(configObj.current_project + "/" + fileName))
	{
		fs.writeFileSync(configObj.current_project + "/" + fileName, "");
		configObj.current_file = fileName;	
	}	
	else
	{
		console.log("Failed to create a file with the name '" + fileName + "' within the current project because a file with that name already exists!");
		return false;
	}
	return true;		
}

function createDirectory(dirName)
{
	if(!fs.existsSync(configObj.current_project + "/" + dirName))
	{
		fs.mkdirSync(configObj.current_project + "/" + dirName);
		configObj.current_directory = dirName;	
	}	
	else
	{
		console.log("Failed to create a directory with the name '" + dirName + "' within the current project because a file with that name already exists!");
		return false;
	}
	return true;		
} 

function createProject(projectName)
{
	if(!fs.existsSync(projectName))
	{
		fs.mkdirSync(projectName);	
		configObj.projects.push(projectName);
		writeConfig();
	}	
	else
	{
		console.log("Failed to create a project with the name '" + projectName + "' since one already exists!");
		return false;
	}
	return true;			
}

function getProjectFiles()
{
	var files = null;
	try
	{
		files = fs.readdirSync(configObj.current_project);
	}
	catch(err)
	{
		console.log("Failed to read files from the current project directory!");
	} 
	return files;
}

function broadcastResponse(connectionList, responseString)
{
	connectionList.forEach(function(conn)
	{
		conn.connection.send(responseString);								
	});
}

function runServer(portNumber)
{
	console.log("Running the IDE server on port " + portNumber + "...");
	var server = new WebSocketServer({port: portNumber});
	var connectionList = []; 
	server.on('connection', function connection(ws)
	{
		console.log('New connection attempted!');
		ws.on('message', function incoming(message)
		{
			console.log('received: %s', message);
			var response = {"type": "", "contents": null};
			try
			{
				var json_message = JSON.parse(message);
				var nickname = json_message.nickname;
				var contents = json_message.contents;
				var command = contents.split(' ')[0].toLowerCase();
				var spaceIndex = contents.indexOf(' ');
				var params = contents.substring(spaceIndex + 1, contents.length - command.length);
				switch(command)
				{
					case "connect":
						response.type = "Connection-Accept";
						connectionList.forEach(function(conn)
						{
							if(conn.nickname == nickname)
							{
								response.contents = {"Accepted": false, "Reason": "The nickname you selected is already in use on this server. Please enter a unique nickname and try again."};
								console.log("Rejected incoming connection for taken nickname.");
							}
						});
						if(response.contents == null)
						{
							connectionList.push({"connection":ws,"nickname":nickname});
							response.contents = {"Accepted": true};
							console.log("Accepted incoming connection from user '"+ nickname  +"'.");
						}
						ws.send(JSON.stringify(response));
						break;
					case "compile":
						console.log("Received command to compile!");
						break;
					case "message":
						console.log("Received chat message: " + params);
						break;
					case "newproject":
						response.type = "Project-Created-Status";
						if(!createProject(params))
						{
							response.contents = {"Created": false, "Reason": "Failed to create a new project with the name '" + params + "'! That project name is already taken."};				
						}
						else
						{
							response.contents = {"Created": true};
						}
						ws.send(JSON.stringify(response));
						break;
					case "newfile":
						response.type = "File-Created-Status";
						if(!createFile(params))
						{
							response.contents = {"Created": false, "Reason": "Failed to create a new file with the name '" + params + "'! That file already exists in the current project."};				
						}
						else
						{
							response.contents = {"Created": true};
						}
						ws.send(JSON.stringify(response));
						break;
					case "newdir":
						response.type = "Directory-Created-Status";
						if(!createFile(params))
						{
							response.contents = {"Created": false, "Reason": "Failed to create a new directory with the name '" + params + "'! That file already exists in the current project."};				
						}
						else
						{
							response.contents = {"Created": true};
						}
						ws.send(JSON.stringify(response));
						break;
					case "openproject":
						response.type = "Project-Open-Response";
						configObj.current_project = params;
						var files = getFiles();
						if(files != null)
							response.contents = {"Opened": true, "Files": files};
						else
							response.contents = {"Opened": false};
						ws.send(JSON.stringify(response));
						break;
					case "updatefile":
						response.type = "File-Update-Response";
						fileToUpdate = params.split(' ')[0];
						newText = params.split(' ')[1];
						console.log("Received a command to update the file '" + fileToUpdate + "'");
					default:
						response.type = "Error";
						response.contents = "Unrecognized command '" + command  + "'!";
						break;
				}
			}
			catch(err)
			{
				response.type = "Error";
				response.contents = "The message received did not match the proper protocol!\n Message: " + message + "\nExact error: " + err;
				console.log(err);
			}			
		});
		ws.on('close', function()
		{
			var found = false;
			connectionList.forEach(function(conn)
			{
				if(conn.connection == ws)
				{
					found = true;
					console.log("User '" + conn.nickname  + "' has disconnected!");
					connectionList.splice(connectionList.indexOf(conn), 1);
				}
			});	
			if(!found)
			{
				console.log("An unknown client disconnected!");
			}					
		});
	});
}

if(!configExists())
	createConfig();

readConfig();

runServer(configObj.port);

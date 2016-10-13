/*

Klappt jetzt alles über Commands bzw Console!
Never Change a running System!

*/
var email = '';
var password = '';
var game = '';
var time=0;
var log_new_reconnect=false;
var readline = require('readline');
var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
var connect_state=0;

var Discord = require("discord.js");
var client = new Discord.Client();
client.on("message", function (msg) {
	if(msg.author !== client.user) {
		// Nicht deine nachricht, also ignorieren!
		return;
	}
	const command_name = msg.content.split(" ")[0]; // Befehl
	const params = msg.content.split(" ").slice(1); // Befehlsparameter
	
	var prefix = "/"; // Command Prefix
	if(!msg.content.startsWith(prefix)) return; // Naja wenn deine Nachricht überhaupt kein Command ist...
	
	if(command_name==prefix+"game") {
		game=params.join(" ");
		client.user.setStatus('online', game).then(user => {console.log("BOT: --- :Change Game to : "+game+"");}).catch(console.log);
		msg.delete();
	}
	
	// Hier könnte was passieren wenn Nachrichten eintreffen!
});

client.on('ready', function () {
	time = Date.now();
	log_new_reconnect=true;
	console.log(time + " BOT: --- :Ready!");
	console.log(time + " BOT: --- :Commands: ");
	console.log(time + " BOT: --- : /game gamename");
});

client.on('disconnect', () => {
	time = Date.now();
	console.log(time + " BOT: --- :Disconnect!");
	client.login(email,password);
});
client.on('reconnecting', () => {
	if (log_new_reconnect) {
		time = Date.now();
		log_new_reconnect=false;
		console.log(time + " BOT: --- :Reconnecting!");
		client.login(email,password);
	}
});

client.on('error', (error) => {
	time = Date.now();
	log_new_reconnect=false;
	console.log(time + " BOT: --- :Error!");
	console.log(time + " BOT: --- :" + error + "");
});
client.on('warn', (warning) => {
	time = Date.now();
	log_new_reconnect=false;
	console.log(time + " BOT: --- :Warning!");
	console.log(time + " BOT: --- :" + warning + "");
});

function do_login() {
	if (connect_state==0) {
		rl.setPrompt('E-Mail: ');
		rl.prompt();
	}
	if (connect_state==1) {
		rl.setPrompt('Passwort: ');
		rl.prompt();
	}
}

rl.on('line', function(line) {
	if (connect_state==1) {
		password=line;
		connect_state++;
		console.log('\033[2J');
		client.login(email,password);
	}
	if (connect_state==0) {
		email=line;
		connect_state++;
		do_login();
	}
	if (connect_state==2) {
		rl.close();
	}
});
do_login();

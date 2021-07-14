const Discord = require('discord.js');
const allowUserBotting = require('discord.js.userbot');
const client = new Discord.Client();
allowUserBotting(client);
client.login(require("./token.json").token);

client.on('guildMemberAdd', member => {
  console.log("\x1b[36m%s\x1b[0m",member);
});

client.on('message', message => {
  if (message.guild.id=="126798577153474560") {
    console.log("[" + message.guild.name + "][" + message.channel.name + "] " + message.author.username + ": " + message.content);
  }
});


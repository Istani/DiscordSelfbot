var envpath = __dirname + '/.env';
var config = require('dotenv').config({ path: envpath });

var Discord = require('discord.js-selfbot-v13');
var client = new Discord.Client();

var Datastore = require('@seald-io/nedb');
var Guilds = new Datastore({ filename: 'data/guilds.json', autoload: true });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  //client.user.setBanner('https://sig.anidb.net/images/signatures/31377/1n163/').then(user => console.log(`New banner set!`)).catch(console.error);
});

client.on('messageCreate', async function (message) {
  if (message.content == "!git") {
    const { spawn } = require('child_process');
    spawn('git', ['add', "."]);
    spawn('git', ['commit', "-m", "'!git'"]);
    spawn('git', ['push']);
    spawn('git', ['pull']);
    spawn('pm2', ['restart', 'all']);
  }
  if (message.guild == null) {
    var pm=JSON.parse(JSON.stringify(message));
    pm.author=JSON.parse(JSON.stringify(message.author));
    pm.guildId="DM";
    pm.guild = {};
    pm.guild.id='DM';
    pm.guild.name='Private Message'; 
    message=pm;
  }
  var c1 = await check_guild(message.guild);
  if (c1 == false) return;

  var output=
    "["+BigInt(message.createdTimestamp).toString(16).toUpperCase()+"]" +
    "["+message.guild.name+"]" + 
    "["+BigInt(message.channelId).toString(16).toUpperCase()+"]" +
    
    ": " + 
    message.author.username + ": " +
    message.content;
    
  console.log(output);
  //console.log(message);
});

client.login(process.env.Token);


async function check_guild(guild) {
  //console.log(guild);
  try {
    var guild_obj={_id: guild.id, name: guild.name};
    
    const guilds = await Guilds.findOneAsync({ _id: guild_obj._id });
    if (guilds==null) {
      console.log("Added Guild: "+guild_obj.name);
      guild_obj.visible=false;
      await Guilds.insertAsync(guild_obj);
    } else {
      guild_obj=guilds;
    }
    //console.log(guild_obj);
    return guild_obj.visible;
  } catch (e) {
    console.log(e);
    console.log(guild);
    return false;
  }
}
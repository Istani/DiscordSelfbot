var envpath = __dirname + '/.env';
var config = require('dotenv').config({ path: envpath });
var fs = require('fs');

var Discord = require('discord.js-selfbot-v13');
var client = new Discord.Client();

var Datastore = require('@seald-io/nedb');
var Guilds = new Datastore({ filename: 'data/guilds.json', autoload: true });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  //client.user.setBanner('https://sig.anidb.net/images/signatures/31377/1n163/').then(user => console.log(`New banner set!`)).catch(console.error);
});

client.on('messageCreate', async function (org_message) {
  try {
    var message=org_message;
    /*
    if (message.content == "!git") {
      await spawnAsync('git', ['add', "."]);
      await spawnAsync('git', ['commit', "-m", "'!git'"]);
      await spawnAsync('git', ['push']);
      await spawnAsync('git', ['pull']);
      await spawnAsync('pm2', ['restart', 'all']);
    }
    */
    
    var pm=JSON.parse(JSON.stringify(message));
    pm.author=JSON.parse(JSON.stringify(message.author));
    pm.channel=JSON.parse(JSON.stringify(message.channel));
    if (message.guild == null) {
      pm.guildId="DM";
      pm.guild = {};
      pm.guild.id='DM';
      pm.guild.name='Private Message'; 
    } else {
      pm.guild=JSON.parse(JSON.stringify(message.guild));
    }
    if (typeof message.channel.name == undefined) {
      pm.channel.name="DM";
    }
    pm.attachments=JSON.parse(JSON.stringify(message.attachments));
    pm.embeds=JSON.parse(JSON.stringify(message.embeds));
    pm.stickers=JSON.parse(JSON.stringify(message.stickers));
    message=pm;

    var c1 = await check_guild(message.guild);
    if (c1 == false) return;

    var output=
      "["+BigInt(message.createdTimestamp).toString(16).toUpperCase()+"]" +
      "["+message.guild.name+"]" + 
      "["+BigInt(message.channelId).toString(16).toUpperCase()+"]" +
      "["+message.channel.name+"]:" + 
      message.author.username + ": ";
    var output_msg = message.content;
      
    for (var i = 0; i < message.attachments.length; i++) {
      output_msg+="\n<img src='" +message.attachments[i].attachment + "'>";
    }
    for (var i = 0; i < message.embeds.length; i++) {
      output_msg+="\n<img src='" +message.embeds[i].url + "'>";
    }
    for (var i = 0; i < message.stickers.length; i++) {
      output_msg+="\n<img src='https://media.discordapp.net/stickers/" + message.stickers[i].id + "."+message.stickers[i].format + "'>";
    }
    
    //console.log(message);
    if (output_msg.trim() == "") console.log(org_message);
    console.log(output + output_msg);
    
    const urlRegex = /https?:\/\/[^\s']+/g;
    const urls = output_msg.match(urlRegex);
    if (urls!=null) {
      //console.log(urls);
      for (var i = 0; i < urls.length; i++) {
        var downloadpath=__dirname + "/temp/" + message.id + "_" + i;
        await downloadFile(urls[i], downloadpath);
      }
    }
  } catch (e) {
    console.log(e);
    console.log(org_message);
    //process.exit(1);
  }
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

function spawnAsync(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    const child = spawn(command, args, options);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    child.stderr.on('data', (data) => {
      console.log(data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}


async function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    if (url.startsWith('https')) {
      var http = require('https');
    } else {
      var http = require('http');
    }

    const file = fs.createWriteStream(destination);
    http.get(url, (response) => {
      if (response.statusCode >= 400) {
        return reject(new Error(`Failed to download file: ${response.statusMessage}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve('File downloaded successfully '+ destination));
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => reject(err)); // Delete the file if an error occurs
    });
  });
}
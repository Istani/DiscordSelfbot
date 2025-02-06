var envpath = __dirname + '/.env';
var config = require('dotenv').config({ path: envpath });
var fs = require('fs');
var path = require('path');

var axios = require('axios');
var FormData = require('form-data');

var Discord = require('discord.js-selfbot-v13');
var client = new Discord.Client();

var Datastore = require('@seald-io/nedb');
var Guilds = new Datastore({ filename: 'data/guilds.json', autoload: true });

const service = "Discord";

// At Restart delete TempFolder
var temp_dir="./temp";
fs.readdir(temp_dir, (err, files) => {
  if (err) throw err;
  for (const file of files) {
    if (file !== '.gitkeep') {
      fs.unlink(temp_dir + "/" + file, err => {
        if (err) throw err;
      });
    }
  }
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  //client.user.setBanner('https://sig.anidb.net/images/signatures/31377/1n163/').then(user => console.log(`New banner set!`)).catch(console.error);
});

client.on('messageCreate', async function (org_message) {
  try {
    var upload_data={};
    var message=org_message;
    /* 
    // Update/Pull Changes in Git
    if (message.content == "!git") {
      await spawnAsync('git', ['add', "."]);
      await spawnAsync('git', ['commit', "-m", "'!git'"]);
      await spawnAsync('git', ['push']);
      await spawnAsync('git', ['pull']);
      await spawnAsync('pm2', ['restart', 'all']);
    }
    */
    
    // Modify Data to compareable JSON
    var pm=JSON.parse(JSON.stringify(message));
    pm.author=JSON.parse(JSON.stringify(message.author));
    pm.channel=JSON.parse(JSON.stringify(message.channel));
    if (message.guild == null) {
      pm.guildId="DM";
      pm.guild = {};
      pm.guild.id='DM';
      pm.guild.name='Private Message'; 
      pm.guild.iconURL=message.author.avatarURL;
      pm.channel.name="DM";
    } else {
      pm.guild=JSON.parse(JSON.stringify(message.guild));
    }
    pm.attachments=JSON.parse(JSON.stringify(message.attachments));
    pm.embeds=JSON.parse(JSON.stringify(message.embeds));
    pm.stickers=JSON.parse(JSON.stringify(message.stickers));
    message=pm;

    // Checking if this Message is something we care about
    var c1 = await check_guild(message.guild);
    if (c1 == false) return;

    fs.writeFileSync('temp/message.json', JSON.stringify(message, null, 2));

    // Preparing Data for further software/debug
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
      message.stickers[i].format=message.stickers[i].format.toLowerCase();
      if (message.stickers[i].format=="apng") message.stickers[i].format="png"
      output_msg+="\n<img src='https://media.discordapp.net/stickers/" + message.stickers[i].id + "."+message.stickers[i].format + "'>";
    }
    // Outputting Data:
    if (output_msg.trim() == "") console.log(org_message);
    console.log(output + output_msg);
    
    // Check Data for URLs
    const urlRegex = /https?:\/\/[^\s']+/g;
    const urls = output_msg.match(urlRegex);
    if (urls!=null) {
      for (var i = 0; i < urls.length; i++) {
        var downloadpath=__dirname + "/temp/" + message.id + "_" + i;
        await downloadFile(urls[i], downloadpath);

        if (message.guild.id=="DM") {
          message.guild.id=client.user.id;
        }
        upload_data = {
          service: service,
          jid: message.author.id + '@' + service,
          tags: [
            service+'-Bot',
            message.channel.name,
            message.guild.name
          ],
          to: [
            message.guild.id + '@'+service+'-Server'
          ],
          message: ""
        };
        await uploadFile(downloadpath, upload_data);
      }

      // Adding User
      upload_data = {
        service: service,
        jid: message.author.id + '@' + service,
        username: message.author.username,
        discriminator: message.author.discriminator,
        displayName: message.author.username,
        global_name: message.author.global_name,
        id: message.author.id,
        avatar: message.author.avatar
      };
      await uploadUser(upload_data);

      // Adding Server
      upload_data = {
        service: service+'-Server',
        jid: message.guild.id + '@'+service+'-Server',
        username: message.guild.name,
        discriminator: 0,
        displayName: message.guild.name,
        global_name: "",
        id: message.guild.id,
        avatar: message.author.avatar//message.guild.iconURL
      };
      await uploadUser(upload_data);

      // iconURL - bannerURL
    }
    
  } catch (e) {
    console.log(e);
    console.log(org_message);
  }
});

client.login(process.env.Token);

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

async function check_guild(guild) {
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
    return guild_obj.visible;
  } catch (e) {
    console.log(e);
    console.log(guild);
    return false;
  }
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
      fs.unlink(destination, () => reject(err));
    });
  });
}

async function uploadUser(custom_data) {
  var uploadUrl = "https://www.yours-mine.com/api/user"

  try {
    // Create a form data object
    //const form = new FormData();
    var formBody = [];
    Object.keys(custom_data).forEach(key => {
      if (typeof custom_data[key] != "undefined") {
        if (typeof custom_data[key] == "array" || typeof custom_data[key] == "object") {
          for (var i = 0; i < custom_data[key].length; i++) {
            //form.append(key+"["+i+"]", custom_data[key][i]);
            var encodedKey = encodeURIComponent(key+"["+i+"]");
            var encodedValue = encodeURIComponent(custom_data[key][i]);
            formBody.push(encodedKey + "=" + encodedValue);
          }
        } else {
          //form.append(key, custom_data[key]);
          var encodedKey = encodeURIComponent(key);
          var encodedValue = encodeURIComponent(custom_data[key]);
          formBody.push(encodedKey + "=" + encodedValue);
        }
      }
    });
    formBody = formBody.join("&");
    
    // Send POST request to upload URL
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formBody,//form,
      headers: {
        "Content-type": "application/x-www-form-urlencoded"
      }
    }); 

    console.log('User uploaded successfully');
  } catch (error) {
    console.error('Error uploading User:', error.message);
  }
}

async function uploadFile(filePath, custom_data) {
  var uploadUrl = "https://www.yours-mine.com/api/send"

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist');
    }

    // Create a form data object
    const form = new FormData();
    form.append('filename', fs.createReadStream(filePath), {
      filename: path.basename(filePath)
    });
    Object.keys(custom_data).forEach(key => {
      if (typeof custom_data[key] == "array" || typeof custom_data[key] == "object") {
        for (var i = 0; i < custom_data[key].length; i++) {
          form.append(key+"["+i+"]", custom_data[key][i]);
        }
      } else {
        form.append(key, custom_data[key]);
      }
    });
    

    // Send POST request to upload URL
    const response = await axios.post(uploadUrl, form, {
      headers: {
        ...form.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('File uploaded successfully');
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error('Error uploading file:', error.message);
  }
}



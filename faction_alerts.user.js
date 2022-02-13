// ==UserScript==
// @name        Faction Alerts
// @author      rDacted
// @version     0.1
// @namespace http://tampermonkey.net/
// @description Place faction alerts on the top of the screen
// @grant       none
// @run-at      document-start
// @match       https://www.torn.com/*
// @updateURL    https://github.com/cornejo/torn_faction_alerts/raw/master/faction_alerts.user.js
// @downloadURL  https://github.com/cornejo/torn_faction_alerts/raw/master/faction_alerts.user.js
// ==/UserScript==

console.log("Faction alerts started");
//var CHANNEL = "Faction:9176";
//var CHANNEL = "Global";
//var CHANNEL = "Users:Regret,rDacted;2544467;2670953";
var CHANNEL = "Users:itogyu,rDacted;2670953;2744349";
var PREFIX = "!chain ";
var BG_COLOUR = "red";
var TEXT_COLOUR = "black";
var TEXT_SIZE = "2em";
var USE_TIME = false;

var firstUpdateDone = false;

function time_to_string(date)
{
    if( USE_TIME == false )
    {
        return ""
    }

    var day = String(date.getUTCDate()).padStart(2, '0');
    var month = String(date.getUTCMonth()).padStart(2, '0');
    var year = String(date.getUTCFullYear()).padStart(4, '0');
    var hours = String(date.getUTCHours()).padStart(2, '0');
    var minutes = String(date.getUTCMinutes()).padStart(2, '0');
    var seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} `;
}

function chain_alert_text(txt)
{
    var alert_div = document.getElementById("alert-div");
    if( alert_div == null)
    {
        console.log("Alert div being created");
        var header_root = document.getElementById("header-root");
        alert_div = document.createElement("div");
        alert_div.setAttribute("id", "alert-div");
        header_root.before(alert_div);
    }

    alert_div.setAttribute("style", `background-color: ${BG_COLOUR};;color: ${TEXT_COLOUR};text-align: center; font-size: ${TEXT_SIZE};`);

    console.log(txt);
    alert_div.innerText = txt;
}

function chain_alert_msg(msg)
{
    var player_name = msg.senderName;
    var player_id = msg.senderId;
    var message_time = time_to_string(new Date(msg.time * 1000));
    var message_text = msg.messageText.substring(PREFIX.length);

    if( message_text == "clear" )
    {
        var alert_div = document.getElementById("alert-div");
        if( alert_div != null)
        {
            alert_div.remove();
        }

        localStorage.removeItem("alert_message");
    }
    else
    {
        var complete_message = `${message_time}${player_name}[${player_id}]: ${message_text}`;

        chain_alert_text(complete_message);

        // Store it for later
        localStorage.setItem("alert_message", complete_message);
    }
}

function first_update()
{
    console.log("Doing first update");
    var last_message = localStorage.getItem("alert_message");
    if( last_message != null )
    {
        chain_alert_text(last_message);
    }
}

var _WS = WebSocket
WebSocket = function (url, protocols)
{
    var WSObject
    this.url = url
    this.protocols = protocols
    if (!this.protocols) { WSObject = new _WS(url) } else { WSObject = new _WS(url, protocols) }

    WSObject.addEventListener('message', function(event)
                              {
        if(firstUpdateDone == false)
        {
            first_update();
            firstUpdateDone = true;
        }

        if(event.origin == "wss://ws-chat.torn.com")
        {
            var data = JSON.parse(event.data);
            for (const msg of data.data)
            {
                if("roomId" in msg &&
                   "messageText" in msg &&
                   msg.roomId == CHANNEL &&
                   msg.messageText.startsWith(PREFIX))
                {
                    chain_alert_msg(msg);
                }
                else
                {
                    if("roomId" in msg)
                    {
                        console.log(msg.roomId);
                    }
                }
            }
        }
    });

    return WSObject
}

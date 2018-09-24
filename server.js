'use strict';

// Imports dependencies and set up http server
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const APIAI_TOKEN = process.env.APIAI_TOKEN;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

const
    request = require('request'),
    express = require('express'),
    bodyParser = require('body-parser'),
    apiai = require('apiai');

const apiaiApp = apiai(APIAI_TOKEN);


const app = express();
app.use(bodyParser.json());// creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));


// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {

    let body = req.body;

    // Checks this is an event from a page subscription
    if (body.object === 'page') {
        body.entry.forEach(function (entry) {
            let webhook_event = entry.messaging[0];

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } 
    });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }

});


// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    let VERIFY_TOKEN = "a4Uac9a2e"

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {
        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});


// Handles messages events
function handleMessage(event) {


    let sender = event.sender.id;
    let text = event.message.text;
    let apiai = apiaiApp.textRequest(text, {
        sessionId: 'tabby_cat'
      });

      apiai.on('response', (response) => {        
        callSendAPI(sender, response);          
      });
 

    apiai.on('error', (error) => {
        console.log(error);
    });

    apiai.end();
}

function callSendAPI(sender_psid, response) {
    // Construct the message body
    let aiText = response.result.fulfillment.speech;
 console.log(aiText);
  
   
    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json":   {  
          recipient: {id: sender_psid},
          message: {text: aiText}
        }
    }, (err) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}
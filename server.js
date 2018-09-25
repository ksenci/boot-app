'use strict';

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const CLIENT_ACCESS_TOKEN = process.env.APIAI_TOKEN;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

const
    request = require('request'),
    express = require('express'),
    bodyParser = require('body-parser'),
    apiai = require('apiai');

const apiaiApp = apiai(CLIENT_ACCESS_TOKEN);


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
            if (webhook_event.message) {
                handleMessage(webhook_event);
            }
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }

});


// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

 

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
        sessionId: '5lPa5c80d'
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

    let message = response.result.fulfillment.speech;

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": {
            recipient: { id: sender_psid },
            message: { text: message }
        }
    }, (err) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}


// Post method for calling openWeatherMap Current Weather API 
app.post('/weather', (req, res) => {
    if (req.body.queryResult.action === 'weather') {
        let city = req.body.queryResult.parameters['geo-city'];
        let restUrl = 'http://api.openweathermap.org/data/2.5/weather?q=' + city + '&APPID=' + WEATHER_API_KEY;
        request.get(restUrl, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                let json = JSON.parse(body);
                let tempMinC = ~~(json.main.temp_min - 273.15);
                let tempMaxC = ~~(json.main.temp_max - 273.15);
                let message = 'Current weather in ' + json.name + ': ' + json.weather[0].description + '.\nThe temperature is from ' + tempMinC + ' to ' + tempMaxC + ' ℃.'
                return res.json({
                    fulfillmentText: message,
                    source: "Weather"
                });
            } else {
                let errorMessage = 'Error finding weather for requested city';
                return res.status(400).json({
                    status: {
                        code: 400,
                        errorType: errorMessage
                    }
                });
            }
        })
    }

});

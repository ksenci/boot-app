# Facebook Messenger Weather Bot

 Facebook Messenger Weather Bot is bot service that reports on the current weather fot a given city. The service is a node.js express application. 
 It integrates with
* [Facebook Messenger](https://developers.facebook.com/docs/messenger-platform),
* [Open Weather Map API](https://openweathermap.org/current),
* [API.ai](https://dialogflow.com/)
 
## Requirements:

* Setting up a Facebook Messenger App 
* Configuring the webhook
* Using API.ai Small Talk domain and creating a custom Intents
 
#### Environment Variables

* VERIFY_TOKEN - required to ensure webhook is authentic and working
* PAGE_ACCESS_TOKEN - generated token, required to start using the API
* WEATHER_API_KEY - API key required in url for calling Open Weather Map API
* CLIENT_ACCESS_TOKEN - access tokens used for making queries

 
 ## Service

 Webhook server is receiving the message from a user via Facebook Messenger, then passed the text content to  API.ai. Once it responded, the response event was triggered, and the result was sent back to Facebook Messenger.

 It exposes the following paths:
* /webhook - GET request used to webhook verification
* /webhook - POST request used for receiving messages from the Facebook
* /weather - POST request used for calling Open Weather Map API


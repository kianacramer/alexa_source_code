/***********************************************************************
               AMAZON ALEXA SKILL - RAY OF SUNSHINE
This skill allows users with solar panels to see how much power they're
generating.
Users can also use this skill to predict power that their system is
capable of producing in the future.
**********************************************************************/

'use strict';

//required for API usage
var https = require('https');

//YOU WILL NEED TO RUN 'npm install request-promise' before using the below module
//I wrote this module to use promises
//use as follows:
//
//solar.solarPanelDataRequest(address)
//  .then(function(response){
//      DO SOMETHING WITH RESPONSE!!!!!
//   });
var solar = require('./solar-panel-api');

/**************************************************************/
///////////////// HELPER FUNCTIONS /////////////////////////////
/**************************************************************/

function buildSpeechletResponse (title, output, repromptText, shouldEndSession) {
  return {
    outputSpeech: {
      type: "PlainText",
      text: output,
    },
    card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
    reprompt: {
        outputSpeech: {
            type: 'PlainText',
            text: repromptText,
        },
    },
    shouldEndSession,
  };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}

/**************************************************************
             FUNCTIONS THAT TELL ALEXA WHAT TO DO
**************************************************************/

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Welcome to Ray of Sunshine. '
        + 'Please tell me the location of your system '
        + 'by saying, my location is Louisville.';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Please tell me your location.';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for using Ray of Sunshine. Alternative energy is amazing!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function createLocationAttributes(locationGiven) {
  return {
    locationGiven,
  };
}

function getLocation (intent, session, callback) {
  const cardTitle = intent.name;
  let sessionAttributes = {};
  var repromptText = '';
  const shouldEndSession = false;
  let speechOutput = '';

  if (intent.slots.Location) {
    const locationGiven = intent.slots.Location.value;
    sessionAttributes = createLocationAttributes(locationGiven);
    speechOutput = `I now know the location of your system is ${locationGiven}. You can ask me how much power you're `
                      + `producing in ${locationGiven}.`;
    repromptText = `You can ask me how much power you're producing in ${locationGiven}.`;
  }
  else {
    speechOutput = "I'm not sure what your location is. Try again.";
  }

  callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getPowerValue (intent, session, callback) {
  var locationGiven;
  const cardTitle = intent.name;
  var sessionAttributes = {};
  var repromptText = null;
  var shouldEndSession = false;
  var speechOutput = '';

  if (session.attributes) {
    locationGiven = session.attributes.locationGiven;
  }

  solar.solarPanelDataRequest(locationGiven)
    .then(function(response) {
      var responseData = JSON.parse(response);
      var powerValue = responseData.outputs.ac_annual;
      speechOutput = `Your power output for the year in ${locationGiven} is: ${powerValue} kilowatt hours in AC.`;
      callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });
}


function createDateAttributes(date) {
  return {
    date,
  };
}

function createMonthAttributes(month) {
  return {
    month,
  };
}

function getPowerValueAtDate (intent, session, callback) {
  var locationGiven, date;
  var shouldEndSession = false;
  var repromptText = null;
  var speechOutput = '';
  var cardTitle = intent.name;
  var sessionAttributes = {};
  date = intent.slots.Date.value;

  if (session.attributes) {
    locationGiven = session.attributes.locationGiven;
  }

  solar.solarPanelDataRequest(locationGiven)
    .then(function(response) {
      var responseData = JSON.parse(response);
      var powerValue = solar.powerForDate(date, responseData);
      speechOutput = `Your power output for ${date} in ${locationGiven} is: ${powerValue} kilowatt hours in AC.`;
      callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });
}

function getPowerValueAtMonth (intent, session, callback) {
  var locationGiven, month;
  var shouldEndSession = false;
  var repromptText = null;
  var speechOutput = '';
  var cardTitle = intent.name;
  var sessionAttributes = {};
  month = intent.slots.Month.value;

  if (session.attributes) {
    locationGiven = session.attributes.locationGiven;
  }

  solar.solarPanelDataRequest(locationGiven)
    .then(function(response) {
      var responseData = JSON.parse(response);
      var powerValue = solar.powerForMonth(month, responseData);
      speechOutput = `Your power output for ${month} in ${locationGiven} is: ${powerValue} kilowatt hours in AC.`;
      callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });
}

/**************************************************************/
//                          EVENTS
/**************************************************************/
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

//FUNCTION FOR WHEN AN INTENT IS SPECIFIIED

function onIntent(intentRequest, session, callback) {
  console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);
  const intent = intentRequest.intent;
  const intentName = intentRequest.intent.name;

  if (intentName === 'GetLocation') {
    getLocation(intent, session, callback);
  }
  else if (intentName === 'GetPowerValue') {
    getPowerValue(intent, session, callback);
  }
  else if (intentName === 'GetPowerValueAtDate') {
    getPowerValueAtDate(intent, session, callback);
  }
  else if (intentName === 'GetPowerValueAtMonth') {
    getPowerValueAtMonth(intent, session, callback);
  }
  else if (intentName === 'AMAZON.HelpIntent') {
    getWelcomeResponse(callback);
  }
  else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
    handleSessionEndRequest(callback);
  }
  else {
    throw new Error("INVALID");
  }
}

function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    //function exitSkill(options, err) {
      //add garbage collection
    //}
}



exports.handler = (event, context, callback) => {
  try {
    console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);
    if (event.session.new) {
      onSessionStarted({ requestId: event.request.requestId }, event.session);
    }
    if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
    } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
    } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
    }
  }// try catch
  catch (err) {
    callback(err);
  }
};

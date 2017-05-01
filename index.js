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
//url for pvwatts API
//var url = "https://developer.nrel.gov/api/pvwatts/v5.json?api_key=hUeKIgQuZMkhyIP0MR8pAZ2Ea5HYAt5HuHVff345&lat=38&lon=-86&system_capacity=4&azimuth=180&tilt=40&array_type=1&module_type=1&losses=10&radius=0&timeframe=hourly";

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
        + 'by saying the city name. For example, you could say, Louisville.';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'You can ask me what the power value is.';
    var shouldEndSession = false;

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
  const locationSlot = intent.slots.Location;
  let sessionAttributes = {};
  var repromptText = '';
  var shouldEndSession = false;
  let speechOutput = '';

  if (locationSlot) {
      const locationGiven = intent.slots.Location.value;
      console.log(intent.slots.Location.value);
      sessionAttributes = createLocationAttributes(locationGiven);
      speechOutput = `I now know the location of your system is ${locationGiven} .`
                        + " You can ask me how much power you're "
                        + "producing in this location.";
    }
    else {
      speechOutput = "I'm not sure what your location is. Try again.";
    }

    callback(sessionAttributes,
       buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

//SET POWER VALUE FUNCTION
function setPowerValue(url, doCallBack) {
  https.get(url, function(response) {
    var buffer = "",
        data;
    response.on("data", function (chunk) {
        buffer += chunk;
    });
    response.on("end", function() {
      data = JSON.parse(buffer);
      if(data.error) {
        doCallBack(new Error(data.error));
      }
      else {
        doCallBack(null, data);
      }
    });
  }).on('error', function(err) {
    doCallBack(new Error(err.message));
  });
}

function getPowerValue (intent, session, callback) {
  let locationGiven;
  const cardTitle = intent.name;
  var sessionAttributes = {};
  var repromptText = null;
  var shouldEndSession = false;
  var speechOutput = '';

  var latitudeLongitude = '';


      //Louisville, Kentucky
      //latitudeLongitude = "&lat=38&lon=-86";
  var url = "https://developer.nrel.gov/api/pvwatts/v5.json?api_key=hUeKIgQuZMkhyIP0MR8pAZ2Ea5HYAt5HuHVff345&lat=38&lon=-86&system_capacity=4&azimuth=180&tilt=40&array_type=1&module_type=1&losses=10&radius=0&timeframe=hourly";
  setPowerValue(url, function dataCallBack(err, data) {
    if (err) {
      speechOutput = "Sorry, something went wrong.";
    }
    else {
      var powerValue = data.outputs.ac_annual;
      console.log("This is the amount of power your system produces in a year: " + powerValue);
      speechOutput = `Your power output in ${locationGiven} for the year is: ${powerValue} kilowatt hours in AC.`;
    }
  });
  /*else if (locationGiven === "san diego") {
      //San Diego, California
      url = "https://developer.nrel.gov/api/pvwatts/v5.json?api_key=hUeKIgQuZMkhyIP0MR8pAZ2Ea5HYAt5HuHVff345&lat=38&lon=-86&system_capacity=4&azimuth=180&tilt=40&array_type=1&module_type=1&losses=10&radius=0&timeframe=hourly";
    }
  else if (locationGiven === "nashville") {
      //Nashville, Tennessee
      //latitudeLongitude = "&lat=36&lon=-87";
      url = "https://developer.nrel.gov/api/pvwatts/v5.json?api_key=hUeKIgQuZMkhyIP0MR8pAZ2Ea5HYAt5HuHVff345&lat=38&lon=-86&system_capacity=4&azimuth=180&tilt=40&array_type=1&module_type=1&losses=10&radius=0&timeframe=hourly";
    }
  else {
    speechOutput = "Sorry, I don't recognize the location given.";
  }*/

  //var url = "https://developer.nrel.gov/api/pvwatts/v5.json?api_key=hUeKIgQuZMkhyIP0MR8pAZ2Ea5HYAt5HuHVff345&lat=38&lon=-86&system_capacity=4&azimuth=180&tilt=40&array_type=1&module_type=1&losses=10&radius=0&timeframe=hourly";


  callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/*
function createDateAttribute(dateGiven) {
  return {
    dateGiven,
  };
}

function getPowerValueAtDate (intent, session, callback) {
  var shouldEndSession = false;
  var repromptText = null;
  var speechOutput = '';
  var url = "https://developer.nrel.gov/api/pvwatts/v5.json?api_key=hUeKIgQuZMkhyIP0MR8pAZ2Ea5HYAt5HuHVff345&lat=38&lon=-86&system_capacity=4&azimuth=180&tilt=40&array_type=1&module_type=1&losses=10&radius=0&timeframe=hourly";
  var cardTitle = intent.name;
  const dateSlot = intent.slots.Date;
  setPowerValue(url, function dataCallBack(err, data) {
    if (dateGiven) {
      const dateGiven = dateSlot.value;
      sessionAttributes = createLocationAttributes(locationGiven);
      var powerValue = data.outputs.ac_monthly;
      for (var i = 0; i < powerValue.length; i++) {
        var counter = powerValue[i];
        console.log(counter);
      }
      console.log("This is the amount of power: " + counter);
      speechOutput = `Your power output is: ${counter} kWhac`;
    }
    else if (err) {
      speechOutput = "I'm sorry, I couldn't tell you your power output.";
    }
    else {
      speechOutput = "I'm not sure what your location is. Try again.";
      repromptText = "I'm not sure what your location is."
                        + "You can tell me your location by saying, "
                        + "My location is Louisville, Kentucky.";
    }
    callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
  })
}*/

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
  else if (intentName === 'AMAZON.HelpIntent') {
    getWelcomeResponse(callback);
  } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
    handleSessionEndRequest(callback);
  }
  /*else if (intentName === 'GetPowerValueAtDate') {
    getPowerValueAtDate(intent, session, callback);
  }*/
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

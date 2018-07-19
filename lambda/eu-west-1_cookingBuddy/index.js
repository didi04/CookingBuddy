'use strict';

const Alexa = require('alexa-sdk');
var http = require('http');

const APP_ID = "amzn1.ask.skill.70ee429c-4756-4c35-a68f-b0e8b37245a7"; 

const languageStrings = {
    'en': {
        translation: {
            SKILL_NAME: 'Cooking Buddy',
            WELCOME_MESSAGE: "Welcome to %s. I will be your cooking assistant, and together we will cook up a storm! You can ask me for a recipee with any ingredient or a list of ingredients. You can ask a question like, give me a recipe with lamb chops. ...Or perhaps be more specific, and say: tell me a recipe with lamb chops and tomato. I will provide you with the ingredients and the steps to prepare an outstanding meal! Are you ready? Now, what can I help you with?",
            WELCOME_REPROMPT: 'For instructions on what you can say or ask for, please say help me.',
            DISPLAY_CARD_TITLE: '%s  - Recipe for %s.',
            HELP_MESSAGE: "You can ask questions such as, tell me a recipe for ratatouille, or, suggest me a meal with potato, chicken and spinnach. Alternatively, you can say exit...Now, what can I help you with?",
            HELP_REPROMPT: "You can ask me for any recipee or just list your ingredients...Now, what can I help you with?",
            STOP_MESSAGE: 'Goodbye!',
            CANCEL_MESSAGE: 'Okay. Would you like to ask me anything else?',
            RECIPE_REPEAT_MESSAGE: 'Try saying repeat.',
            RECIPE_NOT_FOUND_MESSAGE: "I\'m sorry, I couldn\ 't find a recipe. Try changing your search and ask again ",
            RECIPE_NOT_FOUND_WITH_ITEM_NAME: 'the recipe for %s. ',
            RECIPE_NOT_FOUND_WITHOUT_ITEM_NAME: 'that recipe. ',
            RECIPE_NOT_FOUND_REPROMPT: 'What else can I help with?',
            REQUEST_MESSAGE: 'Here is the recipe I found for you:',
        },
    },
    'en-US': {
        translation: {
            SKILL_NAME: 'Cooking Buddy US',
        },
    },
    'en-GB': {
        translation: {
            SKILL_NAME: 'Cooking Buddy UK',
        },
    },
};

const handlers = {
    //Use LaunchRequest, instead of NewSession if you want to use the one-shot model
    // Alexa, ask [my-skill-invocation-name] to (do something)...
    'LaunchRequest': function () {
        this.attributes.speechOutput = this.t('WELCOME_MESSAGE', this.t('SKILL_NAME'));
        // If the user either does not reply to the welcome message or says something that is not
        // understood, they will be prompted again.
        this.attributes.repromptSpeech = this.t('WELCOME_REPROMPT');

        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },

     /** Provides a help message to the user (how to use the skill) **/ 
    'AMAZON.HelpIntent': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMPT');

        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
    /** Allows the user to hear the last message again **/
    'AMAZON.RepeatIntent': function () {
        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
    /** Allows the user to stop the current interaction **/
    'AMAZON.StopIntent': function () {
        const speechOutput = this.t('STOP_MESSAGE');
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    },
    /** Allows the user to cancel the current interaction **/
   'AMAZON.CancelIntent': function () {
        this.response.speak(this.t('CANCEL_MESSAGE'));
        this.emit(':responseReady');
    },
    /** Handles the exit of the current session **/
    'SessionEndedRequest': function () {
        console.log(`Session ended: ${this.event.request.reason}`);
    },
    /** Handles situations when Alexa does not understand the user or the user invokes
     * an unsupported command **/
    'Unhandled': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMPT');
        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
    /** Handles the querry and the answer to a user's recipe request **/
    'RequireRecipeIntent': function(){
        const ingredients = this.event.request.intent.slots.ingredient.value; //get the ingredient(s) requested by the user
        const recipe = getRecipes(ingredients, (response) => { //quer the recipes based on the ingredient(s)
            const speechOutput = response.recipes[0].title; // get the first recipe's title
            if (speechOutput != null){
                this.response.cardRenderer(recipe);
                this.response.speak("The best recipe I found is: " + speechOutput + ". Do you like this recipe or not?");
                this.emit(':responseReady'); 
            }
            else{
                this.response.speak(this.t('RECIPE_NOT_FOUND_MESSAGE'));
            }
        });
    },
};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};


/** A function to quer a list of recipes for given ingredient(s) from the API
    @param ingredients
    @return json formatted list of recipes
**/
function getRecipes(querry, callback){
    var options = {
        host: 'food2fork.com',
        path: '/api/search?key=ea145621a47832c8c46dbe98fe0e3348&q=' + encodeURIComponent(querry),
        method: 'GET',
    };
    var req = http.request(options, res => {
        res.setEncoding('utf8');
        var responseString= "";
        
        //accept incoming data asynchronously
        res.on('data', chunk => {
            console.log(chunk)
            responseString = responseString + chunk;
        });
        
        //return the data when streaming is complete
        res.on('end', () => {
            callback(JSON.parse(responseString));
        });
    });
    req.end();
    
}

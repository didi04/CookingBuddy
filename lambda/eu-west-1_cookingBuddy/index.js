'use strict';

const Alexa = require('alexa-sdk');
var http = require('http');
var ingredients;
var recipeIndex = 0;
var recipeID = 0;


const APP_ID = "amzn1.ask.skill.794d7ffd-9023-4593-949a-894f0d00da35"; 

const languageStrings = {
    'en': {
        translation: {
            SKILL_NAME: 'Cooking Buddy',
            WELCOME_MESSAGE: 'Welcome to %s. You can ask me for a recipe with any ingredient.  Now, what can I help you with?',
            WELCOME_REPROMPT: 'For instructions on what you can say or ask for, please say help me.',
            DISPLAY_CARD_TITLE: '%s  - Recipe for %s.',
            HELP_MESSAGE: "I will be your cooking assistent! You can ask questions such as, tell me a recipe for ratatouille, or, suggest me a meal with potato, chicken and spinnach. Alternatively, you can say exit...Now, what can I help you with?",
            HELP_REPROMPT: "You can ask me for any recipee or just list your ingredients...Now, what can I help you with?",
            STOP_MESSAGE: 'Okay. Goodbye! Talk to you soon!',
            CANCEL_MESSAGE: 'Okay. Goodbye!',
            RECIPE_REPEAT_MESSAGE: 'Try saying repeat.',
            RECIPE_NOT_FOUND_MESSAGE: "I\'m sorry, I couldn\ 't find a recipe. Try changing your search and ask again ",
            RECIPE_NOT_FOUND_REPROMPT: 'What else can I help with?',
            REQUEST_MESSAGE: 'Here is the recipe I found for you:',
            LIKE_RECIPE_MESSAGE: 'Great! Here are the ingredients for this recipe: ',
            DISLIKE_RECIPE_MESSAGE: 'Okay. If you do not want to proceed, say Cancel. If you want to proceed, say Next.',
            NEXT_MESSAGE: 'Let\'s try this one: ',
            RECIPE_APPROVAL_MESSAGE:'. Do you like this recipe? ',
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

    /** Activates when user dislikes a given recipe and
     * provides them with a new one **/
    'AMAZON.NoIntent': function () {
        const speechOutput = this.t('DISLIKE_RECIPE_MESSAGE');
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    },   

    'AMAZON.NextIntent': function(){
        let speechOutput = this.t('NEXT_MESSAGE');
        recipeIndex++;
        const recipe = getRecipes(ingredients, (response) => { //quer the recipes based on the ingredient(s)
            let speechOutput = response.recipes[recipeIndex].title; // get the recipe's title
            if (speechOutput != null){ // check for a matching recipe
                speechOutput+= this.t('RECIPE_APPROVAL_MESSAGE');
                this.response.cardRenderer(speechOutput); // display the recipe on a card 
                this.response.speak("The best recipe I found is: " 
                + speechOutput).listen(speechOutput); // respond to the user with the recipe
                this.emit(':responseReady'); 
                recipeID = response.recipes[recipeIndex].recipe_id;
            }
            else{ // if there is no matching recipe
                this.response.speak(this.t('RECIPE_NOT_FOUND_MESSAGE'));
                this.emit(':responseReady'); 
            }     
        });
    },
    
    /** Activates when the user likes a given recipe
     * and provides them with the ingredients**/
    'AMAZON.YesIntent': function () {
        let speechOutput = this.t('LIKE_RECIPE_MESSAGE');
        getIngredients(recipeID, (responseAPI) => {
            let ingredients = responseAPI.recipe.ingredients;
        for (let i=0; i<ingredients.length - 1;i++){
                speechOutput+= ingredients[i] + ". "; 
            }
            this.response.speak(speechOutput);
        this.emit(':responseReady');
        });
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
        ingredients = this.event.request.intent.slots.ingredient.value; //get the ingredient(s) requested by the user
        const recipe = getRecipes(ingredients, (response) => { //quer the recipes based on the ingredient(s)
            let speechOutput = response.recipes[recipeIndex].title; // get the recipe's title
            if (speechOutput != null){ // check for a matching recipe
                speechOutput+= this.t('RECIPE_APPROVAL_MESSAGE');
                this.response.cardRenderer(speechOutput); // display the recipe on a card 
                this.response.speak("The best recipe I found is: " 
                + speechOutput).listen(speechOutput); // respond to the user with the recipe
                this.emit(':responseReady'); 
                recipeID = response.recipes[recipeIndex].recipe_id;
            }
            else{ // if there is no matching recipe
                this.response.speak(this.t('RECIPE_NOT_FOUND_MESSAGE'));
                this.emit(':responseReady'); 
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

/** A function to quer a list of the ingredients for given recipe from the API
    @param recipeId
    @return json formatted list of ingredients
**/

function getIngredients(recipeId, callback){
    var options = {
        host: 'food2fork.com',
        path: '/api/get?key=ea145621a47832c8c46dbe98fe0e3348&rId=' + encodeURIComponent(recipeId),
        method: 'GET',
    };
    var req = http.request(options, res => {
        res.setEncoding('utf8');
        var responseString= "";
        
        //accept incoming data asynchronously
        res.on('data', chunk => {
            console.log(chunk);
            responseString = responseString + chunk;
        });
        
        //return the data when streaming is complete
        res.on('end', () => {
            callback(JSON.parse(responseString));
        });
    });
    req.end();
}

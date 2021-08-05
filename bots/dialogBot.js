// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TeamsActivityHandler } = require('botbuilder');
const { ActionTypes, CardFactory } = require('botbuilder');
const fetch = require('node-fetch');


class DialogBot extends TeamsActivityHandler {
    /**
     *
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
     */
    constructor(conversationState, userState, dialog, userProfileAccessor) {
        super();
        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.userProfileAccessor = userProfileAccessor;
        this.dialogState = this.conversationState.createProperty('DialogState');
        this.userStateAccessor = userState.createProperty('userState');

        this.onMessage(async (context, next) => {
            console.log('Running dialog with Message Activity.');

            const text = context.activity.text.toLowerCase();
            console.log(text);
            const tokenFromState = await this.userProfileAccessor.get(context, {});
            //console.log('User *****', tokenFromState);

            if (text === 'yes') {
                // await this.sendIntroCard(context);
                await this.getOptionsCard(context);
            } else if (text === 'networking') {
                // Make sure to access Token from here
                console.log('Make API call to server');
                console.log('Bot responds with a link');
                const res = await fetch('http://localhost:5000/Networking/getLink',{
                    method:'get',
                })
                var response = await res.json();
                console.log('link of meeting',response);
                await this.sendIntroCard(context,text,response);
            } else {
                // Run the Dialog with the new message Activity.
                await this.dialog.run(context, this.dialogState);
                await next();
            }
        });
    }

    /**
     * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
     */
    async run(context) {
        await super.run(context);

        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }

    async sendIntroCard(context,topic,link) {
        const card = CardFactory.heroCard(
            undefined,
            'We have found a room for you, join in and have fun. Checkout other ongoing rooms',
            ['https://source.wustl.edu/wp-content/uploads/2018/06/shutterstock_491636482-760x428.jpg'],
            [
                {
                    type: ActionTypes.OpenUrl,
                    title: 'Join Networking Room',
                    value:link
                },
                {
                    type: ActionTypes.OpenUrl,
                    title: 'Visit website for more rooms',
                    value: 'http://localhost:3000/'  //localhost
                }
            ]
        );

        await context.sendActivity({ attachments: [card] });
    }

    async getOptionsCard(context) {
        const buttons = [];
        const myobj = {
            topic01: 'Online Gaming',
            topic02: 'TechTalks',
            topic03: 'Networking',
            topic04: 'Movies',
            topic05: 'Travelling',
        };
        const topicTextMatch = {
            topic01: 'Online Gaming',
            topic02: 'TechTalks',
            topic03: 'Networking',
            topic04: 'Movies',
            topic05: 'Travelling',
        };
        for (const [key, value] of Object.entries(myobj)) {
            console.log('IGNORE', value);
            buttons.push({ type: ActionTypes.MessageBack, text: topicTextMatch[key], title: value, value: key });
        }

        const card = CardFactory.heroCard('Great!! People are talking about..', undefined,
            buttons, { text: 'Select the one you are interested in' });

        // return card;
        await context.sendActivity({ attachments: [card] });
    }
}

module.exports.DialogBot = DialogBot;

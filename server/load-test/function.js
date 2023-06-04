'use strict';

module.exports = {
    setMessage: setMessage
};

const MESSAGES = [
    'Bonjour',
    'How\'s everybody?',
    'How\'s it going?',
    'Say hello to my little friend.',
    'To be or not to be, that is the question.',
    'Romeo, Romeo! wherefore art thou Romeo?',
    'May the force be with you.',
    'I\'ll be back',
    'You\'re gonna need a bigger boat.'
];

function setMessage(context, events, done) {
    const index = Math.floor(Math.random() * MESSAGES.length);
    context.vars.message = MESSAGES[index];
    return done();
}
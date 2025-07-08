require('dotenv').config();
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
const client = require('twilio')(accountSid, authToken);
async function sendMessage(phone_number,message){
    const response=await client.messages.create({
        body: message,
        messagingServiceSid: 'MGa75a84914b1640c8121d55a162d68e5a',
        to: phone_number
    })
    console.log(response);
}
module.exports={sendMessage};
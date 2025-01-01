// הגדרת נתוני Twilio
const accountSid = 'YOUR_TWILIO_ACCOUNT_SID'; // הוסף את ה-SID שלך מ-Twilio
const authToken = 'YOUR_TWILIO_AUTH_TOKEN';   // הוסף את ה-Auth Token שלך מ-Twilio
const twilioPhoneNumber = 'YOUR_TWILIO_PHONE_NUMBER'; // הוסף את מספר הטלפון שלך מ-Twilio

// יצירת לקוח Twilio
const client = require('twilio')(accountSid, authToken);

// פונקציה לשליחת הודעת SMS
function sendSMS(toPhoneNumber, message) {
    client.messages.create({
        body: message, // הגוף של ההודעה
        from: twilioPhoneNumber, // מספר ה-Twilio שלך
        to: toPhoneNumber // מספר הטלפון של הלקוח
    })
    .then((message) => {
        console.log('ההודעה נשלחה בהצלחה, SID:', message.sid);
    })
    .catch((error) => {
        console.error('שגיאה בשליחת ההודעה:', error.message);
    });
}

// פונקציה לשליחת הודעת אישור הזמנה
function sendAppointmentConfirmation(phoneNumber, appointmentDetails) {
    const message = `ההזמנה שלך אושרה! פרטי הזמנה: שירות: ${appointmentDetails.service}, תאריך: ${appointmentDetails.date}, שעה: ${appointmentDetails.time}.`;
    sendSMS(phoneNumber, message);
}

// פונקציה לשליחת הודעת תזכורת
function sendAppointmentReminder(phoneNumber, appointmentDetails) {
    const message = `תזכורת: יש לך תור ל-${appointmentDetails.service} בתאריך ${appointmentDetails.date} בשעה ${appointmentDetails.time}.`;
    sendSMS(phoneNumber, message);
}

// פונקציה לשליחת הודעת ביטול תור
function sendAppointmentCancellation(phoneNumber, appointmentDetails) {
    const message = `ההזמנה שלך ל-${appointmentDetails.service} בתאריך ${appointmentDetails.date} בשעה ${appointmentDetails.time} בוטלה.`;
    sendSMS(phoneNumber, message);
}

// פונקציה לשליחת הודעה כללית
function sendGeneralNotification(phoneNumbers, message) {
    phoneNumbers.forEach((phoneNumber) => {
        sendSMS(phoneNumber, message);
    });
}

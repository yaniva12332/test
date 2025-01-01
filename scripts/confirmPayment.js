// הגדרת Firebase
const db = firebase.firestore();

// פונקציה לאישור תשלום
function confirmPayment(paymentId) {
    const paymentRef = db.collection("payments").doc(paymentId);

    paymentRef.update({
        status: "confirmed", // עדכון הסטטוס ל-"מאושר"
        confirmationDate: new Date().toISOString() // הוספת תאריך האישור
    })
    .then(() => {
        alert("התשלום אושר בהצלחה");
        window.location.reload();
    })
    .catch((error) => {
        alert("שגיאה באישור התשלום: " + error.message);
    });
}

// פונקציה לשלילת תשלום
function cancelPayment(paymentId) {
    const paymentRef = db.collection("payments").doc(paymentId);

    paymentRef.update({
        status: "cancelled" // עדכון הסטטוס ל-"בוטל"
    })
    .then(() => {
        alert("התשלום בוטל בהצלחה");
        window.location.reload();
    })
    .catch((error) => {
        alert("שגיאה בביטול התשלום: " + error.message);
    });
}

// פונקציה להצגת פרטי תשלום
function getPaymentDetails(paymentId) {
    const paymentRef = db.collection("payments").doc(paymentId);

    paymentRef.get()
        .then((doc) => {
            if (doc.exists) {
                const payment = doc.data();
                document.getElementById("payment-amount").textContent = `סכום: ₪${payment.amount}`;
                document.getElementById("payment-status").textContent = `סטטוס: ${payment.status}`;
                document.getElementById("payment-date").textContent = `תאריך: ${payment.date}`;
            } else {
                alert("לא נמצאו פרטי תשלום");
            }
        })
        .catch((error) => {
            alert("שגיאה בהבאת פרטי התשלום: " + error.message);
        });
}

// פונקציה להצגת כל התשלומים
function getAllPayments() {
    const paymentsList = document.getElementById("payments-list");

    db.collection("payments").get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const payment = doc.data();
                const listItem = document.createElement("li");
                listItem.textContent = `סכום: ₪${payment.amount} - סטטוס: ${payment.status} - תאריך: ${payment.date}`;
                paymentsList.appendChild(listItem);
            });
        })
        .catch((error) => {
            alert("שגיאה בקריאת התשלומים: " + error.message);
        });
}

// פונקציה לשלוח הודעת אישור תשלום ללקוח
function sendPaymentConfirmationSMS(phoneNumber, paymentDetails) {
    const message = `היי! התשלום שלך בוצע בהצלחה! סכום: ₪${paymentDetails.amount} - תאריך: ${paymentDetails.date}.`;
    sendSMS(phoneNumber, message); // יש להשתמש בפונקציה של Twilio לשליחת SMS
}

// פונקציה לשלוח הודעת ביטול תשלום ללקוח
function sendPaymentCancellationSMS(phoneNumber, paymentDetails) {
    const message = `היי! התשלום שלך בוטל. סכום: ₪${paymentDetails.amount} - תאריך: ${paymentDetails.date}.`;
    sendSMS(phoneNumber, message); // יש להשתמש בפונקציה של Twilio לשליחת SMS
}

// פונקציה להוספת פרטי תשלום למסד הנתונים
function addPayment(amount, userId, paymentMethod) {
    db.collection("payments").add({
        amount: amount,
        userId: userId,
        paymentMethod: paymentMethod, // לדוג' "PayPal", "Stripe"
        status: "pending", // ברירת מחדל: "ממתין"
        date: new Date().toISOString() // תאריך ביצוע התשלום
    })
    .then(() => {
        alert("התשלום נוסף בהצלחה");
    })
    .catch((error) => {
        alert("שגיאה בהוספת התשלום: " + error.message);
    });
}

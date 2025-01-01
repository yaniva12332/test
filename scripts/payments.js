// פונקציה להתחברות לתשלום עם PayPal
function initiatePayPalPayment(amount, description) {
    const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID';  // הוסף את מזהה הלקוח שלך מ-PayPal
    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${PAYPAL_CLIENT_ID}&item_name=${description}&amount=${amount}&currency_code=USD&button_subtype=services`;

    window.location.href = paypalUrl;  // העברת המשתמש לדף התשלום של PayPal
}

// פונקציה להתחלת תשלום עם Stripe
function initiateStripePayment(amount, description) {
    const stripe = Stripe('YOUR_STRIPE_PUBLIC_KEY');  // הוסף את המפתח הציבורי שלך מ-Stripe
    const paymentIntent = {
        amount: amount * 100,  // המרה ל-cent
        currency: 'usd',
        description: description
    };

    // בקשה ליצירת Intent בתמיכת API של Stripe
    fetch('/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentIntent)
    })
    .then(response => response.json())
    .then(data => {
        const clientSecret = data.clientSecret;

        stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: document.getElementById('card-element'),
                billing_details: {
                    name: 'שם הלקוח'
                }
            }
        }).then(result => {
            if (result.error) {
                alert('שגיאה בתשלום: ' + result.error.message);
            } else {
                alert('העסקה הושלמה בהצלחה!');
            }
        });
    })
    .catch(error => console.error('שגיאה ביצירת Intent: ', error));
}

// פונקציה להחזרות ותיקון תשלומים ב-Stripe
function refundStripePayment(paymentIntentId) {
    fetch(`/refund-payment/${paymentIntentId}`, {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('ההחזר בוצע בהצלחה');
        } else {
            alert('שגיאה בהחזר');
        }
    })
    .catch(error => console.error('שגיאה בהחזרת התשלום: ', error));
}

// פונקציה לחשב את הסכום הכולל בתור לפני התשלום
function calculateTotalAppointmentAmount(services) {
    let totalAmount = 0;
    services.forEach(service => {
        totalAmount += service.price;  // סכום מחירים של כל השירותים
    });
    return totalAmount;
}

// פונקציה להצגת תשלום עם PayPal או Stripe
function displayPaymentForm(services) {
    const totalAmount = calculateTotalAppointmentAmount(services);

    // הצגת סך התשלום למשתמש
    document.getElementById('total-amount').textContent = `סה"כ לתשלום: $${totalAmount}`;

    // כפתור תשלום עם PayPal
    document.getElementById('paypal-button').addEventListener('click', () => {
        initiatePayPalPayment(totalAmount, 'תשלום עבור תור');
    });

    // כפתור תשלום עם Stripe
    document.getElementById('stripe-button').addEventListener('click', () => {
        initiateStripePayment(totalAmount, 'תשלום עבור תור');
    });
}

// פונקציה להוספת כרטיס אשראי ב-Stripe (לשירות ניהול תשלומים)
function setupStripePaymentForm() {
    const stripe = Stripe('YOUR_STRIPE_PUBLIC_KEY');
    const elements = stripe.elements();
    const cardElement = elements.create('card');
    
    // הוספת אלמנט כרטיס אשראי לטופס
    cardElement.mount('#card-element');
    
    document.getElementById('payment-form').addEventListener('submit', function(event) {
        event.preventDefault();
        stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
        }).then(function(result) {
            if (result.error) {
                alert('שגיאה בכרטיס האשראי: ' + result.error.message);
            } else {
                alert('הכרטיס נוסף בהצלחה!');
            }
        });
    });
}

// פונקציה להוסיף אפשרות תשלום למנהל או לעסק
function enablePaymentOptions() {
    // הצגת אפשרויות תשלום
    document.getElementById('payment-options').style.display = 'block';
}

// החזרת פרטי העסק לתשלום
function getBusinessPaymentDetails(businessId) {
    // כאן אפשר להוסיף קריאה למערכת נתונים כדי להחזיר את פרטי העסק
    // ולקשר את פרטי העסק עם תשלום ספציפי

    fetch(`/business-payment-details/${businessId}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('business-name').textContent = data.name;
            document.getElementById('business-description').textContent = data.description;
        })
        .catch(error => console.error('שגיאה בהבאת פרטי העסק: ', error));
}

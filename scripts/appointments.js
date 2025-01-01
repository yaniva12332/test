// חיבור למסד הנתונים (Firebase)
const db = firebase.firestore();

// פונקציה להוספת תור חדש
function addAppointment(event) {
    event.preventDefault();

    const form = event.target;
    const customerName = form.customerName.value;
    const service = form.service.value;
    const appointmentDate = form.appointmentDate.value;
    const appointmentTime = form.appointmentTime.value;

    if (!customerName || !service || !appointmentDate || !appointmentTime) {
        alert("נא למלא את כל השדות");
        return;
    }

    // הוספת התור למסד הנתונים ב-Firebase
    db.collection("appointments").add({
        customerName: customerName,
        service: service,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        status: "pending" // סטטוס התור (יכול להיות "ממתין", "מאושר", "בוטל")
    })
    .then(() => {
        alert("התור נוסף בהצלחה!");
        window.location.href = "appointments.html"; // דף שמציג את רשימת התורים
    })
    .catch((error) => {
        alert("שגיאה בהוספת התור: " + error.message);
    });
}

// פונקציה לעדכון תור
function updateAppointment(event, appointmentId) {
    event.preventDefault();

    const form = event.target;
    const customerName = form.customerName.value;
    const service = form.service.value;
    const appointmentDate = form.appointmentDate.value;
    const appointmentTime = form.appointmentTime.value;

    if (!customerName || !service || !appointmentDate || !appointmentTime) {
        alert("נא למלא את כל השדות");
        return;
    }

    // עדכון פרטי התור במסד הנתונים
    const appointmentRef = db.collection("appointments").doc(appointmentId);
    appointmentRef.update({
        customerName: customerName,
        service: service,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime
    })
    .then(() => {
        alert("התור עודכן בהצלחה!");
        window.location.href = "appointments.html"; // דף שמציג את רשימת התורים
    })
    .catch((error) => {
        alert("שגיאה בעדכון התור: " + error.message);
    });
}

// פונקציה למחיקת תור
function deleteAppointment(appointmentId) {
    if (confirm("האם אתה בטוח שברצונך למחוק את התור?")) {
        const appointmentRef = db.collection("appointments").doc(appointmentId);
        appointmentRef.delete()
        .then(() => {
            alert("התור נמחק בהצלחה");
            window.location.reload();
        })
        .catch((error) => {
            alert("שגיאה בהסרת התור: " + error.message);
        });
    }
}

// פונקציה להצגת כל התורים
function getAllAppointments() {
    const appointmentsList = document.getElementById("appointments-list");

    db.collection("appointments").get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const appointment = doc.data();
                const listItem = document.createElement("li");
                listItem.textContent = `${appointment.customerName} - שירות: ${appointment.service} - תאריך: ${appointment.appointmentDate} - שעה: ${appointment.appointmentTime}`;
                appointmentsList.appendChild(listItem);
            });
        })
        .catch((error) => {
            alert("שגיאה בקריאת התורים: " + error.message);
        });
}

// פונקציה להצגת פרטי תור מסוים
function getAppointmentDetails(appointmentId) {
    const appointmentRef = db.collection("appointments").doc(appointmentId);

    appointmentRef.get()
        .then((doc) => {
            if (doc.exists) {
                const appointment = doc.data();
                document.getElementById("customerName").value = appointment.customerName;
                document.getElementById("service").value = appointment.service;
                document.getElementById("appointmentDate").value = appointment.appointmentDate;
                document.getElementById("appointmentTime").value = appointment.appointmentTime;
            } else {
                alert("התור לא נמצא");
            }
        })
        .catch((error) => {
            alert("שגיאה בהבאת פרטי התור: " + error.message);
        });
}

// פונקציה לאישור תור
function confirmAppointment(appointmentId) {
    const appointmentRef = db.collection("appointments").doc(appointmentId);
    appointmentRef.update({
        status: "confirmed" // עדכון הסטטוס ל"מאושר"
    })
    .then(() => {
        alert("התור אושר בהצלחה");
        window.location.reload();
    })
    .catch((error) => {
        alert("שגיאה באישור התור: " + error.message);
    });
}

// פונקציה לביטול תור
function cancelAppointment(appointmentId) {
    const appointmentRef = db.collection("appointments").doc(appointmentId);
    appointmentRef.update({
        status: "cancelled" // עדכון הסטטוס ל"בוטל"
    })
    .then(() => {
        alert("התור בוטל בהצלחה");
        window.location.reload();
    })
    .catch((error) => {
        alert("שגיאה בביטול התור: " + error.message);
    });
}

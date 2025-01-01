<!DOCTYPE html>
<html lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>פרופיל משתמש</title>
    <link rel="stylesheet" href="styles/main.css">
</head>
<body>
    <h1>פרופיל משתמש</h1>
    <section>
        <h2>פרטי משתמש</h2>
        <p><strong>שם משתמש:</strong> <span id="username">טוען...</span></p>
        <p><strong>אימייל:</strong> <span id="email">טוען...</span></p>

        <h2>תורים עתידיים</h2>
        <ul id="appointments-list">
            <li>טוען תורים...</li>
        </ul>
    </section>

    <button id="logoutButton">התנתק</button>

    <footer>
        <p>&copy; 2024 TimeMaster. כל הזכויות שמורות.</p>
    </footer>

    <!-- הוספת לוגיקה מותאמת -->
    <script type="module">
        import { auth, fetchUserData, getUserAppointments, logoutUser, onAuthStateChangedListener } from "./scripts/firebase.js";

        document.addEventListener("DOMContentLoaded", () => {
            const emailSpan = document.getElementById("email");
            const usernameSpan = document.getElementById("username");
            const appointmentsList = document.getElementById("appointments-list");

            // מעקב אחר מצב התחברות
            onAuthStateChangedListener(async (user) => {
                if (!user) {
                    alert("לא מחובר! מפנה לדף התחברות...");
                    window.location.href = "login.html";
                    return;
                }

                try {
                    // הצגת פרטי המשתמש
                    emailSpan.textContent = user.email;
                    const userData = await fetchUserData(user.uid);
                    usernameSpan.textContent = userData?.username || "לא נמצא שם משתמש";

                    // הצגת תורים
                    const appointments = await getUserAppointments(user.uid);
                    appointmentsList.innerHTML = ""; // נקה רשימה
                    if (appointments.length === 0) {
                        appointmentsList.innerHTML = "<li>אין תורים עתידיים</li>";
                    } else {
                        appointments.forEach((appointment) => {
                            const li = document.createElement("li");
                            li.textContent = `${appointment.service} - ${appointment.date} - ${appointment.time}`;
                            appointmentsList.appendChild(li);
                        });
                    }
                } catch (error) {
                    console.error("שגיאה בטעינת הנתונים: ", error.message);
                }
            });

            // יציאה מהמערכת
            document.getElementById("logoutButton").addEventListener("click", async () => {
                try {
                    await logoutUser();
                    window.location.href = "login.html";
                } catch (error) {
                    console.error("שגיאה ביציאה: ", error.message);
                }
            });
        });
    </script>
</body>
</html>

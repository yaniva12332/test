import { auth, getAllUsers, getAllBusinesses, addBusiness, getUserRole } from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {
    const viewUsersButton = document.getElementById("viewUsers");
    const addBusinessButton = document.getElementById("addBusiness");
    const userList = document.getElementById("userList");
    const businessList = document.getElementById("businessList");

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            alert("עליך להתחבר!");
            window.location.href = "login.html";
            return;
        }

        const role = await getUserRole(user.uid);
        if (role !== "superAdmin") {
            alert("אין לך גישה לדף זה!");
            window.location.href = "userProfile.html";
            return;
        }
    });

    // הצגת משתמשים
    viewUsersButton.addEventListener("click", async () => {
        const users = await getAllUsers();
        userList.innerHTML = "";
        users.forEach((user) => {
            const li = document.createElement("li");
            li.textContent = `${user.username} (${user.email}) - ${user.role}`;
            userList.appendChild(li);
        });
    });

    // הוספת עסק
    addBusinessButton.addEventListener("click", async () => {
        const name = prompt("הכנס שם עסק:");
        if (!name) return;
        await addBusiness(auth.currentUser.uid, name);
        alert("עסק נוסף בהצלחה!");
        location.reload();
    });
});

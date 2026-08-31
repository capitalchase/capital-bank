// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {  
  apiKey: "AIzaSyAp7cXdiuLsHEL0XdBZZiYW5j9yvnGmlb8",
  authDomain: "capital-bank-42524.firebaseapp.com",
  projectId: "capital-bank-42524",
  storageBucket: "capital-bank-42524.firebasestorage.app",
  messagingSenderId: "622953995653",
  appId: "1:622953995653:web:64c7503cc459019662b8ec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

/* ===========================
   REGISTER
=========================== */

window.registerUser = async function () {

  const fullname =
    document.getElementById("fullname").value;

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  try {

    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

await setDoc(
  doc(db, "Users", email),
  {
    fullname: fullname,
    email: email,
    balance: 23000000,
    savings: 15000000,
    transactions: [
      {
        type: "Account Created",
        amount: 23000000,
        date: new Date().toLocaleString()
      }
    ]
  }
);
    
    const user = {
      fullname,
      email,
      balance: 23000000,
      savings: 15000000,
      transactions: [
        {
          type: "Account Created",
          amount: 23000000,
          date: new Date().toLocaleString()
        }
      ]
    };

    let users =
      JSON.parse(localStorage.getItem("users"))
      || [];

    users.push(user);

    localStorage.setItem(
      "users",
      JSON.stringify(users)
    );

    alert("Registration Successful");

    window.location.href =
      "login.html";

  } catch (error) {

    alert(error.message);

  }

};

/* =========================== LOGIN =========================== */

window.loginUser = async function () {

  const email =
    document.getElementById("loginEmail").value;

  const password =
    document.getElementById("loginPassword").value;

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Firestore lookup
    const userRef =
      doc(db, "Users", email);

    const userSnap =
      await getDoc(userRef);

    if (!userSnap.exists()) {

      alert("User data not found in Firestore");
      return;

    }

    const found =
      userSnap.data();

    localStorage.setItem(
      "currentUser",
      JSON.stringify(found)
    );

    alert("Login Successful");

    window.location.href =
      "dashboard.html";

  } catch (error) {

    alert(
      "Code: " +
      error.code +
      "\nMessage: " +
      error.message
    );

  }

};


/* ===========================
   DASHBOARD
=========================== */

window.loadDashboard = function () {

  let currentUser =
    JSON.parse(
      localStorage.getItem("currentUser")
    );

  if (!currentUser) {

    location.href = "login.html";
    return;

  }

  const username =
    document.getElementById("username");

  const balance =
    document.getElementById("balance");

  const savings =
    document.getElementById("savings");

  if (username)
    username.innerText =
      currentUser.fullname;

  if (balance)
    balance.innerText =
      "$" +
      currentUser.balance.toLocaleString();

  if (savings)
    savings.innerText =
      "$" +
      currentUser.savings.toLocaleString();

const historyTable =
  document.getElementById("historyTable");

if (historyTable) {

  historyTable.innerHTML = "";

  currentUser.transactions.forEach(t => {

    historyTable.innerHTML += `
      <tr>
        <td>${t.date}</td>
        <td>${t.type}</td>
        <td>₦${t.amount.toLocaleString()}</td>
      </tr>
    `;

  });

}

};
/* ===========================
   TRANSFER
=========================== */
window.transferMoney = async function () {

  let receiver =
    document.getElementById("receiver").value;

  let accountNumber =
    document.getElementById("accountNumber").value;

  let bankName =
    document.getElementById("bankName").value;

  let amount =
    Number(document.getElementById("amount").value);

  let narration =
    document.getElementById("narration").value;

  let currentUser =
    JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    alert("Login Required");
    return;
  }

  if (!receiver || !accountNumber || !bankName) {
    alert("Fill all transfer details");
    return;
  }

  if (amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  if (amount > currentUser.balance) {
    alert("Insufficient Funds");
    return;
  }

  // Deduct balance
  currentUser.balance -= amount;

  // Add transaction
  currentUser.transactions.push({
    type: "Transfer",
    receiver: receiver,
    accountNumber: accountNumber,
    bankName: bankName,
    narration: narration,
    amount: amount,
    date: new Date().toLocaleString()
  });

  await updateDoc(
  doc(db, "Users", currentUser.email),
  {
    balance: currentUser.balance,
    transactions: currentUser.transactions
  }
);
  
  // Save current user
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  // Update users list
  let allUsers =
    JSON.parse(localStorage.getItem("users")) || [];

  let index =
    allUsers.findIndex(u => u.email === currentUser.email);

  if (index !== -1) {
    allUsers[index] = currentUser;
    localStorage.setItem("users", JSON.stringify(allUsers));
  }

  alert("Transfer Successful");

  let notifications =
JSON.parse(localStorage.getItem("notifications")) || [];

notifications.push({

title: "Transfer Successful",

message:
"$" +
amount.toLocaleString() +
" was sent to " +
receiver,

date:
new Date().toLocaleString()

});

localStorage.setItem(
"notifications",
JSON.stringify(notifications)
);
  window.location.href = "dashboard.html";
};

/* ===========================
   LOGOUT
=========================== */

window.logout = async function () {

  await signOut(auth);

  localStorage.removeItem(
    "currentUser"
  );

  location.href =
    "login.html";

};

/* ===========================
   ADMIN
=========================== */

window.loadAdmin = function () {

  let allUsers =
    JSON.parse(
      localStorage.getItem("users")
    ) || [];

  document.getElementById(
    "totalUsers"
  ).innerText =
    allUsers.length;

  let total = 0;

  allUsers.forEach(user => {

    total += user.balance;

  });

  document.getElementById(
    "totalFunds"
  ).innerText =
    "$" +
    total.toLocaleString();

};

/* ===========================
   DARK MODE
=========================== */

window.toggleDarkMode =
  function () {

    document.body.classList.toggle(
      "dark-mode"
    );

    localStorage.setItem(
      "theme",
      document.body.classList.contains(
        "dark-mode"
      )
        ? "dark"
        : "light"
    );

  };

window.addEventListener(
  "load",
  () => {

    if (
      localStorage.getItem("theme")
      === "dark"
    ) {

      document.body.classList.add(
        "dark-mode"
      );

    }

  }
);

/* ===========================
   RECEIPT
=========================== */

window.showReceipt =
  function (receiver, amount) {

    const modal =
      document.getElementById(
        "receiptModal"
      );

    if (!modal) return;

    const ref =
      "CB" + Date.now();

    document.getElementById(
      "receiptReceiver"
    ).innerText =
      "Receiver: " + receiver;

    document.getElementById(
      "receiptAmount"
    ).innerText =
      "Amount: $" +
      Number(amount).toLocaleString();

    document.getElementById(
      "receiptRef"
    ).innerText =
      "Reference: " + ref;

    modal.style.display =
      "flex";

  };

window.closeReceipt =
  function () {

    document.getElementById(
      "receiptModal"
    ).style.display =
      "none";

  };
function applyLoan() {
    alert("Loan application submitted.");
}

window.applyLoan = applyLoan;

/* ===========================
   DEPOSIT
=========================== */

window.depositMoney = async function () {

  let amount =
    Number(
      document.getElementById(
        "depositAmount"
      ).value
    );

  let currentUser =
    JSON.parse(
      localStorage.getItem(
        "currentUser"
      )
    );

  if (!currentUser) {

    alert("Login Required");
    return;

  }

  if (amount <= 0) {

    alert("Enter Valid Amount");
    return;

  }

  currentUser.balance += amount;

  currentUser.transactions.push({

    type: "Deposit",
    amount: amount,
    date: new Date().toLocaleString()

  });

  localStorage.setItem(
    "currentUser",
    JSON.stringify(currentUser)
  );

  let allUsers =
    JSON.parse(
      localStorage.getItem("users")
    ) || [];

  let index =
    allUsers.findIndex(
      u => u.email === currentUser.email
    );

  if (index !== -1) {

    allUsers[index] =
      currentUser;

    localStorage.setItem(
      "users",
      JSON.stringify(allUsers)
    );

  }

  alert(
    "Deposit Successful"
  );

  location.href =
    "dashboard.html";

};

/* ===========================
   RECEIVE FUNDS
=========================== */

window.receiveFunds = async function () {

    const amount =
        Number(document.getElementById("receiveAmount").value);

    if (!amount || amount <= 0) {
        alert("Enter a valid amount");
        return;
    }

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser) {
        alert("Login Required");
        return;
    }

    try {

        // Make sure balance is a number
        const currentBalance =
            Number(currentUser.balance) || 0;

        // Calculate new balance
        const newBalance =
            currentBalance + amount;

        // Make sure transactions exists
        currentUser.transactions =
            currentUser.transactions || [];

        // Add incoming transaction
        currentUser.transactions.push({
            type: "Funds Received",
            amount: amount,
            narration: "Incoming Funds",
            date: new Date().toLocaleString()
        });

        // Update balance AND transactions in Firestore
        await updateDoc(
            doc(db, "Users", currentUser.email),
            {
                balance: newBalance,
                transactions: currentUser.transactions
            }
        );

        // Update local user
        currentUser.balance = newBalance;

        localStorage.setItem(
            "currentUser",
            JSON.stringify(currentUser)
        );

        // Update local users list
        let allUsers =
            JSON.parse(localStorage.getItem("users")) || [];

        const index =
            allUsers.findIndex(
                u => u.email === currentUser.email
            );

        if (index !== -1) {

            allUsers[index] = currentUser;

            localStorage.setItem(
                "users",
                JSON.stringify(allUsers)
            );
        }

        alert(
            "Funds received successfully: $" +
            amount.toLocaleString()
        );

        // Reload dashboard
        window.location.href = "dashboard.html";

    } catch (error) {

        console.error("Receive Funds Error:", error);

        alert(
            "Unable to receive funds.\n\n" +
            error.message
        );
    }
};
        
/* ===========================
   WITHDRAW
=========================== */

window.withdrawMoney = function () {

  let amount =
    Number(
      document.getElementById(
        "withdrawAmount"
      ).value
    );

  let currentUser =
    JSON.parse(
      localStorage.getItem(
        "currentUser"
      )
    );

  if (!currentUser) {

    alert("Login Required");
    return;

  }

  if (amount <= 0) {

    alert("Enter Valid Amount");
    return;

  }

  if (amount > currentUser.balance) {

    alert("Insufficient Balance");
    return;

  }

  currentUser.balance -= amount;

  currentUser.transactions.push({

    type: "Withdraw",
    amount: amount,
    date: new Date().toLocaleString()

  });

  localStorage.setItem(
    "currentUser",
    JSON.stringify(currentUser)
  );

  let allUsers =
    JSON.parse(
      localStorage.getItem("users")
    ) || [];

  let index =
    allUsers.findIndex(
      u => u.email === currentUser.email
    );

  if (index !== -1) {

    allUsers[index] =
      currentUser;

    localStorage.setItem(
      "users",
      JSON.stringify(allUsers)
    );

  }

  alert("Withdrawal Successful");

  location.href =
    "dashboard.html";

};

/* ===========================
   HISTORY PAGE
=========================== */

window.loadHistoryPage = function () {

  let currentUser =
    JSON.parse(
      localStorage.getItem("currentUser")
    );

  const table =
    document.getElementById("historyTable");

  if (!table || !currentUser) {
    return;
  }

  table.innerHTML = "";

  currentUser.transactions.forEach(t => {

    table.innerHTML += `
      <tr>
        <td>${t.date}</td>
        <td>${t.type}</td>
        <td>₦${t.amount.toLocaleString()}</td>
      </tr>
    `;

  });

};

/* ===========================
   SCHEDULE TRANSFER
=========================== */

window.scheduleTransfer = function () {

  let receiver =
    document.getElementById("schedReceiver").value;

  let amount =
    Number(document.getElementById("schedAmount").value);

  let date =
    document.getElementById("schedDate").value;

  let currentUser =
    JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    alert("Login Required");
    return;
  }

  if (!receiver || amount <= 0 || !date) {
    alert("Fill all fields correctly");
    return;
  }

  let schedule = {
    receiver,
    amount,
    date,
    status: "Scheduled"
  };

  // Save to user
  currentUser.scheduledTransfers =
    currentUser.scheduledTransfers || [];

  currentUser.scheduledTransfers.push(schedule);

  localStorage.setItem(
    "currentUser",
    JSON.stringify(currentUser)
  );

  // update users list
  let allUsers =
    JSON.parse(localStorage.getItem("users")) || [];

  let index =
    allUsers.findIndex(u => u.email === currentUser.email);

  if (index !== -1) {
    allUsers[index] = currentUser;
    localStorage.setItem("users", JSON.stringify(allUsers));
  }

  alert("Transfer Scheduled Successfully");

  location.href = "dashboard.html";
};

/* ===========================
   STATEMENT PAGE
=========================== */

window.loadStatement = function () {

  let currentUser =
    JSON.parse(
      localStorage.getItem("currentUser")
    );

  if (!currentUser) {
    location.href = "login.html";
    return;
  }

  document.getElementById("statementName").innerText =
    "Account Holder: " + currentUser.fullname;

  document.getElementById("statementBalance").innerText =
    "Current Balance: $" +
    currentUser.balance.toLocaleString();

  const table =
    document.getElementById("statementTable");

  table.innerHTML = "";

  currentUser.transactions.forEach(t => {

    table.innerHTML += `
      <tr>
        <td>${t.date}</td>
        <td>${t.type}</td>
        <td>₦${t.amount.toLocaleString()}</td>
      </tr>
    `;

  });

};

window.downloadStatement = function () {
  window.print();
};

/* ===========================
   CARD DETAILS
=========================== */

window.showCardDetails = function () {

  alert(
    "Card Holder: Jason Beghie\n" +
    "Card Number: **** **** **** 4582\n" +
    "Expiry: 09/28"
  );

};

window.showNotifications = function () {

    window.location.href = "notifications.html";

};

window.toggleMenu = function () {

  document
    .getElementById("sidebar")
    .classList
    .toggle("active");

};

window.showNotifications = function () {

    alert(
        "CAPITAL BANK\n\n" +
        "Notifications\n\n" +
        "• Salary payment received.\n\n" +
        "• Transfer completed successfully.\n\n" +
        "• New security update available.\n\n" +
        "• Fixed Deposit will mature on 15 December 2027."
    );

};

/* ===========================
   CAPITAL BANK CHATBOT
=========================== */

window.sendChat = function () {

    const input = document.getElementById("chatInput");
    const chatBox = document.getElementById("chatBox");

    if (!input || !chatBox) return;

    const message = input.value.trim();

    if (message === "") return;

    chatBox.innerHTML += `
        <div class="user-message">
            <strong>You:</strong><br>${message}
        </div>
    `;

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    const question = message.toLowerCase();

    let reply = "";

    if (question.includes("balance")) {

        reply = "Your available balance is $" +
            currentUser.balance.toLocaleString();

    } else if (question.includes("saving")) {

        reply = "Your savings balance is $" +
            currentUser.savings.toLocaleString();

    } else if (question.includes("transfer")) {

        reply = "To transfer money, open the Transfer page from the menu and enter the recipient details.";

    } else if (question.includes("loan")) {

        reply = "You can apply for a new loan from the Loan Information section on your dashboard.";

    } else if (question.includes("statement")) {

        reply = "Your account statement is available from the Statement page.";

    } else if (question.includes("deposit")) {

        reply = "You can deposit funds using the Deposit page.";

    } else if (question.includes("withdraw")) {

        reply = "You can withdraw funds from the Withdraw page.";

    } else if (question.includes("hello") || question.includes("hi")) {

        reply = "Hello! Welcome to Capital Bank. How may I assist you today?";

    } else if (question.includes("thanks") || question.includes("thank you")) {

        reply = "You're welcome. Thank you for banking with Capital Bank.";

    } else {

        reply = "Sorry, I couldn't understand your request. Please ask about your balance, savings, transfer, loan, deposit, withdrawal, or statement.";

    }

    chatBox.innerHTML += `
        <div class="bot-message">
            <strong>Capital Bank:</strong><br>${reply}
        </div>
    `;

    input.value = "";

    chatBox.scrollTop = chatBox.scrollHeight;

};

window.showMonthlySpending = function () {

    alert(
        "CAPITAL BANK\n\n" +
        "Monthly Spending Report\n\n" +
        "January: $1,250,000\n" +
        "February: $2,100,000\n" +
        "March: $850,000\n" +
        "April: $1,750,000\n" +
        "May: $1,300,000\n" +
        "June: $2,500,000\n" +
        "July: $1,100,000\n" +
        "August: $1,800,000\n" +
        "September: $980,000\n" +
        "October: $2,000,000\n" +
        "November: $1,600,000\n" +
        "December: $2,900,000"
    );

};

window.showBeneficiaries = function () {

    alert(
        "CAPITAL BANK\n\n" +
        "Saved Beneficiaries\n\n" +
        "John Williams\n" +
        "Account: 1029384756\n\n" +
        "Sarah Johnson\n" +
        "Account: 8756341290\n\n" +
        "Michael Brown\n" +
        "Account: 9876543210"
    );

};
/* ===========================
   OPEN FULL HISTORY
=========================== */

window.openHistory = function () {

    window.location.href = "history.html";

};
/* ===========================
   EXCHANGE RATES
=========================== */

window.showExchangeRates = function () {

    alert(
        "CAPITAL BANK\n\n" +
        "Exchange Rates\n\n" +
        "USD: $1,600\n" +
        "EUR: $1,730\n" +
        "GBP: $2,020\n\n" +
        "Rates shown are for information purposes."
    );

};

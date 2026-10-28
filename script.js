const STORAGE_KEY = "vaultify_transactions_v1";

const rupiah = (number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(number);

const form = document.getElementById("transaction-form");
const dateInput = document.getElementById("transaction-date");
const history = document.getElementById("history");

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function loadTransactions() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(saved)) return [];

    return saved.filter((t) =>
      t &&
      typeof t.id === "string" &&
      typeof t.description === "string" &&
      Number.isSafeInteger(t.amount) &&
      t.amount > 0 &&
      ["income", "expense"].includes(t.type) &&
      typeof t.category === "string" &&
      typeof t.date === "string"
    );
  } catch {
    return [];
  }
}

let transactions = loadTransactions();

function saveTransactions() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(transactions)
    );

    render();
  } catch {
    alert(
      "Data gagal disimpan. Periksa penyimpanan browser kamu."
    );
  }
}

function render() {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((total, t) => total + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((total, t) => total + t.amount, 0);

  document.getElementById("balance").textContent =
    rupiah(income - expense);

  document.getElementById("income").textContent =
    rupiah(income);

  document.getElementById("expense").textContent =
    rupiah(expense);

  history.replaceChildren();

  if (transactions.length === 0) {
    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent = "Belum ada transaksi.";
    history.append(message);
    return;
  }

  const sortedTransactions = [...transactions].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      b.id.localeCompare(a.id)
  );

  sortedTransactions.forEach((transaction) => {
    const row = document.createElement("div");
    row.className = "transaction";

    const info = document.createElement("div");
    info.className = "transaction-info";

    const description = document.createElement("strong");
    description.textContent = transaction.description;

    const meta = document.createElement("small");
    meta.textContent =
      `${transaction.category} · ${transaction.date}`;

    info.append(description, meta);

    const right = document.createElement("div");
    right.className = "transaction-right";

    const amount = document.createElement("div");
    amount.className = "transaction-amount";
    amount.classList.add(
      transaction.type === "income" ? "income" : "expense"
    );

    const sign = transaction.type === "income" ? "+" : "−";
    amount.textContent = sign + rupiah(transaction.amount);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Hapus";

    deleteButton.addEventListener("click", () => {
      if (confirm("Yakin ingin menghapus transaksi ini?")) {
        transactions = transactions.filter(
          (t) => t.id !== transaction.id
        );

        saveTransactions();
      }
    });

    right.append(amount, deleteButton);
    row.append(info, right);
    history.append(row);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const description = document
    .getElementById("description")
    .value.trim();

  const amount = Number(
    document.getElementById("amount").value
  );

  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const date = dateInput.value;

  if (
    !description ||
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    !date ||
    date > getToday()
  ) {
    alert("Periksa kembali nama, jumlah, dan tanggal transaksi.");
    return;
  }

  transactions.push({
    id: crypto.randomUUID(),
    description,
    amount,
    type,
    category,
    date
  });

  saveTransactions();

  form.reset();
  dateInput.value = getToday();
});

dateInput.max = getToday();
dateInput.value = getToday();

document.getElementById("current-date").textContent =
  new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

document.getElementById("year").textContent =
  new Date().getFullYear();

render();

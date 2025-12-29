const SHEET_ID = "1ASmrZda3q51kMxzko2i7ShRucQVjytozxlBql7660f8";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

let records = [];

fetch(SHEET_URL)
    .then(res => res.text())
    .then(text => {
        const json = JSON.parse(text.substring(47).slice(0, -2));

        records = json.table.rows.map(row => ({
            name: row.c[1]?.v || "",
            contact: row.c[2]?.v || "",
            location: row.c[3]?.v || "",
            dateObj: parseGoogleDate(row.c[4]?.v),
            timeObj: parseGoogleDate(row.c[5]?.v)
        })).map(r => ({
            ...r,
            date: formatDate(r.dateObj),
            time: formatTime(r.timeObj),
            hour: r.timeObj?.getHours()
        }));

        render(records); // ✅ THIS WILL NOW WORK
    });

// ---------- Google Date Parser ----------

function parseGoogleDate(value) {
    if (!value) return null;

    // value = "Date(2026,0,1)" or "Date(1899,11,30,2,0,0)"
    const parts = value
        .replace("Date(", "")
        .replace(")", "")
        .split(",")
        .map(Number);

    return new Date(
        parts[0],           // year
        parts[1],           // month (0-based)
        parts[2] || 1,       // day
        parts[3] || 0,       // hour
        parts[4] || 0,       // minute
        parts[5] || 0        // second
    );
}

function formatDate(d) {
    if (!d) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // YYYY-MM-DD
}


function formatTime(d) {
    if (!d) return "";
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}


function getTimeBucket(hour) {
    return Math.floor(hour / 3) * 3;
}

// ---------- Render ----------

function render(data) {
    const body = document.getElementById("tableBody");
    const results = document.getElementById("results");

    body.innerHTML = "";
    results.querySelectorAll(".card").forEach(c => c.remove());

    if (data.length === 0) {
        body.innerHTML = `<tr><td colspan="5">No matches found</td></tr>`;
        return;
    }

    // Desktop table
    data.forEach(r => {
        body.innerHTML += `
            <tr>
                <td>${r.name}</td>
                <td>${r.contact}</td>
                <td>${r.date}</td>
                <td>${r.time}</td>
                <td>${r.location}</td>
            </tr>
        `;
    });

    // Mobile cards
    data.forEach(r => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <strong>${r.name}</strong>
            <span>📞 ${r.contact}</span>
            <span>📅 ${r.date}</span>
            <span>⏰ ${r.time}</span>
            <span>📍 ${r.location}</span>
        `;
        results.appendChild(card);
    });
}


// ---------- Filters ----------

document.querySelectorAll("#dateFilter, #timeFilter, #locationFilter")
    .forEach(el => el.addEventListener("change", applyFilters));

function applyFilters() {
    const date = document.getElementById("dateFilter").value;
    const timeBucket = document.getElementById("timeFilter").value;
    const location = document.getElementById("locationFilter").value;

    const filtered = records.filter(r =>
        (!date || r.date === date) &&
        (!timeBucket || getTimeBucket(r.hour) == timeBucket) &&
        (!location || r.location === location)
    );

    render(filtered);
}

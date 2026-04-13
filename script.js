const container = document.getElementById("container");

const today = new Date();
const d = String(today.getDate());
const m = String(today.getMonth() + 1);
const y = String(today.getFullYear());
const date_string = m + '/' + d + '/' + y;

const page_text = "Today is " + date_string;
container.innerHTML = page_text;
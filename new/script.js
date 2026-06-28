async function loadPage(page) {
  const response = await fetch(`pages/${page}.html`);
  const html = await response.text();
  document.getElementById("content").innerHTML = html;
}

// load default page
loadPage("home");
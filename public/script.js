function generatePDF() {
  const name = document.getElementById("nameInput").value.trim();
  const button = document.querySelector("button");
  const statusText = document.getElementById("status");

  if (!name) return alert("Please enter a name");

  button.disabled = true;
  button.textContent = "Generating...";
  statusText.textContent = "";

  fetch("https://biography-generator-y8wq.onrender.com/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  })
    .then(response => {
      if (!response.ok) throw new Error("Failed to generate PDF");
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name.replace(/\s+/g, '_')}_summary.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      statusText.textContent = "✅ PDF downloaded!";
    })
    .catch(error => {
      console.error("Error:", error);
      statusText.textContent = "❌ Something went wrong.";
    })
    .finally(() => {
      button.disabled = false;
      button.textContent = "Generate PDF";
    });
}

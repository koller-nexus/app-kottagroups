// Sem inline: a página é servida fora do proxy, mas a regra de scripts continua a mesma.
const retry = document.getElementById("retry");
const status = document.getElementById("status");

retry.addEventListener("click", async () => {
  retry.disabled = true;
  status.textContent = "Tentando…";
  try {
    // O service worker só intercepta navegações; este fetch vai direto à rede.
    // Qualquer resposta HTTP prova que a conexão voltou; o app trata 401 e redirecionamentos.
    await fetch(location.href, { cache: "no-store" });
    location.reload();
  } catch {
    status.textContent = "Ainda sem conexão. Confira a internet e tente de novo.";
    retry.disabled = false;
  }
});

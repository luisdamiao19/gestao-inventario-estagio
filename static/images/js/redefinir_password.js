// Vai buscar o token que vem no URL depois do #
var parametrosHash = new URLSearchParams(window.location.hash.substring(1));
var tokenUrl = parametrosHash.get("token");

// Guarda o token temporariamente e remove-o da barra do navegador
if (tokenUrl) {
    sessionStorage.setItem("token_recuperacao", tokenUrl);
    window.history.replaceState({}, document.title, "/redefinir-password-page");
}

// Apanha o formulário e a zona da mensagem
var form = document.getElementById("redefinirForm");
var mensagem = document.getElementById("mensagem");


// Mostra mensagens de erro ou sucesso
function mostrarMensagem(tipo, texto) {

    if (tipo === "sucesso") {
        mensagem.classList.remove("text-danger");
        mensagem.classList.add("text-success");
    } else {
        mensagem.classList.remove("text-success");
        mensagem.classList.add("text-danger");
    }

    mensagem.innerText = texto;
}


// Quando o utilizador submete o formulário
form.addEventListener("submit", async function (event) {

    event.preventDefault();

    var nova_password = document.getElementById("nova_password").value;
    var token = sessionStorage.getItem("token_recuperacao");

    if (!token) {
        mostrarMensagem("erro", "Token inválido ou em falta.");
        return;
    }

    if (nova_password === "") {
        mostrarMensagem("erro", "Introduz a nova palavra-passe.");
        return;
    }

    if (nova_password.length < 8) {
        mostrarMensagem("erro", "A palavra-passe deve ter pelo menos 8 caracteres.");
        return;
    }

    try {
        var resposta = await fetch("/redefinir-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: token,
                nova_password: nova_password
            })
        });

        var dados = await resposta.json();

        if (dados.sucesso) {
            mostrarMensagem("sucesso", dados.mensagem);

            sessionStorage.removeItem("token_recuperacao");

            setTimeout(function () {
                window.location.href = "/";
            }, 2000);

        } else {
            mostrarMensagem("erro", dados.mensagem);
        }

    } catch (erro) {
        console.log("Erro:", erro);
        mostrarMensagem("erro", "Erro ao comunicar com o servidor.");
    }

});
// Vai buscar o token que vem no URL depois do #
var parametrosHash = new URLSearchParams(window.location.hash.substring(1));
var tokenUrl = parametrosHash.get("token");

// Guarda o token e remove-o da barra do navegador
if (tokenUrl) {
    sessionStorage.setItem("token_criar_password", tokenUrl);
    window.history.replaceState({}, document.title, "/criar-password-page");
}

var form = document.getElementById("criarPasswordForm");
var mensagem = document.getElementById("mensagem");

// Mostra mensagens na página
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

    var password = document.getElementById("password").value;
    var confirmar_password = document.getElementById("confirmar_password").value;
    var token = sessionStorage.getItem("token_criar_password");

    if (!token) {
        mostrarMensagem("erro", "Token inválido ou em falta.");
        return;
    }

    if (password === "" || confirmar_password === "") {
        mostrarMensagem("erro", "Preencha todos os campos.");
        return;
    }

    if (password.length < 8) {
        mostrarMensagem("erro", "A palavra-passe deve ter pelo menos 8 caracteres.");
        return;
    }

    if (password !== confirmar_password) {
        mostrarMensagem("erro", "As palavras-passe não coincidem.");
        return;
    }

    try {
        var resposta = await fetch("/criar-password-convite", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: token,
                password: password
            })
        });

        var dados = await resposta.json();

        if (dados.sucesso) {
            mostrarMensagem("sucesso", dados.mensagem);

            sessionStorage.removeItem("token_criar_password");

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
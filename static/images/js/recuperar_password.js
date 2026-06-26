// Apanha o formulário
var form = document.getElementById("recuperarForm");
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

    var email = document.getElementById("email").value.trim();

    if (email === "") {
        mostrarMensagem("erro", "Introduz o teu email.");
        return;
    }

    try {
        var resposta = await fetch("/recuperar-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email
            })
        });

        var dados = await resposta.json();

        if (dados.sucesso) {
            mostrarMensagem("sucesso", dados.mensagem);
        } else {
            mostrarMensagem("erro", dados.mensagem);
        }

    } catch (erro) {
        console.log("Erro:", erro);
        mostrarMensagem("erro", "Erro ao comunicar com o servidor.");
    }

});
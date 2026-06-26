// Apanha o formulário de login
var form = document.getElementById("loginForm");
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


// Quando a página carregar
document.addEventListener("DOMContentLoaded", function () {

    var emailGuardado = localStorage.getItem("email_guardado");

    if (emailGuardado) {
        document.getElementById("email").value = emailGuardado;
        document.getElementById("lembrarEmail").checked = true;
    }

});


// Quando o utilizador carrega em Entrar
form.addEventListener("submit", async function (event) {

    event.preventDefault();

    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value;
    var lembrarEmail = document.getElementById("lembrarEmail").checked;

    if (email === "" || password === "") {
        mostrarMensagem("erro", "Preenche o email e a palavra-passe.");
        return;
    }

    try {
        var resposta = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        var dados = await resposta.json();

        if (dados.sucesso) {

            localStorage.setItem("token", dados.token);
            localStorage.setItem("nome_utilizador", dados.utilizador.nome);
            localStorage.setItem("tipo_utilizador", dados.utilizador.tipo);

            if (lembrarEmail) {
                localStorage.setItem("email_guardado", email);
            } else {
                localStorage.removeItem("email_guardado");
            }

            mostrarMensagem("sucesso", "Login com sucesso!");

            window.location.href = "/dashboard";

        } else {
            mostrarMensagem("erro", dados.mensagem);
        }

    } catch (erro) {
        console.log("Erro:", erro);
        mostrarMensagem("erro", "Erro ao comunicar com o servidor.");
    }

});
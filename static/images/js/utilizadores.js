// Termina a sessão do utilizador
function terminarSessao() {
    localStorage.removeItem("token");
    localStorage.removeItem("nome_utilizador");
    localStorage.removeItem("tipo_utilizador");

    window.location.href = "/";
}


// Mostra mensagens de erro ou sucesso
function mostrarMensagem(tipo, texto) {

    var mensagem = document.getElementById("mensagem");

    if (tipo === "sucesso") {
        mensagem.classList.remove("text-danger");
        mensagem.classList.add("text-success");
    } else {
        mensagem.classList.remove("text-success");
        mensagem.classList.add("text-danger");
    }

    mensagem.innerText = texto;
}


// Limpa o formulário do convite
function limparFormularioConvite() {
    document.getElementById("nome").value = "";
    document.getElementById("email").value = "";
    document.getElementById("tipo").value = "";
}


// Quando a página carregar
document.addEventListener("DOMContentLoaded", async function () {

    var token = localStorage.getItem("token");
    var nomeUtilizador = localStorage.getItem("nome_utilizador");

    var boasVindas = document.getElementById("boas-vindas");
    var btnSair = document.getElementById("btnSair");
    var linkUtilizadores = document.getElementById("linkUtilizadores");
    var form = document.getElementById("conviteForm");

    if (btnSair) {
        btnSair.addEventListener("click", function () {
            terminarSessao();
        });
    }

    if (!token) {
        terminarSessao();
        return;
    }

    try {
        var respostaToken = await fetch("/verificar-token", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!respostaToken.ok) {
            terminarSessao();
            return;
        }

        var dadosToken = await respostaToken.json();

        if (!dadosToken.sucesso) {
            terminarSessao();
            return;
        }

        if (dadosToken.utilizador.tipo !== "admin" && dadosToken.utilizador.tipo !== "administrador") {
            window.location.href = "/dashboard";
            return;
        }

        localStorage.setItem("tipo_utilizador", dadosToken.utilizador.tipo);

        if (nomeUtilizador) {
            boasVindas.innerText = "Gestão de Utilizadores - " + nomeUtilizador;
        } else {
            boasVindas.innerText = "Gestão de Utilizadores";
        }

        if (linkUtilizadores) {
            linkUtilizadores.classList.remove("d-none");
        }

    } catch (erro) {
        console.log("Erro ao verificar token:", erro);
        terminarSessao();
        return;
    }

    if (form) {
        form.addEventListener("submit", async function (event) {

            event.preventDefault();

            var nome = document.getElementById("nome").value.trim();
            var email = document.getElementById("email").value.trim();
            var tipo = document.getElementById("tipo").value;

            if (nome === "" || email === "" || tipo === "") {
                mostrarMensagem("erro", "Preencha todos os campos.");
                return;
            }

            try {
                var resposta = await fetch("/utilizadores/convite", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },
                    body: JSON.stringify({
                        nome: nome,
                        email: email,
                        tipo: tipo
                    })
                });

                var dados = await resposta.json();

                if (resposta.status === 401) {
                    terminarSessao();
                    return;
                }

                if (dados.sucesso) {
                    mostrarMensagem("sucesso", dados.mensagem);
                    limparFormularioConvite();

                } else {
                    mostrarMensagem("erro", dados.mensagem);
                }

            } catch (erro) {
                console.log("Erro ao enviar convite:", erro);
                mostrarMensagem("erro", "Erro ao comunicar com o servidor.");
            }

        });
    }

});
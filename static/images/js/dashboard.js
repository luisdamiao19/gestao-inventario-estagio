// Termina a sessão do utilizador
function terminarSessao() {
    localStorage.removeItem("token");
    localStorage.removeItem("nome_utilizador");
    localStorage.removeItem("tipo_utilizador");

    window.location.href = "/";
}


// Vai buscar os dados do dashboard ao backend
async function carregarResumoDashboard(token) {

    try {
        var resposta = await fetch("/dashboard/resumo", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!resposta.ok) {
            console.log("Erro ao obter resumo do dashboard.");
            return;
        }

        var dados = await resposta.json();

        if (!dados.sucesso) {
            console.log(dados.mensagem);
            return;
        }

        // Mostra os valores principais do dashboard
        document.getElementById("total-produtos").innerText = dados.total_produtos;
        document.getElementById("stock-baixo").innerText = dados.stock_baixo;

        var lista = document.getElementById("lista-movimentacoes");

        // Limpa a lista antes de mostrar os dados
        lista.innerHTML = "";

        // Se não houver movimentações
        if (dados.movimentacoes.length === 0) {
            var linha = document.createElement("div");

            linha.classList.add("list-group-item");
            linha.innerText = "Ainda não existem movimentações.";

            lista.appendChild(linha);
            return;
        }

        // Mostra as últimas movimentações
        for (var i = 0; i < dados.movimentacoes.length; i++) {
            var movimento = dados.movimentacoes[i];

            var linha = document.createElement("div");
            linha.classList.add("list-group-item");

            linha.innerText = movimento.produto + " (" + movimento.quantidade + ")";

            lista.appendChild(linha);
        }

    } catch (erro) {
        console.log("Erro ao carregar resumo do dashboard:", erro);
    }
}


// Quando a página carregar, valida o token e carrega o dashboard
document.addEventListener("DOMContentLoaded", async function () {

    var token = localStorage.getItem("token");
    var nome = localStorage.getItem("nome_utilizador");

    var boasVindas = document.getElementById("boas-vindas");
    var tipoUtilizador = document.getElementById("tipo-utilizador");
    var btnSair = document.getElementById("btnSair");
    var linkUtilizadores = document.getElementById("linkUtilizadores");

    // Botão para terminar sessão
    if (btnSair) {
        btnSair.addEventListener("click", function () {
            terminarSessao();
        });
    }

    // Se não existir token, volta para o login
    if (!token) {
        terminarSessao();
        return;
    }

    try {
        // Verifica se o token ainda é válido
        var resposta = await fetch("/verificar-token", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!resposta.ok) {
            terminarSessao();
            return;
        }

        var dados = await resposta.json();

        if (!dados.sucesso) {
            terminarSessao();
            return;
        }

        // Guarda o tipo de utilizador
        localStorage.setItem("tipo_utilizador", dados.utilizador.tipo);

        // Mostra o nome do utilizador
        if (nome) {
            boasVindas.innerText = "Bem-vindo, " + nome;
        } else {
            boasVindas.innerText = "Bem-vindo";
        }

        // Mostra o tipo de utilizador e controla o menu de utilizadores
        if (dados.utilizador.tipo === "admin" || dados.utilizador.tipo === "administrador") {
            tipoUtilizador.innerText = "Administrador";

            if (linkUtilizadores) {
                linkUtilizadores.classList.remove("d-none");
            }

        } else {
            tipoUtilizador.innerText = "Utilizador";
        }

        // Depois de validar o token, carrega os dados do dashboard
        await carregarResumoDashboard(token);

    } catch (erro) {
        console.log("Erro:", erro);
        terminarSessao();
    }

});
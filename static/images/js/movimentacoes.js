// Guarda o tipo de utilizador autenticado
var tipoUtilizadorAtual = "";


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

    setTimeout(function () {
        mensagem.innerText = "";
        mensagem.classList.remove("text-success");
        mensagem.classList.remove("text-danger");
    }, 3000);
}


// Carrega os produtos no select
async function carregarProdutosSelect(token) {

    var selectProduto = document.getElementById("produtoMovimento");

    selectProduto.innerHTML = "<option value=''>A carregar produtos...</option>";

    var resposta = await fetch("/artigos", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    var dados = await resposta.json();

    if (!dados.sucesso) {
        selectProduto.innerHTML = "<option value=''>Erro ao carregar produtos</option>";
        return;
    }

    if (dados.artigos.length === 0) {
        selectProduto.innerHTML = "<option value=''>Não existem produtos</option>";
        return;
    }

    selectProduto.innerHTML = "<option value=''>Selecionar produto</option>";

    for (var i = 0; i < dados.artigos.length; i++) {
        var artigo = dados.artigos[i];

        selectProduto.innerHTML +=
            "<option value='" + artigo.id + "'>" +
                artigo.nome + " - Stock atual: " + artigo.quantidade +
            "</option>";
    }
}


// Limpa o formulário da movimentação
function limparFormularioMovimentacao() {
    document.getElementById("produtoMovimento").value = "";
    document.getElementById("quantidadeMovimento").value = "";
    document.getElementById("motivoMovimento").value = "";
    document.getElementById("observacoesMovimento").value = "";

    var tipos = document.getElementsByName("tipoMovimento");

    for (var i = 0; i < tipos.length; i++) {
        tipos[i].checked = false;
    }
}


// Regista uma nova movimentação
async function registarMovimentacao(token) {

    var artigo_id = document.getElementById("produtoMovimento").value;
    var quantidade = document.getElementById("quantidadeMovimento").value;
    var motivo = document.getElementById("motivoMovimento").value.trim();
    var observacoes = document.getElementById("observacoesMovimento").value.trim();

    var tipoSelecionado = document.querySelector("input[name='tipoMovimento']:checked");

    if (artigo_id === "" || !tipoSelecionado || quantidade === "") {
        mostrarMensagem("erro", "Preencha os campos obrigatórios.");
        return;
    }

    var tipo = tipoSelecionado.value;

    var resposta = await fetch("/movimentos", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
            artigo_id: artigo_id,
            tipo: tipo,
            quantidade: quantidade,
            motivo: motivo,
            observacoes: observacoes
        })
    });

    var dados = await resposta.json();

    if (resposta.status === 403) {
        mostrarMensagem("erro", "Não tem permissão para registar movimentações.");
        return;
    }

    if (dados.sucesso) {
        mostrarMensagem("sucesso", dados.mensagem);

        limparFormularioMovimentacao();

        await carregarProdutosSelect(token);
        await carregarHistoricoMovimentos(token);

    } else {
        mostrarMensagem("erro", dados.mensagem);
    }
}


// Carrega o histórico de movimentações
async function carregarHistoricoMovimentos(token) {

    var tabela = document.getElementById("tabelaMovimentos");

    tabela.innerHTML = "<tr><td colspan='7'>A carregar movimentações...</td></tr>";

    var resposta = await fetch("/movimentos", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    var dados = await resposta.json();

    if (!dados.sucesso) {
        tabela.innerHTML = "<tr><td colspan='7'>Erro ao carregar movimentações.</td></tr>";
        return;
    }

    if (dados.movimentos.length === 0) {
        tabela.innerHTML = "<tr><td colspan='7'>Ainda não existem movimentações.</td></tr>";
        return;
    }

    tabela.innerHTML = "";

    for (var i = 0; i < dados.movimentos.length; i++) {
        var movimento = dados.movimentos[i];

        tabela.innerHTML +=
            "<tr>" +
                "<td>" + movimento.produto + "</td>" +
                "<td>" + movimento.tipo + "</td>" +
                "<td>" + movimento.quantidade + "</td>" +
                "<td>" + movimento.motivo + "</td>" +
                "<td>" + movimento.observacoes + "</td>" +
                "<td>" + movimento.utilizador + "</td>" +
                "<td>" + movimento.data + "</td>" +
            "</tr>";
    }
}


// Quando a página carregar, valida o token e carrega os dados
document.addEventListener("DOMContentLoaded", async function () {

    var token = localStorage.getItem("token");

    if (!token) {
        terminarSessao();
        return;
    }

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

    tipoUtilizadorAtual = dados.utilizador.tipo;
    localStorage.setItem("tipo_utilizador", tipoUtilizadorAtual);

    var nome = localStorage.getItem("nome_utilizador");
    var boasVindas = document.getElementById("boas-vindas");
    var tipoUtilizador = document.getElementById("tipo-utilizador");
    var btnSair = document.getElementById("btnSair");
    var linkUtilizadores = document.getElementById("linkUtilizadores");
    var formMovimentacao = document.getElementById("formMovimentacao");
    var movimentacaoForm = document.getElementById("movimentacaoForm");

    if (nome) {
        boasVindas.innerText = "Bem-vindo, " + nome;
    }

    if (tipoUtilizadorAtual === "admin" || tipoUtilizadorAtual === "administrador") {
        tipoUtilizador.innerText = "Administrador";

        if (linkUtilizadores) {
            linkUtilizadores.classList.remove("d-none");
        }

        if (formMovimentacao) {
            formMovimentacao.classList.remove("d-none");
        }

    } else {
        tipoUtilizador.innerText = "Utilizador";

        if (formMovimentacao) {
            formMovimentacao.classList.add("d-none");
        }
    }

    if (btnSair) {
        btnSair.addEventListener("click", function () {
            terminarSessao();
        });
    }

    if (movimentacaoForm) {
        movimentacaoForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            await registarMovimentacao(token);
        });
    }

    await carregarProdutosSelect(token);
    await carregarHistoricoMovimentos(token);

});
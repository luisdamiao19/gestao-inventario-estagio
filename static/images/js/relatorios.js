// Guarda o tipo de utilizador autenticado
var tipoUtilizadorAtual = "";

// Guarda os produtos usados no relatório
var listaProdutosRelatorio = [];

// Guarda o resumo por produto
var listaResumoProdutos = [];

// Paginação do resumo por produto
var paginaAtualResumo = 1;
var produtosPorPagina = 30;


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


// Carrega os produtos e calcula os dados principais
async function carregarRelatorioProdutos(token) {

    var resposta = await fetch("/artigos", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    var dados = await resposta.json();

    if (!dados.sucesso) {
        mostrarMensagem("erro", "Erro ao carregar os produtos.");
        return;
    }

    listaProdutosRelatorio = dados.artigos;

    var totalProdutos = listaProdutosRelatorio.length;
    var totalStock = 0;
    var produtosStockBaixo = [];

    for (var i = 0; i < listaProdutosRelatorio.length; i++) {
        var produto = listaProdutosRelatorio[i];

        totalStock += produto.quantidade;

        if (produto.quantidade <= produto.stock_minimo) {
            produtosStockBaixo.push(produto);
        }
    }

    document.getElementById("totalProdutos").innerText = totalProdutos;
    document.getElementById("totalStock").innerText = totalStock;
    document.getElementById("totalStockBaixo").innerText = produtosStockBaixo.length;

    mostrarProdutosStockBaixo(produtosStockBaixo);
}


// Mostra os produtos com stock baixo
function mostrarProdutosStockBaixo(produtos) {

    var tabela = document.getElementById("tabelaStockBaixo");

    tabela.innerHTML = "";

    if (produtos.length === 0) {
        tabela.innerHTML = "<tr><td colspan='4'>Não existem produtos com stock baixo.</td></tr>";
        return;
    }

    for (var i = 0; i < produtos.length; i++) {
        var produto = produtos[i];

        tabela.innerHTML +=
            "<tr>" +
                "<td>" + produto.nome + "</td>" +
                "<td>" + produto.quantidade + "</td>" +
                "<td>" + produto.stock_minimo + "</td>" +
                "<td>" + produto.localizacao + "</td>" +
            "</tr>";
    }
}


// Carrega os movimentos e calcula entradas e saídas por produto
async function carregarResumoPorProduto(token) {

    var tabela = document.getElementById("tabelaResumoProdutos");

    tabela.innerHTML = "<tr><td colspan='4'>A carregar resumo...</td></tr>";

    var resposta = await fetch("/movimentos", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    var dados = await resposta.json();

    if (!dados.sucesso) {
        tabela.innerHTML = "<tr><td colspan='4'>Erro ao carregar resumo.</td></tr>";
        return;
    }

    document.getElementById("totalMovimentacoes").innerText = dados.movimentos.length;

    if (listaProdutosRelatorio.length === 0) {
        tabela.innerHTML = "<tr><td colspan='4'>Não existem produtos.</td></tr>";
        return;
    }

    listaProdutosRelatorio.sort(function (a, b) {

        if (a.nome > b.nome) {
            return 1;
        }

        if (a.nome < b.nome) {
            return -1;
        }

        return 0;
    });

    listaResumoProdutos = [];

    for (var i = 0; i < listaProdutosRelatorio.length; i++) {
        var produto = listaProdutosRelatorio[i];

        var totalEntradas = 0;
        var totalSaidas = 0;

        for (var j = 0; j < dados.movimentos.length; j++) {
            var movimento = dados.movimentos[j];

            if (movimento.artigo_id == produto.id) {

                if (movimento.tipo === "entrada") {
                    totalEntradas += movimento.quantidade;
                }

                if (movimento.tipo === "saida") {
                    totalSaidas += movimento.quantidade;
                }
            }
        }

        listaResumoProdutos.push({
            nome: produto.nome,
            totalEntradas: totalEntradas,
            totalSaidas: totalSaidas,
            stockAtual: produto.quantidade
        });
    }

    paginaAtualResumo = 1;

    mostrarResumoPorProduto();
}


// Mostra o resumo por produto com paginação
function mostrarResumoPorProduto() {

    var tabela = document.getElementById("tabelaResumoProdutos");
    var infoPagina = document.getElementById("infoPaginaResumo");
    var btnAnterior = document.getElementById("btnPaginaAnterior");
    var btnSeguinte = document.getElementById("btnPaginaSeguinte");

    tabela.innerHTML = "";

    if (listaResumoProdutos.length === 0) {
        tabela.innerHTML = "<tr><td colspan='4'>Não existem produtos para apresentar.</td></tr>";
        infoPagina.innerText = "Página 0 de 0";
        btnAnterior.disabled = true;
        btnSeguinte.disabled = true;
        return;
    }

    var totalPaginas = Math.ceil(listaResumoProdutos.length / produtosPorPagina);

    if (paginaAtualResumo > totalPaginas) {
        paginaAtualResumo = totalPaginas;
    }
    
    // Calcula a posição onde começa a página
    var inicio = (paginaAtualResumo - 1) * produtosPorPagina;
    
    // Calcula a posição onde acaba a página
    var fim = inicio + produtosPorPagina;
    
    // Vai buscar só os produtos dessa página
    var produtosDaPagina = listaResumoProdutos.slice(inicio, fim);

    for (var i = 0; i < produtosDaPagina.length; i++) {
        var produto = produtosDaPagina[i];

        tabela.innerHTML +=
            "<tr>" +
                "<td>" + produto.nome + "</td>" +
                "<td>" + produto.totalEntradas + "</td>" +
                "<td>" + produto.totalSaidas + "</td>" +
                "<td>" + produto.stockAtual + "</td>" +
            "</tr>";
    }

    infoPagina.innerText = "Página " + paginaAtualResumo + " de " + totalPaginas;

    btnAnterior.disabled = paginaAtualResumo === 1;
    btnSeguinte.disabled = paginaAtualResumo === totalPaginas;
}


// Quando a página carrega
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
    var btnPaginaAnterior = document.getElementById("btnPaginaAnterior");
    var btnPaginaSeguinte = document.getElementById("btnPaginaSeguinte");

    if (nome) {
        boasVindas.innerText = "Bem-vindo, " + nome;
    }

    if (tipoUtilizadorAtual === "admin" || tipoUtilizadorAtual === "administrador") {
        tipoUtilizador.innerText = "Administrador";

        if (linkUtilizadores) {
            linkUtilizadores.classList.remove("d-none");
        }

    } else {
        tipoUtilizador.innerText = "Utilizador";
    }

    if (btnSair) {
        btnSair.addEventListener("click", function () {
            terminarSessao();
        });
    }

    if (btnPaginaAnterior) {
        btnPaginaAnterior.addEventListener("click", function () {
            if (paginaAtualResumo > 1) {
                paginaAtualResumo--;
                mostrarResumoPorProduto();
            }
        });
    }

    if (btnPaginaSeguinte) {
        btnPaginaSeguinte.addEventListener("click", function () {
            var totalPaginas = Math.ceil(listaResumoProdutos.length / produtosPorPagina);

            if (paginaAtualResumo < totalPaginas) {
                paginaAtualResumo++;
                mostrarResumoPorProduto();
            }
        });
    }

    await carregarRelatorioProdutos(token);
    await carregarResumoPorProduto(token);

});
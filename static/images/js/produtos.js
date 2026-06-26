// Guarda o tipo de utilizador autenticado
var tipoUtilizadorAtual = "";

// Guarda todos os produtos vindos da base de dados
var listaProdutos = [];

// Guarda os produtos depois da pesquisa
var listaProdutosFiltrados = [];

// Guarda o id do produto que está a ser editado
var idProdutoEditar = null;

// Guarda o id do produto aberto nos detalhes
var idProdutoDetalhes = null;

// Controlo da paginação
var paginaAtualProdutos = 1;
var produtosPorPagina = 25;


// Termina a sessão do utilizador
function terminarSessao() {
    localStorage.removeItem("token");
    localStorage.removeItem("nome_utilizador");
    localStorage.removeItem("tipo_utilizador");

    window.location.href = "/";
}


// Mostra mensagens na página
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


// Procura um produto pelo id
function procurarProduto(idProduto) {

    for (var i = 0; i < listaProdutos.length; i++) {
        if (listaProdutos[i].id === idProduto) {
            return listaProdutos[i];
        }
    }

    return null;
}


// Escreve os produtos na tabela
function mostrarProdutosNaTabela(produtos) {

    var tabela = document.getElementById("tabelaProdutos");

    tabela.innerHTML = "";

    if (produtos.length === 0) {
        tabela.innerHTML = "<tr><td colspan='9'>Nenhum produto encontrado.</td></tr>";
        return;
    }

    for (var i = 0; i < produtos.length; i++) {
        var produto = produtos[i];

        var imagemTabela =
            "<div class='border rounded d-flex align-items-center justify-content-center text-muted' " +
            "style='width:50px; height:50px; font-size:11px; text-align:center;'>" +
            "Sem<br>imagem" +
            "</div>";

        if (produto.imagem) {
            imagemTabela =
                "<img src='/imagens_produtos/" + produto.imagem + "' " +
                "alt='Imagem do produto' " +
                "style='width:50px; height:50px; object-fit:cover; border-radius:6px;'>";
        }

        var botaoDetalhes =
            "<button class='btn btn-outline-secondary btn-sm' onclick='mostrarDetalhesProduto(" + produto.id + ")'>" +
                "Detalhes" +
            "</button>";

        tabela.innerHTML +=
            "<tr>" +
                "<td>" + imagemTabela + "</td>" +
                "<td>" + produto.nome + "</td>" +
                "<td>" + produto.tipo + "</td>" +
                "<td>" + produto.medida + "</td>" +
                "<td>" + produto.material + "</td>" +
                "<td>" + produto.quantidade + "</td>" +
                "<td>" + produto.stock_minimo + "</td>" +
                "<td>" + produto.localizacao + "</td>" +
                "<td>" + botaoDetalhes + "</td>" +
            "</tr>";
    }
}


// Mostra os produtos da página atual
function mostrarProdutosComPaginacao() {

    var infoPagina = document.getElementById("infoPaginaProdutos");
    var btnAnterior = document.getElementById("btnPaginaAnteriorProdutos");
    var btnSeguinte = document.getElementById("btnPaginaSeguinteProdutos");

    if (listaProdutosFiltrados.length === 0) {
        mostrarProdutosNaTabela([]);

        if (infoPagina) {
            infoPagina.innerText = "Página 0 de 0";
        }

        if (btnAnterior) {
            btnAnterior.disabled = true;
        }

        if (btnSeguinte) {
            btnSeguinte.disabled = true;
        }

        return;
    }
    
    // Dividir em paginas 
    var totalPaginas = Math.ceil(listaProdutosFiltrados.length / produtosPorPagina);

    if (paginaAtualProdutos > totalPaginas) {
        paginaAtualProdutos = totalPaginas;
    }

    // Determinar a posição onde começa a página
    var inicio = (paginaAtualProdutos - 1) * produtosPorPagina;
    
    // Calcula a posição onde acaba a página
    var fim = inicio + produtosPorPagina;
    
    // Vai buscar só os produtos dessa página
    var produtosDaPagina = listaProdutosFiltrados.slice(inicio, fim);

    mostrarProdutosNaTabela(produtosDaPagina);

    if (infoPagina) {
        infoPagina.innerText = "Página " + paginaAtualProdutos + " de " + totalPaginas;
    }

    if (btnAnterior) {
        btnAnterior.disabled = paginaAtualProdutos === 1;
    }

    if (btnSeguinte) {
        btnSeguinte.disabled = paginaAtualProdutos === totalPaginas;
    }
}


// Carrega os produtos vindos do backend
async function carregarProdutos(token) {

    var tabela = document.getElementById("tabelaProdutos");

    tabela.innerHTML = "<tr><td colspan='9'>A carregar produtos...</td></tr>";

    var resposta = await fetch("/artigos", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    var dados = await resposta.json();

    if (!dados.sucesso) {
        tabela.innerHTML = "<tr><td colspan='9'>Erro ao carregar produtos.</td></tr>";
        return;
    }

    listaProdutos = dados.artigos;

    listaProdutos.sort(function (a, b) {

        if (a.nome > b.nome) {
            return 1;
        }

        if (a.nome < b.nome) {
            return -1;
        }

        return 0;
    });

    listaProdutosFiltrados = listaProdutos;
    paginaAtualProdutos = 1;

    mostrarProdutosComPaginacao();
}


// Pesquisa produtos na lista já carregada
function pesquisarProdutos() {

    var texto = document.getElementById("pesquisaProduto").value.trim().toLowerCase();

    var produtosEncontrados = [];

    if (texto === "") {
        listaProdutosFiltrados = listaProdutos;
        paginaAtualProdutos = 1;
        mostrarProdutosComPaginacao();
        return;
    }

    for (var i = 0; i < listaProdutos.length; i++) {
        var produto = listaProdutos[i];

        var nome = (produto.nome || "").toLowerCase();
        var tipo = (produto.tipo || "").toLowerCase();
        var medida = (produto.medida || "").toLowerCase();
        var material = (produto.material || "").toLowerCase();
        var localizacao = (produto.localizacao || "").toLowerCase();
        var codigoBarras = (produto.codigo_barras || "").toLowerCase();

        if (
            nome.includes(texto) ||
            tipo.includes(texto) ||
            medida.includes(texto) ||
            material.includes(texto) ||
            localizacao.includes(texto) ||
            codigoBarras.includes(texto)
        ) {
            produtosEncontrados.push(produto);
        }
    }

    listaProdutosFiltrados = produtosEncontrados;
    paginaAtualProdutos = 1;

    mostrarProdutosComPaginacao();
}


// Limpa o formulário do produto
function limparFormularioProduto() {
    document.getElementById("nomeProduto").value = "";
    document.getElementById("tipoProduto").value = "";
    document.getElementById("medidaProduto").value = "";
    document.getElementById("materialProduto").value = "";
    document.getElementById("quantidadeProduto").value = "";
    document.getElementById("stockMinimoProduto").value = "";
    document.getElementById("localizacaoProduto").value = "";
    document.getElementById("observacoesProduto").value = "";
    document.getElementById("codigoBarrasProduto").value = "";

    if (document.getElementById("imagemProduto")) {
        document.getElementById("imagemProduto").value = "";
    }
}


// Cria um novo produto
async function criarNovoProduto(token) {

    var nome = document.getElementById("nomeProduto").value.trim();
    var tipo = document.getElementById("tipoProduto").value.trim();
    var medida = document.getElementById("medidaProduto").value.trim();
    var material = document.getElementById("materialProduto").value.trim();
    var quantidade = document.getElementById("quantidadeProduto").value;
    var stockMinimo = document.getElementById("stockMinimoProduto").value;
    var localizacao = document.getElementById("localizacaoProduto").value.trim();
    var observacoes = document.getElementById("observacoesProduto").value.trim();
    var codigoBarras = document.getElementById("codigoBarrasProduto").value.trim();
    var imagem = document.getElementById("imagemProduto").files[0];

    if (
        nome === "" ||
        tipo === "" ||
        medida === "" ||
        material === "" ||
        quantidade === "" ||
        stockMinimo === "" ||
        localizacao === ""
    ) {
        mostrarMensagem("erro", "Preencha todos os campos do produto.");
        return;
    }

    var formData = new FormData();

    formData.append("nome", nome);
    formData.append("tipo", tipo);
    formData.append("medida", medida);
    formData.append("material", material);
    formData.append("quantidade", quantidade);
    formData.append("stock_minimo", stockMinimo);
    formData.append("localizacao", localizacao);
    formData.append("observacoes", observacoes);
    formData.append("codigo_barras", codigoBarras);

    if (imagem) {
        formData.append("imagem", imagem);
    }

    var resposta = await fetch("/artigos", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token
        },
        body: formData
    });

    var dados = await resposta.json();

    if (resposta.status === 403) {
        mostrarMensagem("erro", "Não tem permissão para criar produtos.");
        return;
    }

    if (dados.sucesso) {
        mostrarMensagem("sucesso", dados.mensagem);

        limparFormularioProduto();
        document.getElementById("formNovoProduto").classList.add("d-none");

        await carregarProdutos(token);

    } else {
        mostrarMensagem("erro", dados.mensagem);
    }
}


// Prepara o formulário para editar um produto
function prepararEdicaoProduto(idProduto) {

    var produto = procurarProduto(idProduto);

    if (!produto) {
        mostrarMensagem("erro", "Produto não encontrado.");
        return;
    }

    idProdutoEditar = produto.id;

    document.getElementById("tituloFormularioProduto").innerText = "Editar Produto";
    document.getElementById("btnGuardarProduto").innerText = "Atualizar Produto";

    document.getElementById("nomeProduto").value = produto.nome;
    document.getElementById("tipoProduto").value = produto.tipo;
    document.getElementById("medidaProduto").value = produto.medida;
    document.getElementById("materialProduto").value = produto.material;
    document.getElementById("quantidadeProduto").value = produto.quantidade;
    document.getElementById("stockMinimoProduto").value = produto.stock_minimo;
    document.getElementById("localizacaoProduto").value = produto.localizacao;
    document.getElementById("observacoesProduto").value = produto.observacoes || "";
    document.getElementById("codigoBarrasProduto").value = produto.codigo_barras || "";

    document.getElementById("formNovoProduto").classList.remove("d-none");
}


// Atualiza um produto existente
async function atualizarProduto(token) {

    var nome = document.getElementById("nomeProduto").value.trim();
    var tipo = document.getElementById("tipoProduto").value.trim();
    var medida = document.getElementById("medidaProduto").value.trim();
    var material = document.getElementById("materialProduto").value.trim();
    var quantidade = document.getElementById("quantidadeProduto").value;
    var stockMinimo = document.getElementById("stockMinimoProduto").value;
    var localizacao = document.getElementById("localizacaoProduto").value.trim();
    var observacoes = document.getElementById("observacoesProduto").value.trim();
    var codigoBarras = document.getElementById("codigoBarrasProduto").value.trim();
    var imagem = document.getElementById("imagemProduto").files[0];

    if (
        nome === "" ||
        tipo === "" ||
        medida === "" ||
        material === "" ||
        quantidade === "" ||
        stockMinimo === "" ||
        localizacao === ""
    ) {
        mostrarMensagem("erro", "Preencha todos os campos do produto.");
        return;
    }

    var formData = new FormData();

    formData.append("nome", nome);
    formData.append("tipo", tipo);
    formData.append("medida", medida);
    formData.append("material", material);
    formData.append("quantidade", quantidade);
    formData.append("stock_minimo", stockMinimo);
    formData.append("localizacao", localizacao);
    formData.append("observacoes", observacoes);
    formData.append("codigo_barras", codigoBarras);

    if (imagem) {
        formData.append("imagem", imagem);
    }

    var resposta = await fetch("/artigos/" + idProdutoEditar, {
        method: "PUT",
        headers: {
            "Authorization": "Bearer " + token
        },
        body: formData
    });

    var dados = await resposta.json();

    if (resposta.status === 403) {
        mostrarMensagem("erro", "Não tem permissão para editar produtos.");
        return;
    }

    if (dados.sucesso) {
        mostrarMensagem("sucesso", dados.mensagem);

        limparFormularioProduto();

        idProdutoEditar = null;

        document.getElementById("tituloFormularioProduto").innerText = "Novo Produto";
        document.getElementById("btnGuardarProduto").innerText = "Guardar Produto";
        document.getElementById("formNovoProduto").classList.add("d-none");

        await carregarProdutos(token);

    } else {
        mostrarMensagem("erro", dados.mensagem);
    }
}


// Apaga um produto
async function apagarProduto(idProduto) {

    var produto = procurarProduto(idProduto);

    if (!produto) {
        mostrarMensagem("erro", "Produto não encontrado.");
        return;
    }

    var confirmar = confirm("Tem a certeza que pretende apagar o produto: " + produto.nome + "?");

    if (!confirmar) {
        return;
    }

    var token = localStorage.getItem("token");

    var resposta = await fetch("/artigos/" + idProduto, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    var dados = await resposta.json();

    if (resposta.status === 403) {
        mostrarMensagem("erro", "Não tem permissão para apagar produtos.");
        return;
    }

    if (dados.sucesso) {
        mostrarMensagem("sucesso", dados.mensagem);

        document.getElementById("detalhesProduto").classList.add("d-none");

        await carregarProdutos(token);

    } else {
        mostrarMensagem("erro", dados.mensagem);
    }
}


// Mostra os detalhes de um produto
function mostrarDetalhesProduto(idProduto) {

    var produto = procurarProduto(idProduto);

    if (!produto) {
        mostrarMensagem("erro", "Produto não encontrado.");
        return;
    }

    idProdutoDetalhes = produto.id;

    var detalheImagem = document.getElementById("detalheImagem");

    if (produto.imagem) {
        detalheImagem.src = "/imagens_produtos/" + produto.imagem;
        detalheImagem.style.display = "block";
    } else {
        detalheImagem.src = "";
        detalheImagem.style.display = "none";
    }

    document.getElementById("detalheNome").innerText = produto.nome;
    document.getElementById("detalheTipo").innerText = produto.tipo;
    document.getElementById("detalheMedida").innerText = produto.medida;
    document.getElementById("detalheMaterial").innerText = produto.material;
    document.getElementById("detalheQuantidade").innerText = produto.quantidade;
    document.getElementById("detalheStockMinimo").innerText = produto.stock_minimo;
    document.getElementById("detalheLocalizacao").innerText = produto.localizacao;
    document.getElementById("detalheObservacoes").innerText = produto.observacoes || "Sem observações.";
    document.getElementById("detalheCodigoBarras").innerText = produto.codigo_barras || "Sem código de barras.";

    var btnEditarDetalhes = document.getElementById("btnEditarDetalhes");
    var btnApagarDetalhes = document.getElementById("btnApagarDetalhes");
    var btnMostrarFormDocumento = document.getElementById("btnMostrarFormDocumento");

    if (tipoUtilizadorAtual === "admin" || tipoUtilizadorAtual === "administrador") {

        if (btnEditarDetalhes) {
            btnEditarDetalhes.classList.remove("d-none");
        }

        if (btnApagarDetalhes) {
            btnApagarDetalhes.classList.remove("d-none");
        }

        if (btnMostrarFormDocumento) {
            btnMostrarFormDocumento.classList.remove("d-none");
        }

    } else {

        if (btnEditarDetalhes) {
            btnEditarDetalhes.classList.add("d-none");
        }

        if (btnApagarDetalhes) {
            btnApagarDetalhes.classList.add("d-none");
        }

        if (btnMostrarFormDocumento) {
            btnMostrarFormDocumento.classList.add("d-none");
        }
    }

    document.getElementById("detalhesProduto").classList.remove("d-none");

    carregarDocumentosProduto(idProduto);
    carregarMovimentosProduto(idProduto);
}


// Carrega os documentos do produto
async function carregarDocumentosProduto(idProduto) {

    var token = localStorage.getItem("token");
    var lista = document.getElementById("listaDocumentosProduto");

    lista.innerHTML = "<p class='text-muted mb-0'>A carregar documentos...</p>";

    var resposta = await fetch("/artigos/" + idProduto + "/documentos", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    var dados = await resposta.json();

    if (!dados.sucesso) {
        lista.innerHTML = "<p class='text-danger mb-0'>" + dados.mensagem + "</p>";
        return;
    }

    if (dados.documentos.length === 0) {
        lista.innerHTML = "<p class='text-muted mb-0'>Este produto ainda não tem documentos associados.</p>";
        return;
    }

    lista.innerHTML = "";

    for (var i = 0; i < dados.documentos.length; i++) {
        var documento = dados.documentos[i];

        var botaoApagar = "";

        if (tipoUtilizadorAtual === "admin" || tipoUtilizadorAtual === "administrador") {
            botaoApagar =
                "<button class='btn btn-outline-danger btn-sm ms-2' onclick='apagarDocumento(" + documento.id + ")'>" +
                    "Apagar Documento" +
                "</button>";
        }

        lista.innerHTML +=
            "<div class='border rounded p-2 mb-2'>" +
                "<strong>" + documento.nome + "</strong><br>" +
                "<span>Ficheiro: " + documento.ficheiro + "</span><br>" +
                "<span>Notas: " + (documento.notas || "Sem notas") + "</span><br>" +
                "<small class='text-muted'>Data: " + documento.data_upload + "</small>" +
                "<div class='mt-2'>" +
                    "<button class='btn btn-outline-secondary btn-sm' onclick=\"descarregarDocumento('" + documento.ficheiro + "')\">" +
                        "Descarregar Ficheiro" +
                    "</button>" +
                    botaoApagar +
                "</div>" +
            "</div>";
    }
}


// Limpa o formulário do documento
function limparFormularioDocumento() {
    document.getElementById("nomeDocumento").value = "";
    document.getElementById("ficheiroDocumento").value = "";
    document.getElementById("notasDocumento").value = "";
}


// Cria um documento para o produto aberto
async function criarDocumentoProduto(token) {

    var nome = document.getElementById("nomeDocumento").value.trim();
    var ficheiro = document.getElementById("ficheiroDocumento").files[0];
    var notas = document.getElementById("notasDocumento").value.trim();

    if (idProdutoDetalhes === null) {
        mostrarMensagem("erro", "Nenhum produto selecionado.");
        return;
    }

    if (nome === "" || !ficheiro) {
        mostrarMensagem("erro", "Preencha o nome do documento e selecione um ficheiro.");
        return;
    }

    var formData = new FormData();

    formData.append("nome", nome);
    formData.append("ficheiro", ficheiro);
    formData.append("notas", notas);
    formData.append("artigo_id", idProdutoDetalhes);

    var resposta = await fetch("/documentos", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token
        },
        body: formData
    });

    var dados = await resposta.json();

    if (resposta.status === 403) {
        mostrarMensagem("erro", "Não tem permissão para adicionar documentos.");
        return;
    }

    if (dados.sucesso) {
        mostrarMensagem("sucesso", dados.mensagem);

        limparFormularioDocumento();
        document.getElementById("formDocumento").classList.add("d-none");

        await carregarDocumentosProduto(idProdutoDetalhes);

    } else {
        mostrarMensagem("erro", dados.mensagem);
    }
}


// Descarrega um documento
async function descarregarDocumento(nomeFicheiro) {

    var token = localStorage.getItem("token");

    var resposta = await fetch("/documentos/" + encodeURIComponent(nomeFicheiro), {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    if (!resposta.ok) {
        mostrarMensagem("erro", "Erro ao descarregar o documento.");
        return;
    }

    var ficheiro = await resposta.blob();

    var url = window.URL.createObjectURL(ficheiro);

    var link = document.createElement("a");
    link.href = url;
    link.download = nomeFicheiro;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}


// Apaga um documento
async function apagarDocumento(idDocumento) {

    var confirmar = confirm("Tem a certeza que pretende apagar este documento?");

    if (!confirmar) {
        return;
    }

    var token = localStorage.getItem("token");

    var resposta = await fetch("/documentos/" + idDocumento, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    var dados = await resposta.json();

    if (resposta.status === 403) {
        mostrarMensagem("erro", "Não tem permissão para apagar documentos.");
        return;
    }

    if (dados.sucesso) {
        mostrarMensagem("sucesso", dados.mensagem);

        await carregarDocumentosProduto(idProdutoDetalhes);

    } else {
        mostrarMensagem("erro", dados.mensagem);
    }
}


// Carrega as movimentações do produto
async function carregarMovimentosProduto(idProduto) {

    var token = localStorage.getItem("token");
    var lista = document.getElementById("listaMovimentosProduto");

    lista.innerHTML = "<p class='text-muted mb-0'>A carregar movimentações...</p>";

    var resposta = await fetch("/artigos/" + idProduto + "/movimentos", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    var dados = await resposta.json();

    if (!dados.sucesso) {
        lista.innerHTML = "<p class='text-danger mb-0'>" + dados.mensagem + "</p>";
        return;
    }

    if (dados.movimentos.length === 0) {
        lista.innerHTML = "<p class='text-muted mb-0'>Este produto ainda não tem movimentações.</p>";
        return;
    }

    lista.innerHTML = "";

    for (var i = 0; i < dados.movimentos.length; i++) {
        var movimento = dados.movimentos[i];

        lista.innerHTML +=
            "<div class='border rounded p-2 mb-2'>" +
                "<strong>" + movimento.tipo + "</strong><br>" +
                "<span>Quantidade: " + movimento.quantidade + "</span><br>" +
                "<span>Responsavel: " + movimento.utilizador+ "</span><br>" +
                "<small class='text-muted'>Data: " + movimento.data + "</small>" +
            "</div>";
    }
}


// Quando a página carregar
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
    var btnNovoProduto = document.getElementById("btnNovoProduto");
    var pesquisaProduto = document.getElementById("pesquisaProduto");
    var formNovoProduto = document.getElementById("formNovoProduto");
    var novoProdutoForm = document.getElementById("novoProdutoForm");
    var btnCancelarProduto = document.getElementById("btnCancelarProduto");
    var btnFecharDetalhes = document.getElementById("btnFecharDetalhes");
    var btnEditarDetalhes = document.getElementById("btnEditarDetalhes");
    var btnApagarDetalhes = document.getElementById("btnApagarDetalhes");
    var btnMostrarFormDocumento = document.getElementById("btnMostrarFormDocumento");
    var formDocumento = document.getElementById("formDocumento");
    var novoDocumentoForm = document.getElementById("novoDocumentoForm");
    var btnCancelarDocumento = document.getElementById("btnCancelarDocumento");
    var selectProdutosPorPagina = document.getElementById("selectProdutosPorPagina");
    var btnPaginaAnteriorProdutos = document.getElementById("btnPaginaAnteriorProdutos");
    var btnPaginaSeguinteProdutos = document.getElementById("btnPaginaSeguinteProdutos");

    if (nome) {
        boasVindas.innerText = "Bem-vindo, " + nome;
    }

    if (tipoUtilizadorAtual === "admin" || tipoUtilizadorAtual === "administrador") {
        tipoUtilizador.innerText = "Administrador";

        if (linkUtilizadores) {
            linkUtilizadores.classList.remove("d-none");
        }

        if (btnNovoProduto) {
            btnNovoProduto.classList.remove("d-none");
        }

    } else {
        tipoUtilizador.innerText = "Utilizador";
    }

    if (btnSair) {
        btnSair.addEventListener("click", function () {
            terminarSessao();
        });
    }

    if (btnNovoProduto) {
        btnNovoProduto.addEventListener("click", function () {
            idProdutoEditar = null;

            document.getElementById("tituloFormularioProduto").innerText = "Novo Produto";
            document.getElementById("btnGuardarProduto").innerText = "Guardar Produto";

            limparFormularioProduto();

            formNovoProduto.classList.remove("d-none");
        });
    }

    if (pesquisaProduto) {
        pesquisaProduto.addEventListener("input", function () {
            pesquisarProdutos();
        });
    }

    if (btnCancelarProduto) {
        btnCancelarProduto.addEventListener("click", function () {
            idProdutoEditar = null;

            document.getElementById("tituloFormularioProduto").innerText = "Novo Produto";
            document.getElementById("btnGuardarProduto").innerText = "Guardar Produto";

            limparFormularioProduto();
            formNovoProduto.classList.add("d-none");
        });
    }

    if (novoProdutoForm) {
        novoProdutoForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            if (idProdutoEditar === null) {
                await criarNovoProduto(token);
            } else {
                await atualizarProduto(token);
            }
        });
    }

    if (btnEditarDetalhes) {
        btnEditarDetalhes.addEventListener("click", function () {
            prepararEdicaoProduto(idProdutoDetalhes);
        });
    }

    if (btnApagarDetalhes) {
        btnApagarDetalhes.addEventListener("click", async function () {
            await apagarProduto(idProdutoDetalhes);
        });
    }

    if (btnFecharDetalhes) {
        btnFecharDetalhes.addEventListener("click", function () {
            document.getElementById("detalhesProduto").classList.add("d-none");
        });
    }

    if (btnMostrarFormDocumento) {
        btnMostrarFormDocumento.addEventListener("click", function () {
            formDocumento.classList.remove("d-none");
        });
    }

    if (btnCancelarDocumento) {
        btnCancelarDocumento.addEventListener("click", function () {
            formDocumento.classList.add("d-none");
            limparFormularioDocumento();
        });
    }

    if (novoDocumentoForm) {
        novoDocumentoForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            await criarDocumentoProduto(token);
        });
    }

    if (selectProdutosPorPagina) {
        produtosPorPagina = parseInt(selectProdutosPorPagina.value);

        selectProdutosPorPagina.addEventListener("change", function () {
            produtosPorPagina = parseInt(selectProdutosPorPagina.value);
            paginaAtualProdutos = 1;
            mostrarProdutosComPaginacao();
        });
    }

    if (btnPaginaAnteriorProdutos) {
        btnPaginaAnteriorProdutos.addEventListener("click", function () {
            if (paginaAtualProdutos > 1) {
                paginaAtualProdutos--;
                mostrarProdutosComPaginacao();
            }
        });
    }

    if (btnPaginaSeguinteProdutos) {
        btnPaginaSeguinteProdutos.addEventListener("click", function () {
            var totalPaginas = Math.ceil(listaProdutosFiltrados.length / produtosPorPagina);

            if (paginaAtualProdutos < totalPaginas) {
                paginaAtualProdutos++;
                mostrarProdutosComPaginacao();
            }
        });
    }

    await carregarProdutos(token);

});
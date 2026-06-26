CREATE TABLE utilizadores (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    estado VARCHAR(20) NOT NULL,
    token VARCHAR(255)
);

CREATE TABLE artigos (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    medida VARCHAR(20) NOT NULL,
    material VARCHAR(50) NOT NULL,
    quantidade INTEGER NOT NULL,
    stock_minimo INTEGER NOT NULL,
    localizacao VARCHAR(100),
    imagem VARCHAR(255),
    codigo_barras VARCHAR(50) UNIQUE,
    observacoes TEXT
);

CREATE TABLE movimentos (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL,
    quantidade INTEGER NOT NULL,
    data TIMESTAMP NOT NULL,
    observacoes TEXT,
    utilizador_id BIGINT NOT NULL,
    artigo_id BIGINT NOT NULL,
    motivo VARCHAR(150),

    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id),
    FOREIGN KEY (artigo_id) REFERENCES artigos(id)
);

CREATE TABLE documentos (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    ficheiro VARCHAR(255) NOT NULL,
    notas TEXT,
    data_upload TIMESTAMP NOT NULL,
    artigo_id BIGINT NOT NULL,

    FOREIGN KEY (artigo_id) REFERENCES artigos(id)
);
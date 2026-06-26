import jwt
import os
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, jsonify, request, render_template, send_from_directory
from artigos import *
from movimentos import *
from documentos import *
from utilizadores import *
from dashboard import *

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")

OK_CODE = 200
CREATED_CODE = 201
NO_CONTENT_CODE = 204
BAD_REQUEST_CODE = 400
UNAUTHORIZED_CODE = 401
FORBIDDEN_CODE = 403
NOT_FOUND_CODE = 404
SERVER_ERROR_CODE = 500

# Pasta onde vão ser guardadas as imagens dos produtos
PASTA_IMAGENS_PRODUTOS = os.path.join(os.getcwd(), "uploads", "imagens_produtos")

# Pasta onde vão ser guardados os documentos enviados pelo administrador
# os.getcwd() vai buscar a pasta principal do projeto
PASTA_DOCUMENTOS = os.path.join(os.getcwd(), "uploads", "documentos_produtos")


# Extensões de ficheiros permitidas para upload
# Isto evita que sejam enviados ficheiros sem ser destes formatos
EXTENSOES_PERMITIDAS = {"pdf", "png", "jpg", "jpeg", "doc", "docx", "xlsx"}

# Extensões permitidas para imagens dos produtos
EXTENSOES_IMAGEM_PERMITIDAS = {"png", "jpg", "jpeg", "webp"}



def extensao_permitida(nome_ficheiro):
    
    # Se o ficheiro não tiver ponto, não tem extensão
    if "." not in nome_ficheiro:
        return False

    # O lower() transforma em minúsculas para aceitar "PDF", "Pdf"
    extensao = nome_ficheiro.rsplit(".", 1)[1].lower()

    return extensao in EXTENSOES_PERMITIDAS



def extensao_imagem_permitida(nome_ficheiro):

    # Se não tiver ponto, não tem extensão
    if "." not in nome_ficheiro:
        return False

    # Vai buscar a extensão do ficheiro
    extensao = nome_ficheiro.rsplit(".", 1)[1].lower()

    
    return extensao in EXTENSOES_IMAGEM_PERMITIDAS



@app.route("/")
def home():
    return render_template("login.html")



def gerar_token(id_utilizador, nome, tipo):

    payload = {
        "id_utilizador": id_utilizador,
        "nome": nome,
        "tipo": tipo,
        "exp": datetime.utcnow() + timedelta(hours=1)
    }

    token = jwt.encode(
        payload,
        app.config["SECRET_KEY"],
        algorithm="HS256"
    )

    return token



def auth_required(f):

    @wraps(f)
    def decorated(*args, **kwargs):

        if "Authorization" not in request.headers:
            return jsonify({
                "sucesso": False,
                "mensagem": "Token não fornecido."
            }),  UNAUTHORIZED_CODE

        token = request.headers["Authorization"]

        try:
            token = token.split(" ")[1]

            dados_token = jwt.decode(
                token,
                app.config["SECRET_KEY"],
                algorithms=["HS256"]
            )

            request.id_utilizador = dados_token["id_utilizador"]
            request.nome_utilizador = dados_token["nome"]
            request.tipo_utilizador = dados_token["tipo"]

        except jwt.ExpiredSignatureError:
            return jsonify({
                "sucesso": False,
                "mensagem": "Token expirado."
            }),  UNAUTHORIZED_CODE

        except jwt.InvalidTokenError:
            return jsonify({
                "sucesso": False,
                "mensagem": "Token inválido."
            }),  UNAUTHORIZED_CODE

        return f(*args, **kwargs)

    return decorated

#                                  -----FRONT END-----



# Pagina para recuperar a password
@app.route("/recuperar-password-page")
def recuperar_password_page():
    return render_template("recuperar_password.html")



# Pagina para alterar a password
@app.route("/redefinir-password-page")
def redefinir_password_page():
    return render_template("redefinir_password.html")



@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")



# Pagina para criar a password do utilizador
@app.route("/criar-password-page")
def criar_password_page():
    return render_template("criar_password.html")



# Encaminha para a pagina para convidar os utilizadores
@app.route("/utilizadores-page")
def utilizadores_page():
    return render_template("utilizadores.html")



# Encaminha para a pagina dos produtos
@app.route("/produtos-page")
def produtos_page():
    return render_template("produtos.html")



#Aceder a pagina das movimentacoes
@app.route("/movimentacoes-page")
def movimentacoes_page():
    return render_template("movimentacoes.html")



@app.route("/relatorios-page")
def relatorios_page():
    return render_template("relatorios.html")


#                                   -----ARTIGOS-----

@app.route("/artigos", methods=["GET"])
@auth_required
def get_artigos():

    resultado = listar_artigos()

    if resultado["sucesso"]:
        return jsonify(resultado), OK_CODE

    return jsonify(resultado), SERVER_ERROR_CODE



@app.route("/artigos/<int:id_artigo>", methods=["GET"])
@auth_required
def get_artigo_por_id(id_artigo):

    resultado = procurar_artigo_por_id(id_artigo)

    if resultado["sucesso"]:
        return jsonify(resultado), OK_CODE

    return jsonify(resultado), NOT_FOUND_CODE



#Apenas o administrador vai criar artigos
@app.route("/artigos", methods=["POST"])
@auth_required
def criar_novo_artigo():

    if request.tipo_utilizador != "admin" and request.tipo_utilizador != "administrador":
        return jsonify({
            "sucesso": False,
            "mensagem": "Não tem permissão para criar produtos."
        }), FORBIDDEN_CODE

    # Vai buscar os campos de texto enviados pelo FormData
    nome = request.form.get("nome")
    tipo = request.form.get("tipo")
    medida = request.form.get("medida")
    material = request.form.get("material")
    quantidade = request.form.get("quantidade")
    stock_minimo = request.form.get("stock_minimo")
    localizacao = request.form.get("localizacao")
    observacoes = request.form.get("observacoes")
    codigo_barras = request.form.get("codigo_barras")

    # Vai buscar a imagem enviada no formulário
    imagem = request.files.get("imagem")

    nome_imagem = None

    # Se foi enviada uma imagem, valida e guarda na pasta
    if imagem and imagem.filename != "":

        if not extensao_imagem_permitida(imagem.filename):
            return jsonify({
                "sucesso": False,
                "mensagem": "Tipo de imagem não permitido."
            }), BAD_REQUEST_CODE
    
        # Serve para criar a pasta onde fica as imagens guardadas
        os.makedirs(PASTA_IMAGENS_PRODUTOS, exist_ok=True)

        # O nome do ficheiro e limpo para evitar caracteres problemáticos
        nome_imagem = secure_filename(imagem.filename)

        # Onde o ficheiro vai ser guardado
        caminho_imagem = os.path.join(PASTA_IMAGENS_PRODUTOS, nome_imagem)

        if os.path.exists(caminho_imagem):
            return jsonify({
                "sucesso": False,
                "mensagem": "Já existe uma imagem com esse nome."
            }), BAD_REQUEST_CODE

        imagem.save(caminho_imagem)

    resultado = criar_artigo(
        nome,
        tipo,
        medida,
        material,
        quantidade,
        stock_minimo,
        localizacao,
        observacoes,
        nome_imagem,
        codigo_barras
    )

    if resultado["sucesso"]:
        return jsonify(resultado), CREATED_CODE

    return jsonify(resultado), BAD_REQUEST_CODE



@app.route("/artigos/<int:id_artigo>", methods=["PUT"])
@auth_required
def atualizar_artigo(id_artigo):

    if request.tipo_utilizador != "admin" and request.tipo_utilizador != "administrador":
        return jsonify({
            "sucesso": False,
            "mensagem": "Não tem permissão para editar produtos."
        }), FORBIDDEN_CODE

    # Vai buscar os campos de texto enviados pelo FormData
    nome = request.form.get("nome")
    tipo = request.form.get("tipo")
    medida = request.form.get("medida")
    material = request.form.get("material")
    quantidade = request.form.get("quantidade")
    stock_minimo = request.form.get("stock_minimo")
    localizacao = request.form.get("localizacao")
    observacoes = request.form.get("observacoes")
    codigo_barras = request.form.get("codigo_barras")

    # Vai buscar a imagem, caso tenha sido escolhida uma nova
    imagem = request.files.get("imagem")

    # Isto quer dizer que nenhuma imagem nova foi enviada
    nome_imagem = None

    # Só entra aqui se o administrador escolher uma nova imagem
    if imagem and imagem.filename != "":

        if not extensao_imagem_permitida(imagem.filename):
            return jsonify({
                "sucesso": False,
                "mensagem": "Tipo de imagem não permitido."
            }), BAD_REQUEST_CODE
    
        # Cria a pasta das imagens, caso ainda não exista
        os.makedirs(PASTA_IMAGENS_PRODUTOS, exist_ok=True)

        # Limpa o nome do ficheiro
        nome_imagem = secure_filename(imagem.filename)

        # Caminho onde a imagem vai ser guardada
        caminho_imagem = os.path.join(PASTA_IMAGENS_PRODUTOS, nome_imagem)

        # Evita substituir uma imagem que já existe com o mesmo nome
        if os.path.exists(caminho_imagem):
            return jsonify({
                "sucesso": False,
                "mensagem": "Já existe uma imagem com esse nome."
            }), BAD_REQUEST_CODE

        imagem.save(caminho_imagem)

    resultado = editar_artigo(
        id_artigo,
        nome,
        tipo,
        medida,
        material,
        quantidade,
        stock_minimo,
        localizacao,
        observacoes,
        nome_imagem,
        codigo_barras
    )

    if resultado["sucesso"]:
        return jsonify(resultado), OK_CODE

    return jsonify(resultado), BAD_REQUEST_CODE



@app.route("/artigos/<int:id_artigo>", methods=["DELETE"])
@auth_required
def apagar_artigo(id_artigo):

    if request.tipo_utilizador != "admin" and request.tipo_utilizador != "administrador":
        return jsonify({
            "sucesso": False,
            "mensagem": "Não tem permissão para apagar produtos."
        }), FORBIDDEN_CODE

    resultado = eliminar_artigo(id_artigo)

    if resultado["sucesso"]:
        return jsonify(resultado), OK_CODE

    return jsonify(resultado), BAD_REQUEST_CODE



@app.route("/artigos/stock-baixo", methods=["GET"])
@auth_required
def stock_baixo():

    resultado = listar_artigos_stock_baixo()

    if resultado["sucesso"]:
        return jsonify(resultado), OK_CODE

    return jsonify(resultado), SERVER_ERROR_CODE



@app.route("/artigos/codigo/<codigo_barras>", methods=["GET"])
@auth_required
def artigo_por_codigo(codigo_barras):

    resultado = procurar_artigo_por_codigo_barras(codigo_barras)

    if resultado["sucesso"]:
        return jsonify(resultado), OK_CODE

    return jsonify(resultado), NOT_FOUND_CODE



@app.route("/imagens_produtos/<path:nome_ficheiro>", methods=["GET"])
def ver_imagem_produto(nome_ficheiro):

    return send_from_directory(
        PASTA_IMAGENS_PRODUTOS,
        nome_ficheiro
    )



#                                    -----MOVIMENTOS-----

@app.route("/movimentos", methods=["GET"])
@auth_required
def movimentos():

    resultado = listar_movimentos()

    if resultado["sucesso"]:
        return jsonify(resultado), OK_CODE

    return jsonify(resultado), SERVER_ERROR_CODE



@app.route("/artigos/<int:id_artigo>/movimentos", methods=["GET"])
@auth_required
def movimentos_artigo(id_artigo):

    resultado = listar_movimentos_artigo(id_artigo)

    if resultado["sucesso"]:
        return jsonify(resultado), OK_CODE

    return jsonify(resultado), BAD_REQUEST_CODE



@app.route("/movimentos", methods=["POST"])
@auth_required
def criar_movimento():

    if request.tipo_utilizador != "admin" and request.tipo_utilizador != "administrador":
        return jsonify({
            "sucesso": False,
            "mensagem": "Não tem permissão para registar movimentações."
        }), FORBIDDEN_CODE

    dados = request.get_json()

    if not dados:
        return jsonify({
            "sucesso": False,
            "mensagem": "Não foram enviados dados."
        }), BAD_REQUEST_CODE

    resultado = registar_movimento(
        dados.get("tipo"),
        dados.get("quantidade"),
        dados.get("motivo"),
        dados.get("observacoes"),
        request.id_utilizador,
        dados.get("artigo_id")
    )

    if resultado["sucesso"]:
        return jsonify(resultado), CREATED_CODE

    return jsonify(resultado), BAD_REQUEST_CODE


#                                   -----DOCUMENTOS-----

@app.route("/documentos", methods=["POST"])
@auth_required
def adicionar_doc():

    if request.tipo_utilizador != "admin" and request.tipo_utilizador != "administrador":
        return jsonify({
            "sucesso": False,
            "mensagem": "Não tem permissão para adicionar documentos."
        }), FORBIDDEN_CODE

    nome = request.form.get("nome")
    notas = request.form.get("notas")
    artigo_id = request.form.get("artigo_id")
    ficheiro = request.files.get("ficheiro")

    if not nome or not ficheiro or not artigo_id:
        return jsonify({
            "sucesso": False,
            "mensagem": "O nome, o ficheiro e o artigo são obrigatórios."
        }), BAD_REQUEST_CODE

    if not extensao_permitida(ficheiro.filename):
        return jsonify({
            "sucesso": False,
            "mensagem": "Tipo de ficheiro não permitido."
        }), BAD_REQUEST_CODE

    # Serve para criar a pasta onde fica os documentos guardados
    os.makedirs(PASTA_DOCUMENTOS, exist_ok=True)

    # Limpa o nome do ficheiro para evitar caracteres problemáticos
    nome_guardado = secure_filename(ficheiro.filename)

    # Caminho onde o ficheiro vai ser guardado
    caminho_ficheiro = os.path.join(PASTA_DOCUMENTOS, nome_guardado)

    
    if os.path.exists(caminho_ficheiro):
        return jsonify({
            "sucesso": False,
            "mensagem": "Já existe um ficheiro com esse nome."
        }), BAD_REQUEST_CODE

    # Guarda o ficheiro na pasta
    ficheiro.save(caminho_ficheiro) 

    resultado = adicionar_documento(
        nome,
        nome_guardado,
        notas,
        artigo_id
    )

    if resultado["sucesso"]:
        return jsonify(resultado), CREATED_CODE

    return jsonify(resultado), BAD_REQUEST_CODE



@app.route("/artigos/<int:id_artigo>/documentos", methods=["GET"])
@auth_required
def listar_docs(id_artigo):

    resultado = listar_documentos_artigo(id_artigo)

    if resultado["sucesso"]:
        return jsonify(resultado), OK_CODE

    return jsonify(resultado), BAD_REQUEST_CODE



@app.route("/documentos/<path:nome_ficheiro>", methods=["GET"])
@auth_required
def descarregar_documento(nome_ficheiro):

    # Envia o ficheiro que está guardado na pasta dos documentos
    # as_attachment=True força o download em vez de tentar abrir no navegador
    return send_from_directory(
        PASTA_DOCUMENTOS,
        nome_ficheiro,
        as_attachment=True
    )



@app.route("/documentos/<int:id_documento>", methods=["DELETE"])
@auth_required
def apagar_doc(id_documento):

    # Só o administrador pode apagar documentos
    if request.tipo_utilizador != "admin" and request.tipo_utilizador != "administrador":
        return jsonify({
            "sucesso": False,
            "mensagem": "Não tem permissão para eliminar documentos."
        }), FORBIDDEN_CODE

    # Apaga o documento da base de dados
    resultado = eliminar_documento(id_documento)

    if resultado["sucesso"]:

        nome_ficheiro = resultado.get("ficheiro")

        if nome_ficheiro:
            caminho_ficheiro = os.path.join(PASTA_DOCUMENTOS, nome_ficheiro)

            # Se o ficheiro existir na pasta, também é apagado
            if os.path.exists(caminho_ficheiro):
                os.remove(caminho_ficheiro)

        return jsonify(resultado), OK_CODE

    return jsonify(resultado), BAD_REQUEST_CODE


#                                   -----UTILIZADORES-----

@app.route("/utilizadores", methods=["POST"])
@auth_required
def criar_user():

    dados = request.get_json()

    if not dados:
        return jsonify({
            "sucesso": False,
            "mensagem": "Não foram enviados dados em formato JSON."
        }), BAD_REQUEST_CODE

    resultado = criar_utilizador(
        dados.get("nome"),
        dados.get("email"),
        dados.get("password"),
        dados.get("tipo"),
        dados.get("estado"),
        dados.get("token")
    )

    if resultado["sucesso"]:
        return jsonify(resultado), CREATED_CODE

    return jsonify(resultado), BAD_REQUEST_CODE



@app.route("/utilizadores", methods=["GET"])
@auth_required
def get_utilizadores():

    resultado = listar_utilizadores()

    if resultado["sucesso"]:
        return jsonify(resultado), OK_CODE

    return jsonify(resultado), SERVER_ERROR_CODE



@app.route("/login", methods=["POST"])
def login():

    dados = request.get_json()

    if not dados:
        return jsonify({
            "sucesso": False,
            "mensagem": "Não foram enviados dados em formato JSON."
        }), BAD_REQUEST_CODE

    resultado = login_utilizador(
        dados.get("email"),
        dados.get("password")
    )

    if resultado["sucesso"]:
        utilizador = resultado["utilizador"]

        token = gerar_token(
            utilizador["id"],
            utilizador["nome"],
            utilizador["tipo"]
        )

        resultado["token"] = token

        return jsonify(resultado), OK_CODE

    return jsonify(resultado), UNAUTHORIZED_CODE



@app.route("/recuperar-password", methods=["POST"])
def recuperar_password():

    dados = request.get_json()

    if not dados:
        return jsonify({
            "sucesso": False,
            "mensagem": "Não foram enviados dados em formato JSON."
        }), BAD_REQUEST_CODE

    resultado = pedir_recuperacao_password(
        dados.get("email")
    )

    if resultado["sucesso"]:
        return jsonify(resultado), OK_CODE

    return jsonify(resultado), BAD_REQUEST_CODE



@app.route("/redefinir-password", methods=["POST"])
def nova_password():

    dados = request.get_json()

    if not dados:
        return jsonify({
            "sucesso": False,
            "mensagem": "Não foram enviados dados em formato JSON."
        }), BAD_REQUEST_CODE

    resultado = redefinir_password(
        dados.get("token"),
        dados.get("nova_password")
    )

    if resultado["sucesso"]:
        return jsonify(resultado), OK_CODE

    return jsonify(resultado), BAD_REQUEST_CODE



@app.route("/verificar-token", methods=["GET"])
@auth_required
def verificar_token():

    return jsonify({
        "sucesso": True,
        "mensagem": "Token válido.",
        "utilizador": {
            "id": request.id_utilizador,
            "nome": request.nome_utilizador,
            "tipo": request.tipo_utilizador
        }
    }), OK_CODE



@app.route("/utilizadores/convite", methods=["POST"])
@auth_required
def criar_user_convite():

    if request.tipo_utilizador != "admin" and request.tipo_utilizador != "administrador":
        return jsonify({
            "sucesso": False,
            "mensagem": "Não tem permissão para criar utilizadores."
        }), FORBIDDEN_CODE

    dados = request.get_json()
    
    if not dados:
        return jsonify({
            "sucesso": False,
            "mensagem": "Não foram enviados dados em formato JSON."
        }), BAD_REQUEST_CODE

    resultado = criar_utilizador_convite(
        dados.get("nome"),
        dados.get("email"),
        dados.get("tipo")
    )

    if resultado["sucesso"]:
        return jsonify(resultado), CREATED_CODE

    return jsonify(resultado), BAD_REQUEST_CODE


@app.route("/criar-password-convite", methods=["POST"])
def criar_password_convite():

    dados = request.get_json()

    if not dados:
        return jsonify({
            "sucesso": False,
            "mensagem": "Não foram enviados dados em formato JSON."
        }), BAD_REQUEST_CODE

    resultado = criar_password_por_convite(
        dados.get("token"),
        dados.get("password")
    )

    if resultado["sucesso"]:
        return jsonify(resultado), OK_CODE

    return jsonify(resultado), BAD_REQUEST_CODE



@app.route("/dashboard/resumo", methods=["GET"])
@auth_required
def dashboard_resumo():

    resultado = obter_resumo_dashboard()

    if resultado["sucesso"]:
        return jsonify(resultado), OK_CODE

    return jsonify(resultado), SERVER_ERROR_CODE




if __name__ == "__main__":
    app.run(debug=True)
import re
import smtplib
from email.message import EmailMessage
from werkzeug.security import generate_password_hash, check_password_hash
from db import*
import secrets



def criar_utilizador(nome, email, password, tipo, estado="ativo", token=None):

    conn = None
    cur = None

    try:
        if not nome or not email or not password or not tipo:
            return {
                "sucesso": False,
                "mensagem": "Preencha todos os campos obrigatórios."
            }

        conn = obter_ligacao()

        if conn is None:
            return {
                "sucesso": False,
                "mensagem": "Erro na ligação à base de dados."
            }

        cur = conn.cursor()

        cur.execute("""
            SELECT id
            FROM utilizadores
            WHERE email = %s
        """, (email,))

        utilizador_existente = cur.fetchone()

        if utilizador_existente:
            return {
                "sucesso": False,
                "mensagem": "Já existe um utilizador com esse email."
            }
        
        password_hash = generate_password_hash(password)

        cur.execute("""
            INSERT INTO utilizadores (nome, email, password, tipo, estado, token)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (nome, email, password_hash, tipo, estado, token))

        conn.commit()

        return {
            "sucesso": True,
            "mensagem": "Utilizador criado com sucesso."
        }

    except Exception as erro:

        if conn:
            conn.rollback()

        return {
            "sucesso": False,
            "mensagem": f"Erro ao criar utilizador: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)



def listar_utilizadores():

    conn = None
    cur = None

    try:
        conn = obter_ligacao()

        if conn is None:
            return {
                "sucesso": False,
                "mensagem": "Erro na ligação à base de dados."
            }

        cur = conn.cursor()

        cur.execute("""
            SELECT id, nome, email, tipo, estado, token
            FROM utilizadores
            ORDER BY id ASC
        """)

        utilizadores = cur.fetchall()

        return {
            "sucesso": True,
            "utilizadores": utilizadores
        }

    except Exception as erro:
        return {
            "sucesso": False,
            "mensagem": f"Erro ao listar utilizadores: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)



def login_utilizador(email, password):

    conn = None
    cur = None

    try:
        if not email or not password:
            return {
                "sucesso": False,
                "mensagem": "O email e a password são obrigatórios."
            }

        conn = obter_ligacao()

        if conn is None:
            return {
                "sucesso": False,
                "mensagem": "Erro na ligação à base de dados."
            }

        cur = conn.cursor()

        cur.execute("""
            SELECT id, nome, email, password, tipo, estado
            FROM utilizadores
            WHERE email = %s
        """, (email,))

        utilizador = cur.fetchone()

        if not utilizador:
            return {
                "sucesso": False,
                "mensagem": "Utilizador não encontrado."
            }

        id_utilizador = utilizador[0]
        nome = utilizador[1]
        email_bd = utilizador[2]
        password_bd = utilizador[3]
        tipo = utilizador[4]
        estado = utilizador[5]

        # Primeiro verifica se a conta está ativa
        # Para utilizadores criados por convite, eles ficam pendentes até criarem a password
        if estado != "ativo":
            return {
                "sucesso": False,
                "mensagem": "A conta ainda não está ativa. Verifique o email de convite."
            }

        # Se a conta estiver ativa, valida então a password
        if not password_bd or not check_password_hash(password_bd, password):
            return {
                "sucesso": False,
                "mensagem": "Password incorreta."
            }

        return {
            "sucesso": True,
            "mensagem": "Login efetuado com sucesso.",
            "utilizador": {
                "id": id_utilizador,
                "nome": nome,
                "email": email_bd,
                "tipo": tipo,
                "estado": estado
            }
        }

    except Exception as erro:
        return {
            "sucesso": False,
            "mensagem": f"Erro ao efetuar login: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)



def validar_password(password):

    if len(password) < 8:
        return {
            "valida": False,
            "mensagem": "A palavra-passe deve ter pelo menos 8 caracteres."
        }

    if not re.search(r"[A-Z]", password):
        return {
            "valida": False,
            "mensagem": "A palavra-passe deve ter pelo menos uma letra maiúscula."
        }

    if not re.search(r"[a-z]", password):
        return {
            "valida": False,
            "mensagem": "A palavra-passe deve ter pelo menos uma letra minúscula."
        }

    if not re.search(r"[0-9]", password):
        return {
            "valida": False,
            "mensagem": "A palavra-passe deve ter pelo menos um número."
        }

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=/]", password):
        return {
            "valida": False,
            "mensagem": "A palavra-passe deve ter pelo menos um carácter especial."
        }

    return {
        "valida": True,
        "mensagem": "Palavra-passe válida."
    }



def enviar_email_recuperacao(email_destino, token):

    try:
        link = f"{os.getenv('APP_URL')}/redefinir-password-page#token={token}"

        mensagem = EmailMessage()
        mensagem["Subject"] = "Recuperação de palavra-passe"
        mensagem["From"] = os.getenv("EMAIL_FROM")
        mensagem["To"] = email_destino

        mensagem.set_content(f"""
    Olá,

    Foi solicitado um pedido de recuperação de palavra-passe.

    Para alterar a sua palavra-passe, aceda ao seguinte link:

    {link}

    Se não fez este pedido, ignore este email.
    """)

        servidor = smtplib.SMTP(os.getenv("EMAIL_HOST"), int(os.getenv("EMAIL_PORT")))
        servidor.starttls()
        servidor.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASSWORD"))
        servidor.send_message(mensagem)
        servidor.quit()

        return True

    except Exception as erro:
        print("Erro ao enviar email:", erro)
        return False
    



def pedir_recuperacao_password(email):

    conn = None
    cur = None

    try:
        if not email:
            return {
                "sucesso": False,
                "mensagem": "O email é obrigatório."
            }

        conn = obter_ligacao()

        if conn is None:
            return {
                "sucesso": False,
                "mensagem": "Erro na ligação à base de dados."
            }

        cur = conn.cursor()

        cur.execute("""
            SELECT id
            FROM utilizadores
            WHERE email = %s
        """, (email,))

        utilizador = cur.fetchone()

        if not utilizador:
            return {
                "sucesso": False,
                "mensagem": "Utilizador não encontrado."
            }

        token = secrets.token_hex(16)

        cur.execute("""
            UPDATE utilizadores
            SET token= %s
            WHERE email = %s
        """, (token, email))

        conn.commit()

        email_enviado = enviar_email_recuperacao(email, token)

        if not email_enviado:
            return {
        "sucesso": False,
        "mensagem": "Token gerado, mas ocorreu um erro ao enviar o email."
        }

        return{
        "sucesso": True,
        "mensagem": "Foi enviado um email com as instruções para alterar a palavra-chave."
    }

    except Exception as erro:

        if conn:
            conn.rollback()

        return {
            "sucesso": False,
            "mensagem": f"Erro ao pedir recuperação de password: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)



def redefinir_password(token, nova_password):

    conn = None
    cur = None

    try:
        if not token or not nova_password:
            return {
                "sucesso": False,
                "mensagem": "O token e a nova password são obrigatórios."
            }

        validacao_password = validar_password(nova_password)

        if not validacao_password["valida"]:
            return {
                "sucesso": False,
                "mensagem": validacao_password["mensagem"]
            }

        conn = obter_ligacao()

        if conn is None:
            return {
                "sucesso": False,
                "mensagem": "Erro na ligação à base de dados."
            }

        cur = conn.cursor()

        cur.execute("""
            SELECT id
            FROM utilizadores
            WHERE token= %s
        """, (token,))

        utilizador = cur.fetchone()

        if not utilizador:
            return {
                "sucesso": False,
                "mensagem": "Token inválido."
            }

        nova_password_hash = generate_password_hash(nova_password)

        cur.execute("""
            UPDATE utilizadores
            SET password = %s,
                token= NULL
            WHERE token= %s
        """, (nova_password_hash, token))

        conn.commit()

        return {
            "sucesso": True,
            "mensagem": "Password alterada com sucesso."
        }

    except Exception as erro:

        if conn:
            conn.rollback()

        return {
            "sucesso": False,
            "mensagem": f"Erro ao alterar a password: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)



def enviar_email_convite(email_destino, token):

    try:
        link = f"{os.getenv('APP_URL')}/criar-password-page#token={token}"

        mensagem = EmailMessage()
        mensagem["Subject"] = "Convite para acesso à aplicação"
        mensagem["From"] = os.getenv("EMAIL_FROM")
        mensagem["To"] = email_destino

        mensagem.set_content(f"""
    Olá,

    Foi criada uma conta para si na plataforma de gestão de inventário.

    Para definir a sua palavra-passe, aceda ao seguinte link:

    {link}

    Se não estava à espera deste convite, ignore este email.
    """)

        servidor = smtplib.SMTP(os.getenv("EMAIL_HOST"), int(os.getenv("EMAIL_PORT")))
        servidor.starttls()
        servidor.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASSWORD"))
        servidor.send_message(mensagem)
        servidor.quit()

        return True

    except Exception as erro:
        print("Erro ao enviar email de convite:", erro)
        return False
    


def criar_utilizador_convite(nome, email, tipo):

    conn = None
    cur = None

    try:
        if not nome or not email or not tipo:
            return {
                "sucesso": False,
                "mensagem": "Preencha todos os campos obrigatórios."
            }

        conn = obter_ligacao()

        if conn is None:
            return {
                "sucesso": False,
                "mensagem": "Erro na ligação à base de dados."
            }

        cur = conn.cursor()

        cur.execute("""
            SELECT id
            FROM utilizadores
            WHERE email = %s
        """, (email,))

        utilizador_existente = cur.fetchone()

        if utilizador_existente:
            return {
                "sucesso": False,
                "mensagem": "Já existe um utilizador com esse email."
            }

        token = secrets.token_hex(16)

        cur.execute("""
            INSERT INTO utilizadores (nome, email, tipo, estado, token)
            VALUES (%s, %s, %s, %s, %s)
        """, (nome, email, tipo, "pendente", token))

        conn.commit()

        email_enviado = enviar_email_convite(email, token)

        if not email_enviado:
            return {
                "sucesso": False,
                "mensagem": "Utilizador criado, mas ocorreu um erro ao enviar o email de convite."
            }

        return {
            "sucesso": True,
            "mensagem": "Utilizador criado e convite enviado por email."
        }

    except Exception as erro:

        if conn:
            conn.rollback()

        return {
            "sucesso": False,
            "mensagem": f"Erro ao criar utilizador por convite: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)



def criar_password_por_convite(token, password):

    conn = None
    cur = None

    try:
        if not token or not password:
            return {
                "sucesso": False,
                "mensagem": "O token e a palavra-passe são obrigatórios."
            }

        validacao_password = validar_password(password)

        if not validacao_password["valida"]:
            return {
                "sucesso": False,
                "mensagem": validacao_password["mensagem"]
            }

        conn = obter_ligacao()

        if conn is None:
            return {
                "sucesso": False,
                "mensagem": "Erro na ligação à base de dados."
            }

        cur = conn.cursor()

        cur.execute("""
            SELECT id
            FROM utilizadores
            WHERE token= %s
        """, (token,))

        utilizador = cur.fetchone()

        if not utilizador:
            return {
                "sucesso": False,
                "mensagem": "Token inválido ou já utilizado."
            }

        password_hash = generate_password_hash(password)

        cur.execute("""
            UPDATE utilizadores
            SET password = %s,
                estado = %s,
                token= NULL
            WHERE token= %s
        """, (password_hash, "ativo", token))

        conn.commit()

        return {
            "sucesso": True,
            "mensagem": "Palavra-passe criada com sucesso. Pode agora iniciar sessão."
        }

    except Exception as erro:

        if conn:
            conn.rollback()

        return {
            "sucesso": False,
            "mensagem": f"Erro ao criar palavra-passe: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)
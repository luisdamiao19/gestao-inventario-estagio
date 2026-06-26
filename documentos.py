from db import *



def adicionar_documento(nome, ficheiro, notas, artigo_id):

    conn = None
    cur = None

    try:
        if not nome or not ficheiro or not artigo_id:
            return {
                "sucesso": False,
                "mensagem": "O nome, o ficheiro e o artigo são obrigatórios."
            }

        conn = obter_ligacao()

        if conn is None:
            return {
                "sucesso": False,
                "mensagem": "Erro na ligação à base de dados."
            }

        cur = conn.cursor()

        # verificar se o artigo existe
        cur.execute("""
            SELECT id
            FROM artigos
            WHERE id = %s
        """, (artigo_id,))

        artigo = cur.fetchone()

        if not artigo:
            return {
                "sucesso": False,
                "mensagem": "Artigo não encontrado."
            }

        # verificar se o documento já existe associado ao mesmo artigo
        cur.execute("""
            SELECT id
            FROM documentos
            WHERE nome = %s AND ficheiro = %s AND artigo_id = %s
        """, (nome, ficheiro, artigo_id))

        documento_existente = cur.fetchone()

        if documento_existente:
            return {
                "sucesso": False,
                "mensagem": "Este documento já está associado ao artigo."
            }

        cur.execute("""
            INSERT INTO documentos (nome, ficheiro, notas, data_upload, artigo_id)
            VALUES (%s, %s, %s, NOW(), %s)
        """, (nome, ficheiro, notas, artigo_id))

        conn.commit()

        return {
            "sucesso": True,
            "mensagem": "Documento adicionado com sucesso."
        }

    except Exception as erro:

        if conn:
            conn.rollback()

        return {
            "sucesso": False,
            "mensagem": f"Erro ao adicionar documento: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)



def listar_documentos_artigo(id_artigo):

    conn = None
    cur = None

    try:
        if not id_artigo:
            return {
                "sucesso": False,
                "mensagem": "O id do artigo é obrigatório."
            }

        conn = obter_ligacao()

        if conn is None:
            return {
                "sucesso": False,
                "mensagem": "Erro na ligação à base de dados."
            }

        cur = conn.cursor()

        cur.execute("""
            SELECT id, nome, ficheiro, notas, data_upload, artigo_id
            FROM documentos
            WHERE artigo_id = %s
            ORDER BY data_upload DESC
        """, (id_artigo,))

        resultados = cur.fetchall()

        documentos = []

        for documento in resultados:
            documentos.append({
                "id": documento[0],
                "nome": documento[1],
                "ficheiro": documento[2],
                "notas": documento[3],
                "data_upload": documento[4].strftime("%Y-%m-%d %H:%M:%S") if documento[4] else "",
                "artigo_id": documento[5]
            })

        return {
            "sucesso": True,
            "documentos": documentos
        }

    except Exception as erro:
        return {
            "sucesso": False,
            "mensagem": f"Erro ao listar documentos do artigo: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)



def eliminar_documento(id_documento):

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

        # Procura o documento antes de apagar
        # Também vai buscar o nome do ficheiro para depois apagar da pasta
        cur.execute("""
            SELECT id, ficheiro
            FROM documentos
            WHERE id = %s
        """, (id_documento,))

        documento = cur.fetchone()

        if not documento:
            return {
                "sucesso": False,
                "mensagem": "Documento não encontrado."
            }

        ficheiro = documento[1]

        # Apaga o documento da base de dados
        cur.execute("""
            DELETE FROM documentos
            WHERE id = %s
        """, (id_documento,))

        conn.commit()

        return {
            "sucesso": True,
            "mensagem": "Documento eliminado com sucesso.",
            "ficheiro": ficheiro
        }

    except Exception as erro:

        if conn:
            conn.rollback()

        return {
            "sucesso": False,
            "mensagem": f"Erro ao eliminar documento: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)
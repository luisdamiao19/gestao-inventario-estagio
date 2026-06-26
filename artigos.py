from db import *


def listar_artigos():

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
            SELECT id, nome, tipo, medida, material, quantidade, stock_minimo, localizacao, observacoes, imagem, codigo_barras
            FROM artigos
            ORDER BY id ASC
        """)

        linhas = cur.fetchall()

        artigos = []

        for linha in linhas:
            artigos.append({
                "id": linha[0],
                "nome": linha[1],
                "tipo": linha[2],
                "medida": linha[3],
                "material": linha[4],
                "quantidade": linha[5],
                "stock_minimo": linha[6],
                "localizacao": linha[7],
                "observacoes": linha[8],
                "imagem": linha[9],
                "codigo_barras": linha[10]
            })

        return {
            "sucesso": True,
            "artigos": artigos
        }

    except Exception as erro:
        return {
            "sucesso": False,
            "mensagem": f"Erro ao listar artigos: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)



def criar_artigo(nome, tipo, medida, material, quantidade, stock_minimo, localizacao, observacoes=None, imagem=None, codigo_barras=None):

    conn = None
    cur = None

    try:
        if not nome or not tipo or not medida or not material or not localizacao:
            return {
                "sucesso": False,
                "mensagem": "Preencha todos os campos obrigatórios."
            }
        
        # Converter quantidade e stock mínimo para números inteiros
        try:
            quantidade = int(quantidade)
            stock_minimo = int(stock_minimo)
        except:
            return {
                "sucesso": False,
                "mensagem": "A quantidade e o stock mínimo devem ser números."
            }

        if quantidade < 0:
            return {
                "sucesso": False,
                "mensagem": "A quantidade não pode ser negativa."
            }

        if stock_minimo < 0:
            return {
                "sucesso": False,
                "mensagem": "O stock mínimo não pode ser negativo."
            }

        conn = obter_ligacao()

        if conn is None:
            return {
                "sucesso": False,
                "mensagem": "Erro na ligação à base de dados."
            }

        cur = conn.cursor()

        if codigo_barras:
            cur.execute("""
                SELECT id
                FROM artigos
                WHERE codigo_barras = %s
            """, (codigo_barras,))

            artigo_existente = cur.fetchone()

            if artigo_existente:
                return {
                    "sucesso": False,
                    "mensagem": "Já existe um artigo com esse código de barras."
                }

        cur.execute("""
            INSERT INTO artigos (nome, tipo, medida, material, quantidade, stock_minimo, localizacao, observacoes, imagem, codigo_barras)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (nome, tipo, medida, material, quantidade, stock_minimo, localizacao, observacoes, imagem, codigo_barras))

        conn.commit()

        return {
            "sucesso": True,
            "mensagem": "Artigo criado com sucesso."
        }

    except Exception as erro:

        if conn:
            conn.rollback()

        return {
            "sucesso": False,
            "mensagem": f"Erro ao criar artigo: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)



def listar_artigos_stock_baixo():

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
            SELECT id, nome, quantidade, stock_minimo
            FROM artigos
            WHERE quantidade <= stock_minimo
            ORDER BY quantidade ASC
        """)

        artigos = cur.fetchall()

        return {
            "sucesso": True,
            "artigos": artigos
        }

    except Exception as erro:
        return {
            "sucesso": False,
            "mensagem": f"Erro ao listar artigos com stock baixo: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)



def procurar_artigo_por_id(id_artigo):

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
            SELECT *
            FROM artigos
            WHERE id = %s
        """, (id_artigo,))

        artigo = cur.fetchone()

        if not artigo:
            return {
                "sucesso": False,
                "mensagem": "Artigo não encontrado."
            }

        return {
            "sucesso": True,
            "artigo": artigo
        }

    except Exception as erro:
        return {
            "sucesso": False,
            "mensagem": f"Erro ao procurar artigo por id: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)



def procurar_artigo_por_codigo_barras(codigo_barras):

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
            SELECT *
            FROM artigos
            WHERE codigo_barras = %s
        """, (codigo_barras,))

        artigo = cur.fetchone()

        if not artigo:
            return {
                "sucesso": False,
                "mensagem": "Artigo não encontrado com esse código de barras."
            }

        return {
            "sucesso": True,
            "artigo": artigo
        }

    except Exception as erro:
        return {
            "sucesso": False,
            "mensagem": f"Erro ao procurar artigo por código de barras: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)



def editar_artigo(id_artigo, nome, tipo, medida, material, quantidade, stock_minimo, localizacao, observacoes=None, imagem=None, codigo_barras=None):

    conn = None
    cur = None

    try:
        if not nome or not tipo or not medida or not material or not localizacao:
            return {
                "sucesso": False,
                "mensagem": "Preencha todos os campos obrigatórios."
            }

        try:
            quantidade = int(quantidade)
            stock_minimo = int(stock_minimo)
        
        except:
            return {
                "sucesso": False,
                "mensagem": "A quantidade e o stock mínimo devem ser números."
            }

        if quantidade < 0:
            return {
                "sucesso": False,
                "mensagem": "A quantidade não pode ser negativa."
            }

        if stock_minimo < 0:
            return {
                "sucesso": False,
                "mensagem": "O stock mínimo não pode ser negativo."
            }

        conn = obter_ligacao()

        if conn is None:
            return {
                "sucesso": False,
                "mensagem": "Erro na ligação à base de dados."
            }

        cur = conn.cursor()

        cur.execute("""
        SELECT id, imagem
        FROM artigos
        WHERE id = %s
        """, (id_artigo,))

        artigo = cur.fetchone()

        if not artigo:
            return {
                "sucesso": False,
                "mensagem": "Artigo não encontrado."
            }
        
        # Se não foi enviada imagem nova, mantém a imagem antiga
        if imagem is None:
            imagem = artigo[1]

        if codigo_barras:
            cur.execute("""
                SELECT id
                FROM artigos
                WHERE codigo_barras = %s AND id <> %s
            """, (codigo_barras, id_artigo))

            artigo_existente = cur.fetchone()

            if artigo_existente:
                return {
                    "sucesso": False,
                    "mensagem": "Já existe outro artigo com esse código de barras."
                }

        cur.execute("""
            UPDATE artigos
            SET nome = %s,
                tipo = %s,
                medida = %s,
                material = %s,
                quantidade = %s,
                stock_minimo = %s,
                localizacao = %s,
                observacoes = %s,
                imagem = %s,
                codigo_barras = %s
            WHERE id = %s
        """, (nome, tipo, medida, material, quantidade, stock_minimo, localizacao, observacoes, imagem, codigo_barras, id_artigo))

        conn.commit()

        return {
            "sucesso": True,
            "mensagem": "Artigo editado com sucesso."
        }

    except Exception as erro:

        if conn:
            conn.rollback()

        return {
            "sucesso": False,
            "mensagem": f"Erro ao editar artigo: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)



def eliminar_artigo(id_artigo):

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

        # Verifica se o artigo existe
        cur.execute("""
            SELECT id
            FROM artigos
            WHERE id = %s
        """, (id_artigo,))

        artigo = cur.fetchone()

        if not artigo:
            return {
                "sucesso": False,
                "mensagem": "Artigo não encontrado."
            }

        # Primeiro apaga os documentos associados ao artigo
        # Isto evita erros na tabela documentos ao ligada ao artigo
        cur.execute("""
            DELETE FROM documentos
            WHERE artigo_id = %s
        """, (id_artigo,))

        # Depois apaga as movimentações associadas ao artigo
        # Assim o produto pode ser removido mesmo que tenha histórico
        cur.execute("""
            DELETE FROM movimentos
            WHERE artigo_id = %s
        """, (id_artigo,))

        # Por fim, apaga o artigo
        cur.execute("""
            DELETE FROM artigos
            WHERE id = %s
        """, (id_artigo,))

        conn.commit()

        return {
            "sucesso": True,
            "mensagem": "Artigo apagado com sucesso."
        }

    except Exception as erro:

        if conn:
            conn.rollback()

        return {
            "sucesso": False,
            "mensagem": f"Erro ao apagar artigo: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)
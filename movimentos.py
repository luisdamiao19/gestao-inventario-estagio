from db import *



def registar_movimento(tipo, quantidade, motivo, observacoes, id_utilizador, id_artigo):

    conn = None
    cur = None

    try:
        if not tipo or not quantidade or not id_artigo or not id_utilizador:
            return {
                "sucesso": False,
                "mensagem": "Preencha todos os campos obrigatórios."
            }

        tipo = tipo.lower()

        if tipo != "entrada" and tipo != "saida":
            return {
                "sucesso": False,
                "mensagem": "O tipo de movimentação deve ser entrada ou saída."
            }

        try:
            quantidade = int(quantidade)
            id_artigo = int(id_artigo)
            id_utilizador = int(id_utilizador)
        
        except:
            return {
                "sucesso": False,
                "mensagem": "A quantidade, o artigo e o utilizador devem ser valores válidos."
            }

        if quantidade <= 0:
            return {
                "sucesso": False,
                "mensagem": "A quantidade tem de ser maior que zero."
            }

        conn = obter_ligacao()

        if conn is None:
            return {
                "sucesso": False,
                "mensagem": "Erro na ligação à base de dados."
            }

        cur = conn.cursor()

        # Verifica se o artigo existe e vai buscar o stock atual
        cur.execute("""
                        SELECT nome, quantidade
                        FROM artigos
                        WHERE id = %s
                    """, (id_artigo,))

        artigo = cur.fetchone()

        if not artigo:
            return {
                "sucesso": False,
                "mensagem": "Artigo não encontrado."
            }

        nome_artigo = artigo[0]
        stock_atual = artigo[1]

        # Verifica se o utilizador existe
        cur.execute("""
                        SELECT id
                        FROM utilizadores
                        WHERE id = %s
                    """, (id_utilizador,))

        utilizador = cur.fetchone()

        if not utilizador:
            return {
                "sucesso": False,
                "mensagem": "Utilizador não encontrado."
            }

        if tipo == "entrada":
            nova_quantidade = stock_atual + quantidade
        else:
            if quantidade > stock_atual:
                return {
                    "sucesso": False,
                    "mensagem": "Stock insuficiente para realizar a saída."
                }

            nova_quantidade = stock_atual - quantidade

        # Atualiza o stock do artigo
        cur.execute("""
                        UPDATE artigos
                        SET quantidade = %s
                        WHERE id = %s
                    """, (nova_quantidade, id_artigo))

        # Regista o movimento no histórico
        cur.execute("""
            INSERT INTO movimentos (tipo, quantidade, data, observacoes, utilizador_id, artigo_id, motivo)
            VALUES (%s, %s, NOW(), %s, %s, %s, %s)
                    """, (tipo, quantidade, observacoes, id_utilizador, id_artigo, motivo))

        conn.commit()

        return {
            "sucesso": True,
            "mensagem": f"Movimentação registada com sucesso no artigo {nome_artigo}."
        }

    except Exception as erro:

        if conn:
            conn.rollback()

        return {
            "sucesso": False,
            "mensagem": f"Erro ao registar movimentação: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)



def listar_movimentos():

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
                        SELECT movimentos.id,
                            artigos.nome,
                            movimentos.tipo,
                            movimentos.quantidade,
                            movimentos.motivo,
                            movimentos.observacoes,
                            utilizadores.tipo,
                            movimentos.data,
                            movimentos.artigo_id
                            FROM movimentos
                            LEFT JOIN artigos ON movimentos.artigo_id = artigos.id
                            LEFT JOIN utilizadores ON movimentos.utilizador_id = utilizadores.id
                            ORDER BY movimentos.data DESC
                    """)

        linhas = cur.fetchall()

        movimentos = []

        for linha in linhas:
            movimentos.append({
                "id": linha[0],
                "produto": linha[1] if linha[1] else "Produto não encontrado",
                "tipo": linha[2],
                "quantidade": linha[3],
                "motivo": linha[4] if linha[4] else "Sem motivo",
                "observacoes": linha[5] if linha[5] else "Sem observações",
                "utilizador": "Administrador" if linha[6] == "admin" or linha[6] == "administrador" else "Utilizador",
                "data": linha[7].strftime("%Y-%m-%d %H:%M:%S") if linha[7] else "",
                "artigo_id": linha[8]
            })

        return {
            "sucesso": True,
            "movimentos": movimentos
        }

    except Exception as erro:
        return {
            "sucesso": False,
            "mensagem": f"Erro ao listar movimentos: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)



def listar_movimentos_artigo(id_artigo):

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
                        SELECT movimentos.id,
                               movimentos.tipo,
                               movimentos.quantidade,
                               movimentos.data,
                               utilizadores.tipo,
                               movimentos.artigo_id
                        FROM movimentos
                        LEFT JOIN utilizadores ON movimentos.utilizador_id = utilizadores.id
                        WHERE movimentos.artigo_id = %s
                        ORDER BY movimentos.data DESC
                        LIMIT 5
                    """, (id_artigo,))

        resultados = cur.fetchall()

        movimentos = []

        for movimento in resultados:

            tipo_utilizador = movimento[4]

            if tipo_utilizador == "admin" or tipo_utilizador == "administrador":
                utilizador = "Administrador"
            else:
                utilizador = "Utilizador"

            movimentos.append({
                "id": movimento[0],
                "tipo": movimento[1],
                "quantidade": movimento[2],
                "data": movimento[3].strftime("%Y-%m-%d %H:%M:%S") if movimento[3] else "",
                "utilizador": utilizador,
                "artigo_id": movimento[5]
            })

        return {
            "sucesso": True,
            "movimentos": movimentos
        }

    except Exception as erro:
        return {
            "sucesso": False,
            "mensagem": f"Erro ao listar movimentações do artigo: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)
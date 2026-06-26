from db import *



def obter_resumo_dashboard():

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

        # Conta todos os artigos existentes
        cur.execute("SELECT COUNT(*) FROM artigos")

        total_produtos = cur.fetchone()[0]

        # Conta os artigos em que a quantidade é menor ou igual ao stock mínimo
        cur.execute("""
            SELECT COUNT(*)
            FROM artigos
            WHERE quantidade <= stock_minimo
        """)

        stock_baixo = cur.fetchone()[0]

        # Vai buscar as últimas 5 movimentações
        # Junta movimentos com artigos para conseguir mostrar o nome do produto
        cur.execute("""
                        SELECT artigos.nome,
                            movimentos.tipo,
                            movimentos.quantidade,
                            movimentos.data
                    FROM movimentos
                    JOIN artigos ON movimentos.artigo_id = artigos.id
                    ORDER BY movimentos.data DESC
                    LIMIT 5
                """)    

        linhas = cur.fetchall()

        movimentacoes = []

        for linha in linhas:
            nome_produto = linha[0]
            tipo_movimento = linha[1]
            quantidade = linha[2]
            data = linha[3]

            # Se for entrada, aparece com +
            # Se for saída, aparece com -
            if tipo_movimento == "entrada":
                quantidade_formatada = "+" + str(quantidade)
            else:
                quantidade_formatada = "-" + str(quantidade)

            movimentacoes.append({
                "produto": nome_produto,
                "tipo": tipo_movimento,
                "quantidade": quantidade_formatada,
                "data": str(data)
            })

        return {
            "sucesso": True,
            "total_produtos": total_produtos,
            "stock_baixo": stock_baixo,
            "movimentacoes": movimentacoes
        }

    except Exception as erro:
        return {
            "sucesso": False,
            "mensagem": f"Erro ao obter resumo do dashboard: {erro}"
        }

    finally:
        fechar_ligacao(cur, conn)
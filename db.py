import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def obter_ligacao():
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )

       
        cursor = conn.cursor()
        cursor.execute("SET search_path TO inventario;")
        cursor.close()

        return conn

    except Exception as erro:
        print("Erro ao ligar à base de dados:", erro)
        return None
    


def fechar_ligacao(cur=None, conn=None):

    if cur:
        cur.close()

    if conn:
        conn.close()


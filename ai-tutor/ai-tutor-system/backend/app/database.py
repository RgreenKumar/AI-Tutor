import pymysql

def get_connection():
    return pymysql.connect(
        host="localhost",
        user="root",
        password="root123",
        database="ai_tutor",
        cursorclass=pymysql.cursors.DictCursor
    )
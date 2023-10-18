from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from decouple import config
import evadb
import os

cursor = evadb.connect().cursor()
app = Flask(__name__)
CORS(app)

os.environ["OPENAI_KEY"] = config('OPENAI_KEY')
database_name = config('DATABASE_NAME')

@app.route('/chat', methods=['POST'])
@cross_origin()
def reply():
    data = request.get_json()
    message = data.get('message')
    table = data.get('table')
    response = cursor.query(f"""
        SELECT ChatGPT(
          {message}
        )
        FROM {database_name}.{table}
    """).df().to_dict(orient='records')
    return jsonify(response)


@app.route('/query', methods=['POST'])
@cross_origin()
def process_query():
    data = request.get_json()
    query = data.get('query')
    response = cursor.query(f"""
      USE {database_name} {{
        {query}
      }}
    """).df().to_dict(orient='records')
    return jsonify(response)


@app.route('/tables')
@cross_origin()
def get_tables():
    response = cursor.query(f"""
      USE {database_name} {{
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND (table_type = 'BASE TABLE' OR table_type = 'VIEW')
      }}
    """).df().to_dict(orient='records')
    return jsonify(response)


@app.route('/table-data')
@cross_origin()
def get_table():
    table = request.args.get('table')
    response = cursor.query(f"""
      USE {database_name} {{
        SELECT *
        FROM {table}
      }}
    """).df().to_dict(orient='records')
    return jsonify(response)


if __name__ == '__main__':
    app.run()

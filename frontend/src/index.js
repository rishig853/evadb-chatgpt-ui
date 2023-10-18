import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import axios from 'axios';

const App = () => {
  const [tables, setTables] = useState([]);
  const [table, setTable] = useState('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [tableData, setTableData] = useState([]);
  const [chatData, setChatData] = useState([]);
  const [error, setError] = useState(null);
  const backend_server = process.env.REACT_APP_BACKEND_SERVER;

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = () => {
    axios.get(backend_server + '/tables').then((response) => {
      const tableList = response.data;
      setTables(tableList);
    })
    .catch((error) => {
      setError('Error fetching tables: ' + error.message);
    });
  }

  const fetchTableData = (table) => {
    if (table == '') {
      setTableData([]);
    } else {
      axios.get(backend_server + '/table-data', {
        params: {
          table: table,
        },
      })
        .then((response) => {
          setTableData(response.data);
        })
        .catch((error) => {
          setTable('');
          setTableData([]);
        });
    }
  };

  const handleSubmitChat = (e) => {
    e.preventDefault();
    fetch(backend_server + '/chat', {
      method: 'POST',
      body: JSON.stringify({ message: message, table: table }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((response) => response.json())
    .then((data) => {
      setChatData(data);
      setError(null);
    })
    .catch((error) => {
      setError('Error fetching chat data: ' + error.message);
    });
  };

  const handleSubmitQuery = (e) => {
    e.preventDefault();
    fetch(backend_server + '/query', {
      method: 'POST',
      body: JSON.stringify({ query: query }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        fetchTables();
        fetchTableData(table);
        setError(null);
      })
      .catch((error) => {
        setError('Error executing query: ' + error.message);
      });
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmitChat}>
        <h2>Chat</h2>
        <p>The EvaDB ChatGPT query has the format: <br/> 
        SELECT CHATGPT(chatbot_query) FROM (selected_table) <br/>
        Your input into the text box will replace "chatbot_query", and the table you 
        choose will replace "selected_table". </p>
        <input
          type="text"
          id="chat-input"
          placeholder='format: "English message in double quotes", column1, column2, ...'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <select value={table}  onChange={(e) => {
          setTable(e.target.value);
          fetchTableData(e.target.value);
        }}>
            <option value="">Select table/view</option>
            {tables.map((t) => (
              <option key={t["table_name"]} value={t["table_name"]}>
                {t["table_name"]}
              </option>
            ))}
      </select>
        <button type="submit">Send Message</button>
      </form>
      {(chatData.length > 0) && <h2>Response</h2>}
      <table>
          <thead>
            {chatData.length > 0 && (
              <tr>
                {Object.keys(chatData[0]).map((columnName) => (
                  <th key={columnName}>{columnName}</th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {chatData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Object.values(row).map((value, columnIndex) => (
                  <td key={columnIndex}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
      </table>
      <form onSubmit={handleSubmitQuery}>
        <h2>Edit Database</h2>
        <input
          type="text"
          className="query-input"
          placeholder="Enter any PostgreSQL query to modify the database"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Send Query</button>
      </form>
      {!Object.keys(tables).includes(table) && <h2>{table}</h2>}
      <table>
          <thead>
            {tableData.length > 0 && (
              <tr>
                {Object.keys(tableData[0]).map((columnName) => (
                  <th key={columnName}>{columnName}</th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Object.values(row).map((value, columnIndex) => (
                  <td key={columnIndex}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

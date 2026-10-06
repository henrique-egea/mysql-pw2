import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import mysql from 'mysql2/promise';
import { parseFuncionarioId, validateFuncionario } from './validation.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'crud_funcionarios',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: false
});

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/api/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});

app.get('/api/funcionarios', async (_req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, nome, funcao, salario, created_at, updated_at FROM funcionarios ORDER BY id DESC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/funcionarios', async (req, res, next) => {
  const result = validateFuncionario(req.body);
  if (result.error) return res.status(400).json({ error: result.error });

  try {
    const [insert] = await db.execute(
      'INSERT INTO funcionarios (nome, funcao, salario) VALUES (?, ?, ?)',
      [result.value.nome, result.value.funcao, result.value.salario]
    );
    const [rows] = await db.execute(
      'SELECT id, nome, funcao, salario, created_at, updated_at FROM funcionarios WHERE id = ?',
      [insert.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put('/api/funcionarios/:id', async (req, res, next) => {
  const id = parseFuncionarioId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'ID de funcionário inválido.' });

  const result = validateFuncionario(req.body);
  if (result.error) return res.status(400).json({ error: result.error });

  try {
    await db.execute(
      'UPDATE funcionarios SET nome = ?, funcao = ?, salario = ? WHERE id = ?',
      [result.value.nome, result.value.funcao, result.value.salario, id]
    );
    const [rows] = await db.execute(
      'SELECT id, nome, funcao, salario, created_at, updated_at FROM funcionarios WHERE id = ?',
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Funcionário não encontrado.' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/funcionarios/:id', async (req, res, next) => {
  const id = parseFuncionarioId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'ID de funcionário inválido.' });

  try {
    const [result] = await db.execute('DELETE FROM funcionarios WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint não encontrado.' }));
app.use(express.static(path.join(currentDirectory, '..', 'public'), { maxAge: '1h' }));
app.get('*splat', (_req, res) => res.sendFile(path.join(currentDirectory, '..', 'public', 'index.html')));

app.use((error, _req, res, _next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'O corpo da requisição contém JSON inválido.' });
  }
  console.error('Erro na API:', error.message);
  res.status(500).json({ error: 'Não foi possível concluir a operação. Tente novamente.' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Sistema de funcionários disponível na porta ${port}.`);
});

async function shutdown(signal) {
  console.log(`${signal} recebido; encerrando o servidor.`);
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

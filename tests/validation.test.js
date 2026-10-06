import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFuncionarioId, validateFuncionario } from '../src/validation.js';

test('normaliza os campos e aceita salário com vírgula decimal', () => {
  assert.deepEqual(validateFuncionario({ nome: '  Ana Lima ', funcao: ' Analista ', salario: '4250,5' }), {
    value: { nome: 'Ana Lima', funcao: 'Analista', salario: '4250.50' }
  });
});

test('rejeita campos obrigatórios ausentes e textos acima do limite', () => {
  assert.match(validateFuncionario({ nome: '', funcao: 'Analista', salario: '1000' }).error, /Preencha/);
  assert.match(validateFuncionario({ nome: 'a'.repeat(101), funcao: 'Analista', salario: '1000' }).error, /100 caracteres/);
});

test('rejeita salário inválido, negativo e acima do limite do banco', () => {
  for (const salario of ['0', '-10', '100,999', '100000000']) {
    assert.ok(validateFuncionario({ nome: 'Ana', funcao: 'Analista', salario }).error);
  }
});

test('aceita apenas IDs inteiros positivos seguros', () => {
  assert.equal(parseFuncionarioId('42'), 42);
  assert.equal(parseFuncionarioId('0'), null);
  assert.equal(parseFuncionarioId('1.2'), null);
  assert.equal(parseFuncionarioId('9007199254740992'), null);
});

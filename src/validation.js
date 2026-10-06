const MAX_TEXT_LENGTH = 100;
const SALARY_PATTERN = /^\d{1,8}(?:[.,]\d{1,2})?$/;

export function validateFuncionario(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { error: 'Envie os dados do funcionário em formato JSON.' };
  }

  const nome = typeof payload.nome === 'string' ? payload.nome.trim() : '';
  const funcao = typeof payload.funcao === 'string' ? payload.funcao.trim() : '';
  const salarioEntrada = String(payload.salario ?? '').trim();

  if (!nome || !funcao || !salarioEntrada) {
    return { error: 'Preencha nome, função e salário.' };
  }
  if (nome.length > MAX_TEXT_LENGTH || funcao.length > MAX_TEXT_LENGTH) {
    return { error: 'Nome e função devem ter no máximo 100 caracteres.' };
  }
  if (!SALARY_PATTERN.test(salarioEntrada)) {
    return { error: 'Informe um salário válido, com até duas casas decimais.' };
  }

  const salario = Number(salarioEntrada.replace(',', '.'));
  if (!Number.isFinite(salario) || salario <= 0 || salario > 99999999.99) {
    return { error: 'O salário deve ser maior que zero e não ultrapassar R$ 99.999.999,99.' };
  }

  return {
    value: {
      nome,
      funcao,
      salario: salario.toFixed(2)
    }
  };
}

export function parseFuncionarioId(value) {
  if (!/^\d+$/.test(String(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

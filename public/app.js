const elements = {
  list: document.querySelector('#employee-list'),
  total: document.querySelector('#total-count'),
  roles: document.querySelector('#role-count'),
  visible: document.querySelector('#visible-count'),
  status: document.querySelector('#table-status'),
  empty: document.querySelector('#empty-state'),
  emptyTitle: document.querySelector('#empty-title'),
  emptyDescription: document.querySelector('#empty-description'),
  emptyAction: document.querySelector('#empty-action'),
  search: document.querySelector('#search'),
  dialog: document.querySelector('#employee-dialog'),
  form: document.querySelector('#employee-form'),
  id: document.querySelector('#employee-id'),
  name: document.querySelector('#employee-name'),
  role: document.querySelector('#employee-role'),
  salary: document.querySelector('#employee-salary'),
  formError: document.querySelector('#form-error'),
  save: document.querySelector('#save-employee'),
  toast: document.querySelector('#toast')
};

let employees = [];
let toastTimer;

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

async function request(url, options) {
  const response = await fetch(url, options);
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Não foi possível concluir a operação.');
  return body;
}

function avatarInitial(name) {
  return name.trim().charAt(0).toLocaleUpperCase('pt-BR') || '?';
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date);
}

function actionButton(label, action, employeeId) {
  const button = document.createElement('button');
  button.className = `icon-button row-action ${action}`;
  button.type = 'button';
  button.setAttribute('aria-label', `${label} ${employees.find((item) => item.id === employeeId)?.nome || 'funcionário'}`);
  button.dataset.action = action;
  button.dataset.id = employeeId;
  const paths = action === 'edit'
    ? '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
    : '<path d="M3 6h18m-2 0-.9 14H5.9L5 6m3 0V4h8v2m-7 4v6m4-6v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>';
  button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${paths}</svg>`;
  return button;
}

function render() {
  const query = elements.search.value.trim().toLocaleLowerCase('pt-BR');
  const visibleEmployees = employees.filter((employee) =>
    `${employee.nome} ${employee.funcao}`.toLocaleLowerCase('pt-BR').includes(query)
  );

  elements.list.replaceChildren();
  for (const employee of visibleEmployees) {
    const row = document.createElement('tr');
    const identity = document.createElement('td');
    identity.className = 'employee-cell';
    const avatar = document.createElement('span');
    avatar.className = 'employee-avatar';
    avatar.textContent = avatarInitial(employee.nome);
    const name = document.createElement('span');
    name.className = 'employee-name';
    name.textContent = employee.nome;
    identity.append(avatar, name);

    const role = document.createElement('td');
    const roleBadge = document.createElement('span');
    roleBadge.className = 'role-badge';
    roleBadge.textContent = employee.funcao;
    role.append(roleBadge);

    const salary = document.createElement('td');
    salary.className = 'salary-cell';
    salary.textContent = currency.format(Number(employee.salario));

    const createdAt = document.createElement('td');
    createdAt.className = 'date-cell';
    createdAt.textContent = formatDate(employee.created_at);

    const actions = document.createElement('td');
    actions.className = 'row-actions';
    actions.append(actionButton('Editar', 'edit', employee.id), actionButton('Excluir', 'delete', employee.id));
    row.append(identity, role, salary, createdAt, actions);
    elements.list.append(row);
  }

  elements.total.textContent = employees.length;
  elements.roles.textContent = new Set(employees.map((employee) => employee.funcao.toLocaleLowerCase('pt-BR'))).size;
  elements.visible.textContent = `${visibleEmployees.length} ${visibleEmployees.length === 1 ? 'pessoa' : 'pessoas'}`;
  elements.empty.hidden = visibleEmployees.length > 0;
  if (employees.length === 0) {
    elements.emptyTitle.textContent = 'Sua equipe começa aqui';
    elements.emptyDescription.textContent = 'Adicione seu primeiro funcionário para manter tudo organizado.';
    elements.emptyAction.hidden = false;
  } else if (visibleEmployees.length === 0) {
    elements.emptyTitle.textContent = 'Nenhum resultado encontrado';
    elements.emptyDescription.textContent = 'Tente buscar por outro nome ou função.';
    elements.emptyAction.hidden = true;
  }
}

async function loadEmployees() {
  elements.status.textContent = 'Carregando equipe...';
  try {
    employees = await request('/api/funcionarios');
    render();
    elements.status.textContent = employees.length
      ? `${employees.length} ${employees.length === 1 ? 'cadastro carregado' : 'cadastros carregados'}`
      : 'Nenhum funcionário cadastrado';
  } catch (error) {
    elements.status.textContent = error.message;
    elements.empty.hidden = false;
    elements.emptyTitle.textContent = 'Não foi possível carregar a equipe';
    elements.emptyDescription.textContent = 'Confira sua conexão e tente novamente.';
    elements.emptyAction.hidden = true;
    showToast(error.message, 'error');
  }
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach((element) => { element.textContent = ''; });
  elements.formError.hidden = true;
  elements.formError.textContent = '';
}

function openDialog(employee) {
  elements.form.reset();
  clearErrors();
  elements.id.value = employee?.id ?? '';
  elements.name.value = employee?.nome ?? '';
  elements.role.value = employee?.funcao ?? '';
  elements.salary.value = employee ? Number(employee.salario).toFixed(2).replace('.', ',') : '';
  document.querySelector('#dialog-title').textContent = employee ? 'Editar funcionário' : 'Adicionar funcionário';
  document.querySelector('.dialog-heading .eyebrow').textContent = employee ? 'ATUALIZAR CADASTRO' : 'NOVO CADASTRO';
  document.querySelector('#save-employee span').textContent = employee ? 'Salvar alterações' : 'Salvar funcionário';
  elements.dialog.showModal();
  elements.name.focus();
}

function showToast(message, kind = 'success') {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.className = `toast visible ${kind}`;
  toastTimer = setTimeout(() => { elements.toast.className = 'toast'; }, 3200);
}

document.querySelector('#new-employee').addEventListener('click', () => openDialog());
elements.emptyAction.addEventListener('click', () => openDialog());
document.querySelector('#close-dialog').addEventListener('click', () => elements.dialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => elements.dialog.close());
document.querySelector('#refresh').addEventListener('click', loadEmployees);
elements.search.addEventListener('input', render);

elements.dialog.addEventListener('click', (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});

elements.list.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const employee = employees.find((item) => String(item.id) === button.dataset.id);
  if (!employee) return;
  if (button.dataset.action === 'edit') return openDialog(employee);
  if (!window.confirm(`Excluir o cadastro de ${employee.nome}?`)) return;
  button.disabled = true;
  try {
    await request(`/api/funcionarios/${employee.id}`, { method: 'DELETE' });
    showToast('Funcionário excluído com sucesso.');
    await loadEmployees();
  } catch (error) {
    showToast(error.message, 'error');
    button.disabled = false;
  }
});

elements.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors();
  const nome = elements.name.value.trim();
  const funcao = elements.role.value.trim();
  const salario = elements.salary.value.trim().replace(',', '.');
  let invalid = false;

  if (!nome) { document.querySelector('#name-error').textContent = 'Informe o nome completo.'; invalid = true; }
  if (!funcao) { document.querySelector('#role-error').textContent = 'Informe a função.'; invalid = true; }
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(salario) || Number(salario) <= 0) {
    document.querySelector('#salary-error').textContent = 'Informe um salário válido, maior que zero.';
    invalid = true;
  }
  if (invalid) return;

  elements.save.disabled = true;
  document.querySelector('#save-employee span').textContent = 'Salvando...';
  const isEditing = Boolean(elements.id.value);
  try {
    await request(isEditing ? `/api/funcionarios/${elements.id.value}` : '/api/funcionarios', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, funcao, salario })
    });
    elements.dialog.close();
    showToast(isEditing ? 'Cadastro atualizado com sucesso.' : 'Funcionário adicionado com sucesso.');
    await loadEmployees();
  } catch (error) {
    elements.formError.textContent = error.message;
    elements.formError.hidden = false;
  } finally {
    elements.save.disabled = false;
    document.querySelector('#save-employee span').textContent = isEditing ? 'Salvar alterações' : 'Salvar funcionário';
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !elements.dialog.open && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    elements.search.focus();
  }
});

loadEmployees();

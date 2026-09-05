const API_URL = '/clientes'

const formCliente = document.getElementById('formCliente')
const clienteId = document.getElementById('clienteId')
const nome = document.getElementById('nome')
const cpf = document.getElementById('cpf')
const email = document.getElementById('email')
const estadoCivil = document.getElementById('estadoCivil')
const ativo = document.getElementById('ativo')
const tabelaClientes = document.getElementById('tabelaClientes')
const mensagem = document.getElementById('mensagem')
const tituloFormulario = document.getElementById('tituloFormulario')
const btnSalvar = document.getElementById('btnSalvar')
const btnCancelar = document.getElementById('btnCancelar')
const btnAtualizar = document.getElementById('btnAtualizar')

let clientes = []

function mostrarMensagem(texto, tipo = 'success') {
  mensagem.textContent = texto
  mensagem.className = `alert alert-${tipo}`

  setTimeout(() => {
    mensagem.className = 'alert d-none'
    mensagem.textContent = ''
  }, 3000)
}

function limparFormulario() {
  formCliente.reset()
  clienteId.value = ''
  ativo.checked = true
  tituloFormulario.textContent = 'Cadastrar cliente'
  btnSalvar.textContent = 'Salvar'
}

function montarClienteDoFormulario() {
  return {
    nome: nome.value.trim(),
    cpf: cpf.value.trim(),
    email: email.value.trim(),
    estadoCivil: estadoCivil.value,
    ativo: ativo.checked,
  }
}

function preencherFormulario(cliente) {
  clienteId.value = cliente.id
  nome.value = cliente.nome
  cpf.value = cliente.cpf
  email.value = cliente.email
  estadoCivil.value = cliente.estadoCivil
  ativo.checked = cliente.ativo
  tituloFormulario.textContent = 'Editar cliente'
  btnSalvar.textContent = 'Atualizar'
  nome.focus()
}

function renderizarClientes() {
  if (clientes.length === 0) {
    tabelaClientes.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    Nenhum cliente cadastrado.
                </td>
            </tr>
        `
    return
  }

  tabelaClientes.innerHTML = clientes
    .map(
      (cliente) => `
        <tr>
            <td>${cliente.id}</td>
            <td>${cliente.nome}</td>
            <td>${cliente.cpf}</td>
            <td>${cliente.email}</td>
            <td>${cliente.estadoCivil}</td>
            <td>
                <span class="badge ${cliente.ativo ? 'text-bg-success' : 'text-bg-secondary'}">
                    ${cliente.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td class="text-end">
                <button class="btn btn-sm btn-warning me-2" onclick="editarCliente(${cliente.id})">
                    Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="removerCliente(${cliente.id})">
                    Excluir
                </button>
            </td>
        </tr>
    `,
    )
    .join('')
}

async function carregarClientes() {
  try {
    const resposta = await fetch(API_URL)
    clientes = await resposta.json()
    renderizarClientes()
  } catch (erro) {
    mostrarMensagem('Erro ao carregar clientes.', 'danger')
  }
}

async function salvarCliente(event) {
  event.preventDefault()

  const id = clienteId.value
  const cliente = montarClienteDoFormulario()

  const url = id ? `${API_URL}/${id}` : API_URL
  const metodo = id ? 'PUT' : 'POST'

  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cliente),
    })

    console.log(resposta)

    if (!resposta.ok) {
      throw new Error('Erro ao salvar cliente.')
    }

    mostrarMensagem(
      id
        ? 'Cliente atualizado com sucesso.'
        : 'Cliente cadastrado com sucesso.',
    )
    limparFormulario()
    await carregarClientes()
  } catch (erro) {
    mostrarMensagem(
      `Erro ao salvar cliente. Verifique os dados informados.[${erro}]`,
      'danger',
    )
  }
}

function editarCliente(id) {
  const cliente = clientes.find((item) => item.id === id)

  if (!cliente) {
    mostrarMensagem('Cliente não encontrado.', 'warning')
    return
  }

  preencherFormulario(cliente)
}

async function removerCliente(id) {
  const confirmar = confirm('Deseja realmente excluir este cliente?')

  if (!confirmar) {
    return
  }

  try {
    const resposta = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    })

    if (!resposta.ok) {
      throw new Error('Erro ao excluir cliente.')
    }

    mostrarMensagem('Cliente removido com sucesso.')
    await carregarClientes()
  } catch (erro) {
    mostrarMensagem('Erro ao remover cliente.', 'danger')
  }
}

formCliente.addEventListener('submit', salvarCliente)
btnCancelar.addEventListener('click', limparFormulario)
btnAtualizar.addEventListener('click', carregarClientes)

carregarClientes()

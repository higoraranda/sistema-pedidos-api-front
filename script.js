
const API_URL = 'https://sistema-pedidos-api-lmx8.onrender.com';

let pedidos = [];
let modoEdicao = false;
let pedidoEditandoId = null;
let pedidoExcluirId = null;

// elementos
const corpoTabela = document.getElementById('corpoTabela');
const semPedidos = document.getElementById('semPedidos');
const formulario = document.getElementById('formulario');
const overlay = document.getElementById('overlay');
const modalExclusao = document.getElementById('modalExclusao');

// Função para mostrar notificações
function mostrarNotificacao(mensagem, tipo = 'sucesso') {
  // Remove notificação anterior se existir
  const notificacaoAnterior = document.getElementById('notificacao-sistema');
  if (notificacaoAnterior) {
    notificacaoAnterior.remove();
  }
  
  const notificacao = document.createElement('div');
  notificacao.id = 'notificacao-sistema';
  notificacao.textContent = mensagem;
  notificacao.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: opacity 0.3s;
    opacity: 0;
  `;
  
  notificacao.style.backgroundColor = tipo === 'sucesso' ? '#4CAF50' : '#f44336';
  
  document.body.appendChild(notificacao);
  
  // Animação de entrada
  setTimeout(() => {
    notificacao.style.opacity = '1';
  }, 10);
  
  // Remover após 5 segundos
  setTimeout(() => {
    notificacao.style.opacity = '0';
    setTimeout(() => {
      if (notificacao.parentNode) {
        notificacao.parentNode.removeChild(notificacao);
      }
    }, 300);
  }, 5000);
}

// exibir / esconder formulário
function mostrarFormulario() {
  formulario.style.display = "flex";
  overlay.style.display = "block";
}

function esconderFormulario() {
  formulario.style.display = "none";
  overlay.style.display = "none";
  document.getElementById("formPedido").reset();
  modoEdicao = false;
  pedidoEditandoId = null;
}

// fechar modal ao clicar no overlay
overlay.addEventListener('click', function(e) {
  if (e.target === overlay) {
    esconderFormulario();
    fecharModal();
  }
});

// atualizar tabela com dados da API
async function atualizarTabela() {
  corpoTabela.innerHTML = '';
  try {
    const res = await fetch(`${API_URL}/pedidos`);
    if (!res.ok) {
      throw new Error(`Erro HTTP: ${res.status}`);
    }
    pedidos = await res.json();
  } catch (e) {
    console.error('Erro ao carregar pedidos', e);
    mostrarNotificacao('Erro ao carregar pedidos. Verifique a conexão.', 'erro');
    pedidos = [];
  }

  if (pedidos.length === 0) {
    semPedidos.style.display = 'block';
    return;
  }
  semPedidos.style.display = 'none';

  pedidos.forEach(pedido => {
    const tr = document.createElement('tr');
    tr.dataset.id = pedido._id || pedido.id;

    // Formatar data
    let dataFormatada = pedido.data;
    if (pedido.data && pedido.data.includes) {
      if (pedido.data.includes('-')) {
        const [yyyy, mm, dd] = pedido.data.split('-');
        dataFormatada = `${dd}/${mm}/${yyyy}`;
      } else if (pedido.data.includes('/')) {
        dataFormatada = pedido.data;
      }
    }

    tr.innerHTML = `
      <td>${pedido.cliente}</td>
      <td>R$ ${Number(pedido.valor).toFixed(2)}</td>
      <td>${dataFormatada}</td>
      <td>${pedido.empresa}</td>
      <td class="acoes">
        <button type="button" class="btn-tabela-editar">Editar</button>
        <button type="button" class="btn-tabela-apagar">Excluir</button>
      </td>
    `;

    tr.querySelector('.btn-tabela-editar').addEventListener('click', (e) => {
      e.stopPropagation();
      editarPedido(pedido._id || pedido.id);
    });
    tr.querySelector('.btn-tabela-apagar').addEventListener('click', (e) => {
      e.stopPropagation();
      excluirPedido(pedido._id || pedido.id);
    });

    corpoTabela.appendChild(tr);
  });
}

// salvar pedido
async function salvarPedido() {
  console.log('Botão salvar clicado'); // Debug 1
  
  const cliente = document.getElementById('cliente').value.trim();
  const valor = document.getElementById('valor').value;
  let data = document.getElementById('data').value;
  const empresa = document.getElementById('empresa').value;

  console.log('Valores do formulário:', { cliente, valor, data, empresa }); // Debug 2

  if (!cliente || !valor || !data || !empresa) {
    console.log('Campos faltando'); // Debug 3
    mostrarNotificacao('Por favor, preencha todos os campos.', 'erro');
    return;
  }

  // força formato YYYY-MM-DD
  if (data.includes('/')) {
    const [dd, mm, yyyy] = data.split('/');
    data = `${yyyy}-${mm}-${dd}`;
  }

  console.log('Dados para enviar:', { cliente, valor, data, empresa }); // Debug 4

  try {
    let url, method;
    
    if (modoEdicao) {
      url = `${API_URL}/pedidos/${pedidoEditandoId}`;
      method = 'PUT';
      console.log('Modo edição - URL:', url); // Debug 5
    } else {
      url = `${API_URL}/pedidos`;
      method = 'POST';
      console.log('Modo criar - URL:', url); // Debug 6
    }

    const response = await fetch(url, {
      method: method,
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        cliente, 
        valor: Number(valor), 
        data, 
        empresa 
      })
    });

    console.log('Resposta do servidor - Status:', response.status); // Debug 7
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro completo da resposta:', errorText); // Debug 8
      throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log('Resposta do servidor - Dados:', responseData); // Debug 9

    if (modoEdicao) {
      mostrarNotificacao('Pedido atualizado com sucesso!');
    } else {
      mostrarNotificacao('Pedido salvo com sucesso!');
    }
    
    await atualizarTabela();
    esconderFormulario();
  } catch (e) {
    console.error('Erro completo ao salvar pedido:', e); // Debug 10
    mostrarNotificacao(`Falha ao salvar: ${e.message}`, 'erro');
  }
}

// editar pedido
function editarPedido(id) {
  const pedido = pedidos.find(p => (p._id || p.id) === id);
  if (!pedido) return;

  modoEdicao = true;
  pedidoEditandoId = id;
  document.getElementById('cliente').value = pedido.cliente;
  document.getElementById('valor').value = pedido.valor;
  document.getElementById('data').value = pedido.data;
  document.getElementById('empresa').value = pedido.empresa;

  mostrarFormulario();
}

// excluir pedido
function excluirPedido(id) {
  pedidoExcluirId = id;
  modalExclusao.style.display = 'flex';
  overlay.style.display = 'block';
}

function fecharModal() {
  modalExclusao.style.display = 'none';
  overlay.style.display = 'none';
  pedidoExcluirId = null;
}

async function confirmarExclusao() {
  if (pedidoExcluirId == null) {
    fecharModal();
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/pedidos/${pedidoExcluirId}`, { 
      method: 'DELETE' 
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
    }
    
    await atualizarTabela();
    mostrarNotificacao('Pedido excluído com sucesso!');
  } catch (e) {
    console.error('Erro ao excluir', e);
    mostrarNotificacao(`Falha ao excluir: ${e.message}`, 'erro');
  } finally {
    fecharModal();
  }
}

// eventos
window.addEventListener('DOMContentLoaded', atualizarTabela);
document.getElementById('btnAdicionar').addEventListener('click', mostrarFormulario);
document.getElementById('btnCancelar').addEventListener('click', esconderFormulario);
document.getElementById('btnSalvar').addEventListener('click', salvarPedido);
document.getElementById('btnCancelarExclusao').addEventListener('click', fecharModal);
document.getElementById('btnConfirmarExclusao').addEventListener('click', confirmarExclusao);

// Verificar se a API está online
async function verificarConexao() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) {
      throw new Error('API offline');
    }
    console.log('Conectado à API com sucesso');
  } catch (e) {
    console.error('Erro ao conectar com a API:', e);
    mostrarNotificacao('Não foi possível conectar ao servidor. Verifique sua conexão.', 'erro');
  }
}

// Verificar conexão quando a página carregar
window.addEventListener('load', verificarConexao);
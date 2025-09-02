// Configuração automática da API URL
const API_URL = 'https://sistema-pedidos-api-lmx8.onrender.com'; // SUA URL DO RENDER

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

// Variável para controlar se já mostramos erro
let erroMostrado = false;

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

// Função para filtrar pedidos
function filtrarPedidos() {
  const filtroStatus = document.getElementById('filtroStatus').value;
  const filtroVendedor = document.getElementById('filtroVendedor').value;
  
  const pedidosFiltrados = pedidos.filter(pedido => {
    const statusMatch = !filtroStatus || pedido.status === filtroStatus;
    const vendedorMatch = !filtroVendedor || pedido.vendedor === filtroVendedor;
    return statusMatch && vendedorMatch;
  });
  
  renderizarPedidos(pedidosFiltrados);
}

// Função para renderizar pedidos (tabela + cards)
function renderizarPedidos(listaPedidos = pedidos) {
  renderizarTabela(listaPedidos);
  renderizarCards(listaPedidos);
  
  // Mostrar/ocultar mensagem de sem pedidos
  if (listaPedidos.length === 0) {
    semPedidos.style.display = 'block';
  } else {
    semPedidos.style.display = 'none';
  }
}

// Renderizar tabela para desktop
function renderizarTabela(listaPedidos) {
  corpoTabela.innerHTML = '';
  
  listaPedidos.forEach(pedido => {
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
      <td>${pedido.vendedor}</td>
      <td><span class="status-badge status-${pedido.status.toLowerCase()}">${pedido.status}</span></td>
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

// Renderizar cards para mobile
function renderizarCards(listaPedidos) {
  const cardsContainer = document.getElementById('pedidosCards');
  if (!cardsContainer) return;
  
  cardsContainer.innerHTML = '';
  
  if (listaPedidos.length === 0) {
    cardsContainer.innerHTML = '<p class="sem-pedidos">Nenhum pedido encontrado.</p>';
    return;
  }
  
  listaPedidos.forEach(pedido => {
    const card = document.createElement('div');
    card.className = `pedido-card ${pedido.status.toLowerCase()}`;
    
    const [yyyy, mm, dd] = pedido.data.split('-');
    const dataFormatada = `${dd}/${mm}/${yyyy}`;
    
    card.innerHTML = `
      <div class="pedido-info">
        <div><strong>Cliente:</strong> ${pedido.cliente}</div>
        <div><strong>Valor:</strong> R$ ${Number(pedido.valor).toFixed(2)}</div>
        <div><strong>Data:</strong> ${dataFormatada}</div>
        <div><strong>Empresa:</strong> ${pedido.empresa}</div>
        <div><strong>Vendedor:</strong> ${pedido.vendedor}</div>
        <div><strong>Status:</strong> <span class="status-badge status-${pedido.status.toLowerCase()}">${pedido.status}</span></div>
      </div>
      <div class="pedido-acoes">
        <button type="button" class="btn-tabela-editar" onclick="editarPedido('${pedido._id || pedido.id}')">Editar</button>
        <button type="button" class="btn-tabela-apagar" onclick="excluirPedido('${pedido._id || pedido.id}')">Excluir</button>
      </div>
    `;
    
    cardsContainer.appendChild(card);
  });
}

// atualizar tabela com dados da API
async function atualizarTabela() {
  try {
    const res = await fetch(`${API_URL}/pedidos`);
    if (!res.ok) {
      throw new Error(`Erro HTTP: ${res.status}`);
    }
    pedidos = await res.json();
    
    // Esconder mensagem de erro se existir
    const notificacaoErro = document.getElementById('notificacao-sistema');
    if (notificacaoErro && notificacaoErro.style.backgroundColor === 'rgb(244, 67, 54)') {
      notificacaoErro.remove();
    }
    erroMostrado = false;
    
    renderizarPedidos(pedidos);
    
  } catch (e) {
    console.error('Erro ao carregar pedidos', e);
    
    // Mostrar erro apenas uma vez
    if (!erroMostrado) {
      mostrarNotificacao('Erro ao carregar pedidos. Verifique a conexão.', 'erro');
      erroMostrado = true;
    }
    
    pedidos = [];
    renderizarPedidos(pedidos);
  }
}

// salvar pedido
async function salvarPedido() {
  const cliente = document.getElementById('cliente').value.trim();
  const valor = document.getElementById('valor').value;
  let data = document.getElementById('data').value;
  const empresa = document.getElementById('empresa').value;
  const vendedor = document.getElementById('vendedor').value;
  const status = document.getElementById('status').value;

  if (!cliente || !valor || !data || !empresa || !vendedor || !status) {
    mostrarNotificacao('Por favor, preencha todos os campos.', 'erro');
    return;
  }

  // força formato YYYY-MM-DD
  if (data.includes('/')) {
    const [dd, mm, yyyy] = data.split('/');
    data = `${yyyy}-${mm}-${dd}`;
  }

  try {
    if (modoEdicao) {
      const response = await fetch(`${API_URL}/pedidos/${pedidoEditandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente, valor: Number(valor), data, empresa, vendedor, status })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }
      
      mostrarNotificacao('Pedido atualizado com sucesso!');
    } else {
      const response = await fetch(`${API_URL}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente, valor: Number(valor), data, empresa, vendedor, status })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }
      
      mostrarNotificacao('Pedido salvo com sucesso!');
    }
    
    await atualizarTabela();
    esconderFormulario();
  } catch (e) {
    console.error('Erro ao salvar pedido', e);
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
  document.getElementById('vendedor').value = pedido.vendedor;
  document.getElementById('status').value = pedido.status;

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
    // Não mostrar notificação imediatamente - vamos tentar carregar os pedidos primeiro
  }
}

// eventos
document.getElementById('btnAdicionar').addEventListener('click', mostrarFormulario);
document.getElementById('btnCancelar').addEventListener('click', esconderFormulario);
document.getElementById('btnSalvar').addEventListener('click', salvarPedido);
document.getElementById('btnCancelarExclusao').addEventListener('click', fecharModal);
document.getElementById('btnConfirmarExclusao').addEventListener('click', confirmarExclusao);

// Carregar pedidos quando a página carregar
window.addEventListener('DOMContentLoaded', async () => {
  // Primeiro tenta carregar os pedidos
  await atualizarTabela();
  
  // Depois verifica a conexão (mas não mostra erro se já mostrou)
  if (!erroMostrado) {
    await verificarConexao();
  }
});

// Mostrar/Ocultar a seção de pedidos
document.addEventListener("DOMContentLoaded", () => {
  const btnVerPedidos = document.getElementById("btnVerPedidos");
  const sessaoPedidos = document.getElementById("sessaoPedidos");
  btnVerPedidos.addEventListener("click", () => {
    sessaoPedidos.style.display = sessaoPedidos.style.display === "none" ? "block" : "none";
    if (sessaoPedidos.style.display === "block") {
      atualizarTabela(); // Recarrega os pedidos quando expande a seção
    }
  });
});
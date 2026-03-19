// 1. Configuração Supabase
const supabaseUrl = 'https://mjfkrdrhalgawkkltcrm.supabase.co'; 
const supabaseKey = 'sb_publishable_g6v_qlWBAPuQ9818Ypxp6A_pYH6BBAb';
const clienteSupabase = supabase.createClient(supabaseUrl, supabaseKey);

const SENHA_CORRETA = "South@1234";
let editingId = null;

// ====== SISTEMA DE LOGIN ======
function verificarAcesso() {
    const senhaDigitada = document.getElementById('senhaAdmin').value;
    if (senhaDigitada === SENHA_CORRETA) {
        sessionStorage.setItem('adminLogado', 'true');
        liberarSite();
    } else {
        document.getElementById('erroSenha').style.display = 'block';
    }
}

function alternarSenha() {
    const senhaInput = document.getElementById('senhaAdmin');
    const toggleIcon = document.getElementById('togglePassword');
    if (senhaInput.type === 'password') {
        senhaInput.type = 'text'; senhaInput.style.letterSpacing = 'normal'; toggleIcon.innerText = '🙈';
    } else {
        senhaInput.type = 'password'; senhaInput.style.letterSpacing = '3px'; toggleIcon.innerText = '👁️';
    }
}

function liberarSite() {
    document.getElementById('loginOverlay').style.display = 'none';
    document.querySelector('.main-wrapper').style.display = 'block';
}

// ====== FUNÇÕES DE CADASTRO E EDIÇÃO ======
function limparFormulario() {
    document.getElementById('tituloProcesso').value = ""; 
    document.getElementById('descricaoProcesso').value = "";
    editingId = null; 
    document.getElementById('formTitle').innerText = "➕ Cadastrar Novo Processo";
    document.getElementById('saveUpdateBtn').innerText = "Salvar no Sistema";
    document.getElementById('cancelEditBtn').style.display = "none";
}

function cancelarEdicao() { limparFormulario(); }

function handleSaveUpdate() {
    editingId ? executarAtualizacao(editingId) : salvarPasso();
}

async function salvarPasso() {
    const empresa = document.getElementById('empresaCadastro').value;
    const titulo = document.getElementById('tituloProcesso').value;
    const descricao = document.getElementById('descricaoProcesso').value;
    
    if (!titulo) return alert("Por favor, digite o título!");
    
    const { error } = await clienteSupabase.from('Passo a Passo').insert([{ empresa, titulo, descricao }]);
    if (error) {
        alert("Erro ao salvar: " + error.message);
    } else { 
        limparFormulario(); 
        renderizarLista(); 
    }
}

async function executarAtualizacao(id) {
    const empresa = document.getElementById('empresaCadastro').value;
    const titulo = document.getElementById('tituloProcesso').value;
    const descricao = document.getElementById('descricaoProcesso').value;
    
    const { error } = await clienteSupabase.from('Passo a Passo').update({ empresa, titulo, descricao }).eq('id', id);
    if (!error) { 
        limparFormulario(); 
        renderizarLista(); 
    }
}

async function deletarPasso(id) {
    if (confirm("Tem certeza que deseja excluir este processo? Essa ação não tem volta.")) {
        await clienteSupabase.from('Passo a Passo').delete().eq('id', id);
        renderizarLista();
    }
}

// ====== RENDERIZAÇÃO E BOTÕES ======
async function renderizarLista() {
    const filtro = document.getElementById('filtroEmpresa').value;
    const busca = document.getElementById('buscaProcesso').value.toLowerCase();
    const container = document.getElementById('listaContainer');
    
    container.innerHTML = "<p style='text-align:center;'>Carregando processos...</p>";
    
    let query = clienteSupabase.from('Passo a Passo').select('*');
    if (filtro !== "todos") query = query.eq('empresa', filtro);
    if (busca) query = query.ilike('titulo', `%${busca}%`);
    
    const { data: passos } = await query.order('created_at', { ascending: false });
    
    container.innerHTML = passos.length ? "" : "<p style='text-align:center;'>Nenhum item encontrado.</p>";
    
    passos.forEach(item => {
        // Cores restauradas direto no código para não depender de falhas de CSS
        container.innerHTML += `
            <div class="passo-card" data-id="${item.id}" style="background: #fff; padding: 20px; border-radius: 12px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <span class="tag badge-${item.empresa.toLowerCase()}">${item.empresa}</span>
                <div style="font-size:1.2em; font-weight:bold; margin-top:10px; color:#1e3a8a;">${item.titulo}</div>
                
                <div style="display:flex; gap:10px; margin-top:15px; border-top:1px solid #e2e8f0; padding-top:15px;">
                    <button onclick="abrirModal('${item.id}')" style="flex:1; background:#004a99; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:bold;">👀 Ver</button>
                    <button onclick="editarPasso('${item.id}')" style="flex:1; background:#10b981; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:bold;">✏️ Editar</button>
                    <button onclick="deletarPasso('${item.id}')" style="flex:1; background:#ef4444; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:bold;">🗑️ Excluir</button>
                </div>
            </div>`;
    });
}

// ====== MODAL E VISUALIZAÇÃO ======
async function abrirModal(id) {
    const { data: p } = await clienteSupabase.from('Passo a Passo').select('*').eq('id', id).single();
    if (p) {
        document.getElementById('modalTag').className = `tag badge-${p.empresa.toLowerCase()}`;
        document.getElementById('modalTag').innerText = p.empresa;
        document.getElementById('modalTitulo').innerText = p.titulo;
        document.getElementById('modalDescricao').innerText = p.descricao || "Sem descrição.";
        document.getElementById('modalVisualizar').style.display = 'flex';
    }
}

function fecharModal() { document.getElementById('modalVisualizar').style.display = 'none'; }

function copiarConteudo() {
    const txt = `*${document.getElementById('modalTitulo').innerText}*\n\n${document.getElementById('modalDescricao').innerText}`;
    navigator.clipboard.writeText(txt).then(() => alert("Copiado com sucesso!"));
}

async function editarPasso(id) {
    const { data: passo } = await clienteSupabase.from('Passo a Passo').select('*').eq('id', id).single();
    if (passo) {
        editingId = id;
        document.getElementById('empresaCadastro').value = passo.empresa;
        document.getElementById('tituloProcesso').value = passo.titulo;
        document.getElementById('descricaoProcesso').value = passo.descricao;
        document.getElementById('formTitle').innerText = "✏️ Editar Processo";
        document.getElementById('saveUpdateBtn').innerText = "Atualizar";
        document.getElementById('cancelEditBtn').style.display = "block";
        window.scrollTo(0,0);
    }
}

// ====== INICIALIZAÇÃO ======
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('adminLogado') === 'true') liberarSite();
    renderizarLista();
});
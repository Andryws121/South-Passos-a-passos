// 1. Configuração Supabase
const supabaseUrl = 'https://mjfkrdrhalgawkkltcrm.supabase.co'; 
const supabaseKey = 'sb_publishable_g6v_qlWBAPuQ9818Ypxp6A_pYH6BBAb';
const clienteSupabase = supabase.createClient(supabaseUrl, supabaseKey);

const SENHA_CORRETA = "Admin@123";
let editingId = null;

// FUNÇÃO DE LOGIN CORRIGIDA
function verificarAcesso() {
    const senhaDigitada = document.getElementById('senhaAdmin').value;
    const erroMsg = document.getElementById('erroSenha');

    if (senhaDigitada === SENHA_CORRETA) {
        sessionStorage.setItem('adminLogado', 'true');
        liberarSite();
    } else {
        erroMsg.style.display = 'block';
        document.getElementById('senhaAdmin').value = ""; // Limpa a senha errada
    }
}

function liberarSite() {
    // Esconde o login e mostra o conteúdo
    const loginOverlay = document.getElementById('loginOverlay');
    const mainWrapper = document.querySelector('.main-wrapper');
    
    if (loginOverlay) loginOverlay.style.display = 'none';
    if (mainWrapper) mainWrapper.style.display = 'block';
}

// 2. Funções de Interface
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

// 3. Operações no Banco (Supabase)
async function salvarPasso() {
    const empresa = document.getElementById('empresaCadastro').value;
    const titulo = document.getElementById('tituloProcesso').value;
    const descricao = document.getElementById('descricaoProcesso').value;

    if (!titulo) return alert("Digite o título!");

    const { error } = await clienteSupabase
        .from('Passo a Passo') 
        .insert([{ empresa, titulo, descricao }]);

    if (error) alert("Erro: " + error.message);
    else { limparFormulario(); renderizarLista(); }
}

async function renderizarLista() {
    const filtro = document.getElementById('filtroEmpresa').value;
    const busca = document.getElementById('buscaProcesso').value.toLowerCase();
    const container = document.getElementById('listaContainer');
    
    container.innerHTML = "<p style='text-align:center;'>Carregando...</p>";

    let query = clienteSupabase.from('Passo a Passo').select('*');
    if (filtro !== "todos") query = query.eq('empresa', filtro);
    if (busca) query = query.ilike('titulo', `%${busca}%`);

    const { data: passos, error } = await query.order('created_at', { ascending: false });

    if (error) return container.innerHTML = "Erro ao carregar.";

    container.innerHTML = passos.length ? "" : "<p style='text-align:center;'>Nenhum item.</p>";

    passos.forEach(item => {
        const classeCor = `badge-${item.empresa.toLowerCase()}`;
        container.innerHTML += `
            <div class="passo-card" data-id="${item.id}">
                <span class="tag ${classeCor}">${item.empresa}</span>
                <div class="passo-titulo">${item.titulo}</div>
                <div class="card-actions">
                    <button class="btn-action btn-view">👀 Visualizar</button>
                    <button class="btn-action btn-edit">✏️ Editar</button>
                    <button class="btn-action btn-delete">🗑️ Excluir</button>
                </div>
            </div>`;
    });

    adicionarEventos();
}

// 4. Modal e Auxiliares
async function abrirModal(id) {
    const { data: passo } = await clienteSupabase.from('Passo a Passo').select('*').match({id}).single();
    if (passo) {
        document.getElementById('modalTag').className = `tag badge-${passo.empresa.toLowerCase()}`;
        document.getElementById('modalTag').innerText = passo.empresa;
        document.getElementById('modalTitulo').innerText = passo.titulo;
        document.getElementById('modalDescricao').innerText = passo.descricao || "Sem descrição.";
        document.getElementById('modalVisualizar').style.display = 'flex';
    }
}

function fecharModal() { document.getElementById('modalVisualizar').style.display = 'none'; }

function adicionarEventos() {
    document.querySelectorAll('.btn-view').forEach(b => b.onclick = () => abrirModal(b.closest('.passo-card').dataset.id));
    document.querySelectorAll('.btn-edit').forEach(b => b.onclick = () => editarPasso(b.closest('.passo-card').dataset.id));
    document.querySelectorAll('.btn-delete').forEach(b => b.onclick = () => deletarPasso(b.closest('.passo-card').dataset.id));
}

async function editarPasso(id) {
    const { data: passo } = await clienteSupabase.from('Passo a Passo').select('*').match({id}).single();
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

async function executarAtualizacao(id) {
    const { error } = await clienteSupabase.from('Passo a Passo').update({
        empresa: document.getElementById('empresaCadastro').value,
        titulo: document.getElementById('tituloProcesso').value,
        descricao: document.getElementById('descricaoProcesso').value
    }).match({id});
    if (!error) { limparFormulario(); renderizarLista(); }
}

async function deletarPasso(id) {
    if (confirm("Excluir?")) {
        await clienteSupabase.from('Passo a Passo').delete().match({id});
        renderizarLista();
    }
}

function copiarConteudo() {
    const txt = `*${document.getElementById('modalTitulo').innerText}*\n\n${document.getElementById('modalDescricao').innerText}`;
    navigator.clipboard.writeText(txt).then(() => alert("Copiado!"));
}

// INICIALIZAÇÃO E SEGURANÇA
document.addEventListener('DOMContentLoaded', () => {
    // Bloqueia a visualização inicial se não estiver logado
    if (sessionStorage.getItem('adminLogado') === 'true') {
        liberarSite();
    } else {
        document.querySelector('.main-wrapper').style.display = 'none';
    }

    // Atalho: apertar Enter para logar
    const campoSenha = document.getElementById('senhaAdmin');
    if (campoSenha) {
        campoSenha.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') verificarAcesso();
        });
    }

    renderizarLista();
});
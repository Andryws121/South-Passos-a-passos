// ====== CONFIGURAÇÃO SUPABASE ======
const supabaseUrl = 'https://mjfkrdrhalgawkkltcrm.supabase.co'; 
const supabaseKey = 'sb_publishable_g6v_qlWBAPuQ9818Ypxp6A_pYH6BBAb';
const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);
const SENHA_EMBARALHADA = "U291dGhAMTIzNA=="; 
let editingId = null;

// ====== SELETORES DO DOM ======
const DOMElements = {
    loginOverlay: document.getElementById('loginOverlay'),
    mainWrapper: document.querySelector('.main-wrapper'),
    senhaAdmin: document.getElementById('senhaAdmin'),
    erroSenha: document.getElementById('erroSenha'),
    togglePassword: document.getElementById('togglePassword'),
    formTitle: document.getElementById('formTitle'),
    saveUpdateBtn: document.getElementById('saveUpdateBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    tituloProcesso: document.getElementById('tituloProcesso'),
    empresaCadastro: document.getElementById('empresaCadastro'),
    filtroEmpresa: document.getElementById('filtroEmpresa'),
    listaContainer: document.getElementById('listaContainer'),
    buscaProcesso: document.getElementById('buscaProcesso'),
    modal: document.getElementById('modalVisualizar'),
    modalTag: document.getElementById('modalTag'),
    modalTitulo: document.getElementById('modalTitulo'),
    modalDescricao: document.getElementById('modalDescricao'),
};

// ====== INICIALIZAÇÃO DO EDITOR VISUAL (Quill) ======
const quill = new Quill('#editor-container', {
    theme: 'snow',
    placeholder: 'Escreva o passo a passo aqui... (Dica: Você pode colar prints com Ctrl+V)',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline'],              
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],   
            ['image'], 
            ['clean']                                     
        ]
    }
});

// ====== SISTEMA DE LOGIN ======
function verificarAcesso() {
    const senhaDigitada = DOMElements.senhaAdmin.value;
    if (btoa(senhaDigitada) === SENHA_EMBARALHADA) {
        sessionStorage.setItem('adminLogado', 'true');
        liberarSite();
    } else {
        DOMElements.erroSenha.classList.remove('hidden');
    }
}

function alternarSenha() {
    const senhaInput = DOMElements.senhaAdmin;
    const toggleIcon = DOMElements.togglePassword;
    if (senhaInput.type === 'password') {
        senhaInput.type = 'text'; 
        senhaInput.style.letterSpacing = 'normal';
        toggleIcon.innerText = 'Ocultar';
    } else {
        senhaInput.type = 'password'; 
        senhaInput.style.letterSpacing = '3px';
        toggleIcon.innerText = 'Mostrar';
    }
}

function liberarSite() {
    DOMElements.loginOverlay.classList.add('hidden');
    DOMElements.mainWrapper.classList.remove('hidden');
    DOMElements.erroSenha.classList.add('hidden');
}

function sairDoSistema() {
    sessionStorage.removeItem('adminLogado');
    DOMElements.senhaAdmin.value = "";
    DOMElements.erroSenha.classList.add('hidden');
    DOMElements.mainWrapper.classList.add('hidden');
    DOMElements.loginOverlay.classList.remove('hidden');
}

// ====== FUNÇÕES DE CADASTRO E EDIÇÃO ======
function limparFormulario() {
    DOMElements.tituloProcesso.value = ""; 
    quill.root.innerHTML = ""; 
    editingId = null; 
    DOMElements.formTitle.innerText = "Cadastrar Novo Processo";
    DOMElements.saveUpdateBtn.innerText = "Salvar no Sistema";
    DOMElements.cancelEditBtn.classList.add('hidden');
}

function cancelarEdicao() { limparFormulario(); }

function handleSaveUpdate() {
    editingId ? executarAtualizacao(editingId) : salvarPasso();
}

async function salvarPasso() {
    const empresa = DOMElements.empresaCadastro.value;
    const titulo = DOMElements.tituloProcesso.value;
    const descricao = quill.root.innerHTML; 
    
    if (!titulo || quill.getText().trim().length === 0) {
        return alert("Por favor, preencha o título e a descrição!");
    }
    
    const { error } = await clienteSupabase.from('Passo a Passo').insert([{ empresa, titulo, descricao }]);
    if (error) {
        alert("Erro ao salvar: " + error.message);
    } else { 
        limparFormulario(); 
        DOMElements.filtroEmpresa.value = empresa;
        renderizarLista(); 
    }
}

async function executarAtualizacao(id) {
    const empresa = DOMElements.empresaCadastro.value;
    const titulo = DOMElements.tituloProcesso.value;
    const descricao = quill.root.innerHTML; 
    
    const { error } = await clienteSupabase.from('Passo a Passo').update({ empresa, titulo, descricao }).eq('id', id);
    if (!error) { 
        limparFormulario(); 
        DOMElements.filtroEmpresa.value = empresa;
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
function calcularTempoDecorrido(dataISO) {
    if (!dataISO) return "";
    const dataCriacao = new Date(dataISO);
    const agora = new Date();
    const difSegundos = Math.floor((agora - dataCriacao) / 1000);

    if (difSegundos < 60) return "Agora mesmo";
    const difMinutos = Math.floor(difSegundos / 60);
    if (difMinutos < 60) return `Há ${difMinutos} min`;
    const difHoras = Math.floor(difMinutos / 60);
    if (difHoras < 24) return `Há ${difHoras} hora${difHoras > 1 ? 's' : ''}`;
    const difDias = Math.floor(difHoras / 24);
    if (difDias < 30) return `Há ${difDias} dia${difDias > 1 ? 's' : ''}`;
    const difMeses = Math.floor(difDias / 30);
    return `Há ${difMeses} mês${difMeses > 1 ? 'es' : ''}`;
}

async function renderizarLista() {
    const filtro = DOMElements.filtroEmpresa.value;
    const busca = DOMElements.buscaProcesso.value.toLowerCase();
    const container = DOMElements.listaContainer;
    
    if (filtro === "todos") {
        container.innerHTML = `<div class="placeholder-card"><p>Selecione uma empresa acima para carregar a lista.</p></div>`;
        return; 
    }

    container.innerHTML = `<p class="loading-message">A carregar processos...</p>`;
    
    let query = clienteSupabase.from('Passo a Passo').select('*').eq('empresa', filtro);
    if (busca) query = query.ilike('titulo', `%${busca}%`);
    
    const { data: passos, error } = await query.order('created_at', { ascending: false });
    
    if (error || !passos || passos.length === 0) {
        container.innerHTML = `<p class="empty-message">Nenhum processo encontrado para esta empresa.</p>`;
        return;
    }

    const cardsHtml = passos.map(item => {
        const tempoAtras = calcularTempoDecorrido(item.created_at);
        return `
            <div class="passo-card" data-id="${item.id}">
                <div class="passo-card-header">
                    <span class="tag badge-${item.empresa.toLowerCase()}">${item.empresa}</span>
                    <span class="passo-card-time">${tempoAtras}</span>
                </div>
                <div class="passo-card-title">${item.titulo}</div>
                <div class="passo-card-actions">
                    <button onclick="abrirModal('${item.id}')" class="btn-view">Visualizar</button>
                    <button onclick="editarPasso('${item.id}')" class="btn-edit">Editar</button>
                    <button onclick="deletarPasso('${item.id}')" class="btn-delete">Excluir</button>
                </div>
            </div>`;
    }).join('');

    container.innerHTML = cardsHtml;
}

// ====== MODAL E VISUALIZAÇÃO ======
async function abrirModal(id) {
    const { data: p } = await clienteSupabase.from('Passo a Passo').select('*').eq('id', id).single();
    if (p) {
        DOMElements.modalTag.className = `tag badge-${p.empresa.toLowerCase()}`;
        DOMElements.modalTag.innerText = p.empresa;
        DOMElements.modalTitulo.innerText = p.titulo;
        
        DOMElements.modalDescricao.innerHTML = p.descricao || "Sem descrição.";
        
        DOMElements.modal.classList.remove('hidden'); 
    }
}

function fecharModal() { DOMElements.modal.classList.add('hidden'); }

function copiarConteudo() {
    const titulo = DOMElements.modalTitulo.innerText;
    const descricaoLimpa = DOMElements.modalDescricao.innerText;
    const txt = `*${titulo}*\n\n${descricaoLimpa}`;
    
    navigator.clipboard.writeText(txt).then(() => alert("Copiado com sucesso!"));
}

async function editarPasso(id) {
    const { data: passo } = await clienteSupabase.from('Passo a Passo').select('*').eq('id', id).single();
    if (passo) {
        editingId = id;
        DOMElements.empresaCadastro.value = passo.empresa;
        DOMElements.tituloProcesso.value = passo.titulo;
        
        quill.root.innerHTML = passo.descricao;
        
        DOMElements.formTitle.innerText = "Editar Processo";
        DOMElements.saveUpdateBtn.innerText = "Atualizar";
        DOMElements.cancelEditBtn.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ====== INICIALIZAÇÃO ======
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('adminLogado') === 'true') {
        liberarSite();
    }
    renderizarLista();
});
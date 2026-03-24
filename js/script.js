// 1. Configuração Supabase
const supabaseUrl = 'https://mjfkrdrhalgawkkltcrm.supabase.co'; 
const supabaseKey = 'sb_publishable_g6v_qlWBAPuQ9818Ypxp6A_pYH6BBAb';
const clienteSupabase = supabase.createClient(supabaseUrl, supabaseKey);

// A senha "South@1234" embaralhada em Base64 para não aparecer no Inspecionar
const SENHA_EMBARALHADA = "U291dGhAMTIzNA=="; 
let editingId = null;

// ====== SISTEMA DE LOGIN E SAÍDA ======
function verificarAcesso() {
    const senhaDigitada = document.getElementById('senhaAdmin').value;
    
    // O btoa() pega o que a pessoa digitou e embaralha na mesma lógica para comparar
    if (btoa(senhaDigitada) === SENHA_EMBARALHADA) {
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
    document.getElementById('loginOverlay').style.display = 'none';
    document.querySelector('.main-wrapper').style.display = 'block';
    document.getElementById('erroSenha').style.display = 'none';
}

function sairDoSistema() {
    sessionStorage.removeItem('adminLogado');
    const campoSenha = document.getElementById('senhaAdmin');
    if(campoSenha) campoSenha.value = "";
    document.getElementById('erroSenha').style.display = 'none';
    document.querySelector('.main-wrapper').style.display = 'none';
    document.getElementById('loginOverlay').style.display = 'flex';
}

// ====== FUNÇÕES DE CADASTRO E EDIÇÃO ======
function limparFormulario() {
    document.getElementById('tituloProcesso').value = ""; 
    document.getElementById('descricaoProcesso').value = "";
    editingId = null; 
    document.getElementById('formTitle').innerText = "Cadastrar Novo Processo";
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
        // Troca o filtro automaticamente para a empresa do item que acabou de ser salvo
        document.getElementById('filtroEmpresa').value = empresa;
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
        document.getElementById('filtroEmpresa').value = empresa;
        renderizarLista(); 
    }
}

async function deletarPasso(id) {
    if (confirm("Tem certeza que deseja excluir este processo? Essa ação não tem volta.")) {
        await clienteSupabase.from('Passo a Passo').delete().eq('id', id);
        renderizarLista();
    }
}

// ====== FUNÇÃO PARA CALCULAR O TEMPO ======
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

// ====== RENDERIZAÇÃO E BOTÕES ======
async function renderizarLista() {
    const filtro = document.getElementById('filtroEmpresa').value;
    const busca = document.getElementById('buscaProcesso').value.toLowerCase();
    const container = document.getElementById('listaContainer');
    
    // REGRA 1: Se o filtro for "todos" (Nenhuma selecionada), esconde a lista
    if (filtro === "todos") {
        container.innerHTML = `
            <div style="text-align:center; padding: 40px 20px; background: transparent; border: 2px dashed #cbd5e1; border-radius: 12px; margin-top: 10px;">
                <p style="color: #64748b; font-size: 15px; font-weight: bold; margin: 0;">Selecione uma empresa acima para carregar a lista.</p>
            </div>`;
        return; // Para a função aqui e não faz a pesquisa no banco
    }

    container.innerHTML = "<p style='text-align:center; color: #666;'>Carregando processos...</p>";
    
    let query = clienteSupabase.from('Passo a Passo').select('*');
    // Força a busca apenas pela empresa selecionada
    query = query.eq('empresa', filtro);
    
    if (busca) query = query.ilike('titulo', `%${busca}%`);
    
    const { data: passos } = await query.order('created_at', { ascending: false });
    
    container.innerHTML = passos.length ? "" : "<p style='text-align:center; color: #666; margin-top: 20px;'>Nenhum processo encontrado para esta empresa.</p>";
    
    passos.forEach(item => {
        // Puxa o tempo formatado (ex: "Há 2 horas")
        const tempoAtras = calcularTempoDecorrido(item.created_at);

        container.innerHTML += `
            <div class="passo-card" data-id="${item.id}" style="background: #fff; padding: 20px; border-radius: 12px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="tag badge-${item.empresa.toLowerCase()}">${item.empresa}</span>
                    <span style="font-size: 12px; color: #ef4444; font-weight: bold;">${tempoAtras}</span>
                </div>

                <div style="font-size:1.2em; font-weight:bold; margin-top:10px; color:#1e3a8a;">${item.titulo}</div>
                
                <div style="display:flex; gap:10px; margin-top:15px; border-top:1px solid #e2e8f0; padding-top:15px;">
                    <button onclick="abrirModal('${item.id}')" style="flex:1; background:#004a99; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:bold;">Visualizar</button>
                    <button onclick="editarPasso('${item.id}')" style="flex:1; background:#10b981; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:bold;">Editar</button>
                    <button onclick="deletarPasso('${item.id}')" style="flex:1; background:#ef4444; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:bold;">Excluir</button>
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
        document.getElementById('formTitle').innerText = "Editar Processo";
        document.getElementById('saveUpdateBtn').innerText = "Atualizar";
        document.getElementById('cancelEditBtn').style.display = "block";
        window.scrollTo(0,0);
    }
}

// ====== INICIALIZAÇÃO ======
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('adminLogado') === 'true') {
        liberarSite();
    } else {
        document.querySelector('.main-wrapper').style.display = 'none';
    }
    renderizarLista();
});
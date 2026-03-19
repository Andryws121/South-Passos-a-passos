const supabaseUrl = 'https://mjfkrdrhalgawkkltcrm.supabase.co'; 
const supabaseKey = 'sb_publishable_g6v_qlWBAPuQ9818Ypxp6A_pYH6BBAb';
const clienteSupabase = supabase.createClient(supabaseUrl, supabaseKey);

const SENHA_CORRETA = "South@1234";
let editingId = null;

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

async function salvarPasso() {
    const empresa = document.getElementById('empresaCadastro').value;
    const titulo = document.getElementById('tituloProcesso').value;
    const descricao = document.getElementById('descricaoProcesso').value;
    if (!titulo) return alert("Digite o título!");
    const { error } = await clienteSupabase.from('Passo a Passo').insert([{ empresa, titulo, descricao }]);
    if (!error) { limparFormulario(); renderizarLista(); }
}

async function renderizarLista() {
    const filtro = document.getElementById('filtroEmpresa').value;
    const busca = document.getElementById('buscaProcesso').value.toLowerCase();
    const container = document.getElementById('listaContainer');
    let query = clienteSupabase.from('Passo a Passo').select('*');
    if (filtro !== "todos") query = query.eq('empresa', filtro);
    if (busca) query = query.ilike('titulo', `%${busca}%`);
    const { data: passos } = await query.order('created_at', { ascending: false });
    container.innerHTML = "";
    passos.forEach(item => {
        container.innerHTML += `
            <div class="passo-card" data-id="${item.id}">
                <span class="tag badge-${item.empresa.toLowerCase()}">${item.empresa}</span>
                <div style="font-size:1.3em; font-weight:bold; margin-top:10px;">${item.titulo}</div>
                <div style="display:flex; gap:10px; margin-top:15px; border-top:1px solid #eee; padding-top:15px;">
                    <button onclick="abrirModal('${item.id}')" style="background:#f1f5f9; color:#334155;">👀 Ver</button>
                    <button onclick="editarPasso('${item.id}')" style="background:#22c55e;">✏️ Editar</button>
                    <button onclick="deletarPasso('${item.id}')" style="background:#ef4444;">🗑️ Excluir</button>
                </div>
            </div>`;
    });
}

async function abrirModal(id) {
    const { data: p } = await clienteSupabase.from('Passo a Passo').select('*').eq('id', id).single();
    document.getElementById('modalTag').className = `tag badge-${p.empresa.toLowerCase()}`;
    document.getElementById('modalTag').innerText = p.empresa;
    document.getElementById('modalTitulo').innerText = p.titulo;
    document.getElementById('modalDescricao').innerText = p.descricao;
    document.getElementById('modalVisualizar').style.display = 'flex';
}

function fecharModal() { document.getElementById('modalVisualizar').style.display = 'none'; }
function limparFormulario() {
    document.getElementById('tituloProcesso').value = ""; document.getElementById('descricaoProcesso').value = "";
    editingId = null; document.getElementById('formTitle').innerText = "➕ Cadastrar Novo Processo";
}

document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('adminLogado') === 'true') liberarSite();
    renderizarLista();
});
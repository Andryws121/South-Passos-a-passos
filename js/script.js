// 1. Configurando a Conexão com o Banco de Dados Supabase
const supabaseUrl = 'https://mjfkrdrhalgawkkltcrm.supabase.co'; 
const supabaseKey = 'sb_publishable_g6v_qlWBAPuQ9818Ypxp6A_pYH6BBAb';

// Iniciando o cliente do Supabase
const clienteSupabase = supabase.createClient(supabaseUrl, supabaseKey);

// Variável para controlar se estamos editando um item
let editingId = null;

// 2. Limpa o formulário e reseta o estado
function limparFormulario() {
    document.getElementById('tituloProcesso').value = ""; 
    document.getElementById('descricaoProcesso').value = "";
    
    // Reseta o botão para modo de cadastro
    editingId = null;
    document.getElementById('formTitle').innerText = "➕ Cadastrar Novo Processo";
    document.getElementById('saveUpdateBtn').innerText = "Salvar no Sistema";
    document.getElementById('cancelEditBtn').style.display = "none";
}

// 3. Cancela a edição atual
function cancelarEdicao() {
    limparFormulario();
}

// 4. Função que gerencia se vamos Salvar ou Atualizar
function handleSaveUpdate() {
    if (editingId) {
        executarAtualizacao(editingId);
    } else {
        salvarPasso();
    }
}

// 5. Salva um Novo Passo
async function salvarPasso() {
    const empresa = document.getElementById('empresaCadastro').value;
    const titulo = document.getElementById('tituloProcesso').value;
    const descricao = document.getElementById('descricaoProcesso').value;

    if (!titulo) {
        alert("Por favor, digite o título do passo a passo!");
        return;
    }

    const btnSalvar = document.getElementById('saveUpdateBtn');
    btnSalvar.innerText = "Salvando...";

    const { data, error } = await clienteSupabase
        .from('Passo a Passo') 
        .insert([{ empresa: empresa, titulo: titulo, descricao: descricao }]);

    if (error) {
        alert("Erro ao salvar no banco de dados: " + error.message);
        console.error("Erro completo:", error);
    } else {
        limparFormulario(); 
        renderizarLista(); 
    }
    
    btnSalvar.innerText = "Salvar no Sistema";
}

// 6. Prepara o formulário para edição
async function editarPasso(id) {
    const btnSalvar = document.getElementById('saveUpdateBtn');
    
    // Altera o título e botões
    document.getElementById('formTitle').innerText = "✏️ Editar Processo";
    btnSalvar.innerText = "Atualizar Processo";
    document.getElementById('cancelEditBtn').style.display = "block";
    
    // Define o ID que está sendo editado
    editingId = id;

    const { data: passo, error } = await clienteSupabase
        .from('Passo a Passo')
        .select('*')
        .match({ id: id })
        .single();

    if (passo) {
        document.getElementById('empresaCadastro').value = passo.empresa;
        document.getElementById('tituloProcesso').value = passo.titulo;
        document.getElementById('descricaoProcesso').value = passo.descricao;
        window.scrollTo(0, 0);
    } else {
        console.error("Não foi possível carregar o item para edição.");
    }
}

// 7. Executa a atualização do item no banco
async function executarAtualizacao(id) {
    const empresa = document.getElementById('empresaCadastro').value;
    const titulo = document.getElementById('tituloProcesso').value;
    const descricao = document.getElementById('descricaoProcesso').value;

    const btnAtualizar = document.getElementById('saveUpdateBtn');
    btnAtualizar.innerText = "Atualizando...";

    const { data, error } = await clienteSupabase
        .from('Passo a Passo')
        .update({ empresa: empresa, titulo: titulo, descricao: descricao })
        .match({ id: id });

    if (error) {
        alert("Erro ao atualizar no banco de dados: " + error.message);
        console.error(error);
    } else {
        limparFormulario();
        renderizarLista();
    }
    
    btnAtualizar.innerText = "Salvar no Sistema";
}

// 8. Exclui um passo a passo do banco
async function deletarPasso(id) {
    if (!confirm("Tem certeza que deseja excluir este passo a passo?")) {
        return;
    }

    const { data, error } = await clienteSupabase
        .from('Passo a Passo')
        .delete()
        .match({ id: id });

    if (error) {
        alert("Erro ao excluir do banco de dados: " + error.message);
        console.error(error);
    } else {
        renderizarLista(); 
    }
}

// 9. Função para Buscar e Mostrar na Tela
async function renderizarLista() {
    const filtroEmpresa = document.getElementById('filtroEmpresa').value;
    const termoBusca = document.getElementById('buscaProcesso').value.toLowerCase();
    const container = document.getElementById('listaContainer');
    
    container.innerHTML = "<p style='text-align: center; color: #666;'>Carregando dados do servidor...</p>";

    let query = clienteSupabase.from('Passo a Passo').select('*');

    if (filtroEmpresa !== "todos") { query = query.eq('empresa', filtroEmpresa); }
    if (termoBusca) { query = query.ilike('titulo', `%${termoBusca}%`); }

    const { data: passos, error } = await query.order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = "<p style='text-align: center; color:red;'>Erro ao carregar os dados. Verifique a conexão.</p>";
        return;
    }

    container.innerHTML = ""; 

    if (passos.length === 0) {
        container.innerHTML = "<p style='text-align: center; color: #666;'>Nenhum passo a passo encontrado.</p>";
        return;
    }

    passos.forEach(item => {
        // 👇 ADICIONADO AQUI: Lógica de cor dinâmica para a etiqueta (Turn 47) 👇
        const classeCor = `badge-${item.empresa.toLowerCase()}`;

        container.innerHTML += `
            <div class="passo-card" data-id="${item.id}">
                <span class="tag ${classeCor}">${item.empresa}</span>
                <div class="passo-titulo" style="font-weight: bold; margin-top: 8px; font-size: 1.2em; color: #004a99;">${item.titulo}</div>
                
                <div class="card-actions">
                    <button class="btn-action btn-view">👀 Visualizar</button>
                    <button class="btn-action btn-edit">✏️ Editar</button>
                    <button class="btn-action btn-delete">🗑️ Excluir</button>
                </div>
            </div>
        `;
    });

    // Eventos dos botões
    container.querySelectorAll('.btn-view').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.closest('.passo-card').dataset.id;
            abrirModal(id);
        });
    });

    container.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.closest('.passo-card').dataset.id;
            editarPasso(id);
        });
    });

    container.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.closest('.passo-card').dataset.id;
            deletarPasso(id);
        });
    });
}

// 10. Abre o Pop-up e puxa os dados do Supabase
async function abrirModal(id) {
    const { data: passo, error } = await clienteSupabase
        .from('Passo a Passo')
        .select('*')
        .match({ id: id })
        .single();

    if (passo) {
        // Define a cor do badge no modal também
        const classeCor = `badge-${passo.empresa.toLowerCase()}`;
        document.getElementById('modalTag').className = `tag ${classeCor}`;
        
        document.getElementById('modalTag').innerText = passo.empresa;
        document.getElementById('modalTitulo').innerText = passo.titulo;
        document.getElementById('modalDescricao').innerText = passo.descricao || "Nenhuma descrição informada para este processo.";
        
        document.getElementById('modalVisualizar').style.display = 'flex';
    }
}

// 11. Fecha o Pop-up
function fecharModal() {
    document.getElementById('modalVisualizar').style.display = 'none';
}

// Fecha o modal se clicar fora da caixa branca
window.onclick = function(event) {
    const modal = document.getElementById('modalVisualizar');
    if (event.target == modal) {
        fecharModal();
    }
}

// 12. Função para Copiar para a Área de Transferência
function copiarConteudo() {
    const titulo = document.getElementById('modalTitulo').innerText;
    const descricao = document.getElementById('modalDescricao').innerText;
    
    const textoParaCopiar = `*${titulo}*\n\n${descricao}`; 

    navigator.clipboard.writeText(textoParaCopiar).then(() => {
        const btn = document.querySelector('.btn-copiar');
        const textoOriginal = btn.innerHTML;
        
        btn.innerHTML = "✅ Copiado!";
        btn.style.backgroundColor = "#28a745"; 
        
        setTimeout(() => {
            btn.innerHTML = textoOriginal;
            btn.style.backgroundColor = "#17a2b8"; 
        }, 2000);
    }).catch(err => {
        alert("Ops! Não foi possível copiar o texto.");
    });
}

// INICIA A LISTA AO ABRIR O SITE
renderizarLista();
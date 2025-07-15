// =================== PRISMIC ===================
import * as prismic from 'https://cdn.skypack.dev/@prismicio/client';

// =================== CONFIG ===================
const repositoryName = 'biblioteca-04';
const client = prismic.createClient(repositoryName);

// =================== CLASSE LIVRO ===================
class Livro {
  constructor({ id, titulo, autor, categoria, paginas, ano, idioma, disponivel, descricao, capa, gradiente }) {
    this.id = id;
    this.titulo = titulo;
    this.autor = autor;
    this.categoria = categoria;
    this.paginas = paginas;
    this.ano = ano;
    this.idioma = idioma;
    this.disponivel = disponivel;
    this.descricao = descricao;
    this.capa = capa;
    this.gradiente = gradiente || 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)';
  }

  combinaComBusca(termo) {
    const termoMin = termo.toLowerCase();
    return (
      this.titulo.toLowerCase().includes(termoMin) ||
      this.autor.toLowerCase().includes(termoMin) ||
      this.categoria.toLowerCase().includes(termoMin)
    );
  }
}

// =================== VARIÁVEIS ===================
let livros = [];
let livrosFiltrados = [];
let categoriaAtual = 'todos';

// =================== ELEMENTOS DO DOM ===================
const gridLivros = document.getElementById('booksGrid');
const inputBusca = document.getElementById('searchInput');
const botoesFiltro = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('modalOverlay');
const fecharModal = document.getElementById('modalClose');
const botaoReservar = document.getElementById('reserveBtn');
const botaoFavoritar = document.getElementById('favoriteBtn');

// =================== FUNÇÃO INIT ===================

let currentPage = 1;
const pageSize = 10;

async function fetchLivros(page = 1) {
  const response = await client.getByType('livro', {
    page: page,
    pageSize: pageSize,
  });

  return response;
}

async function init() {
  const responseHome = await client.getSingle('home');

  const home = {
    title: prismic.asHTML(responseHome.data.titulo),
    paragrafo: prismic.asHTML(responseHome.data.paragrafo)
  };

  document.querySelector(".hero-content").innerHTML += home.title;
  document.querySelector(".hero-content").innerHTML += home.paragrafo;

  await carregarPagina(currentPage);
}

async function carregarPagina(page) {
  const response = await fetchLivros(page);

  livros = response.results.map(({ data: livro, uid }) => new Livro({
    id: uid,
    titulo: prismic.asText(livro.titulo),
    autor: livro.autor,
    categoria: livro.categoria,
    paginas: livro.paginas,
    ano: livro.ano,
    idioma: livro.idioma,
    disponivel: livro.disponivel,
    descricao: prismic.asText(livro.descricao),
    capa: livro.imagem.url,
    gradiente: livro.gradiente
  }));

  livrosFiltrados = [...livros];

  renderizarLivros();

    const categoriasUnicas = [
    ...new Set(livros.map(l => l.categoria).filter(Boolean))
  ].sort();

  gerarBotoesFiltro(categoriasUnicas);
}

// =================== RENDERIZAÇÃO ===================
function renderizarLivros(lista = livrosFiltrados) {
  gridLivros.innerHTML = '';

  lista.forEach(livro => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.onclick = () => abrirModal(livro);

    card.innerHTML = `
      <div class="book-cover" style="background: ${livro.gradiente}">
        <img src="${livro.capa}" alt="${livro.titulo}">
      </div>
      <div class="book-content">
        <span class="book-category">${livro.categoria}</span>
        <h3 class="book-title">${livro.titulo}</h3>
        <p class="book-author">por ${livro.autor}</p>
        <div class="book-footer">
          <div class="book-status">
            <div class="status-dot ${livro.disponivel ? '' : 'unavailable'}"></div>
            <span>${livro.disponivel ? 'Disponível' : 'Emprestado'}</span>
          </div>
          <span class="book-pages">${livro.paginas} páginas</span>
        </div>
      </div>
    `;

    gridLivros.appendChild(card);
  });
}

function gerarBotoesFiltro(categorias) {
  const containerFiltros = document.querySelector('.filters');
  containerFiltros.innerHTML = `
    <button class="filter-btn active" data-category="todos">Todos</button>
  `;

  categorias.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.category = cat;
    btn.textContent = cat;
    containerFiltros.appendChild(btn);
  });

  const botoesFiltro = document.querySelectorAll('.filter-btn');
  botoesFiltro.forEach(botao => {
    botao.addEventListener('click', () => {
      botoesFiltro.forEach(btn => btn.classList.remove('active'));
      botao.classList.add('active');
      filtrarPorCategoria(botao.dataset.category);
    });
  });
}


// =================== FILTRO ===================
function filtrarPorCategoria(categoria) {
  categoriaAtual = categoria;
  const base = categoria === 'todos' ? livros : livros.filter(l => l.categoria === categoria);

  const termoBusca = inputBusca.value.trim().toLowerCase();
  livrosFiltrados = termoBusca
    ? base.filter(l => l.combinaComBusca(termoBusca))
    : base;

  renderizarLivros();
}

// =================== BUSCA ===================
function buscarLivros() {
  const termoBusca = inputBusca.value.trim().toLowerCase();
  const base = categoriaAtual === 'todos' ? livros : livros.filter(l => l.categoria === categoriaAtual);

  livrosFiltrados = termoBusca
    ? base.filter(l => l.combinaComBusca(termoBusca))
    : base;

  renderizarLivros();
}

// =================== MODAL ===================
function abrirModal(livro) {
  document.getElementById('modalTitle').textContent = livro.titulo;
  document.getElementById('modalAuthor').textContent = `por ${livro.autor}`;
  document.getElementById('modalCategory').textContent = livro.categoria;
  document.getElementById('modalDescription').textContent = livro.descricao;
  document.getElementById('modalPages').textContent = livro.paginas;
  document.getElementById('modalYear').textContent = livro.ano;
  document.getElementById('modalLanguage').textContent = livro.idioma;
  document.getElementById('modalStatus').textContent = livro.disponivel ? 'Disponível' : 'Emprestado';
  document.getElementById('modalCover').style.background = livro.gradiente;
  document.getElementById('modalCover').innerHTML = `<img src="${livro.capa}" alt="${livro.titulo}">`;

  botaoReservar.textContent = livro.disponivel ? 'Reservar Livro' : 'Indisponível';
  botaoReservar.disabled = !livro.disponivel;
  botaoReservar.className = livro.disponivel ? 'btn btn-primary' : 'btn btn-secondary';

  botaoReservar.onclick = () => {
    alert('Livro reservado com sucesso!');
    fecharModalFunc();
  };

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function fecharModalFunc() {
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// =================== EVENTOS ===================
inputBusca.addEventListener('input', buscarLivros);

botoesFiltro.forEach(botao => {
  botao.addEventListener('click', () => {
    botoesFiltro.forEach(btn => btn.classList.remove('active'));
    botao.classList.add('active');
    filtrarPorCategoria(botao.dataset.category);
  });
});

fecharModal.addEventListener('click', fecharModalFunc);
modal.addEventListener('click', e => { if (e.target === modal) fecharModalFunc(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModalFunc(); });

botaoFavoritar.addEventListener('click', () => {
  alert('Livro adicionado aos favoritos!');
});

const grid = document.querySelector("#booksGrid");
const btnLista = document.getElementById("btnLista");
const btnGrade = document.getElementById("btnGrade");

btnLista.addEventListener("click", () => {
  grid.classList.add("inline-book");
  btnLista.classList.add("active");
  btnGrade.classList.remove("active");
});

btnGrade.addEventListener("click", () => {
  grid.classList.remove("inline-book");
  btnGrade.classList.add("active");
  btnLista.classList.remove("active");
});




// =================== PAGINAÇÃO ===================


// =================== INICIALIZAÇÃO ===================
init();
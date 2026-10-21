import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  Keyboard,
  TextInput,
  TouchableOpacity,
  Text,
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Produto,
  BigDecimal,
  listarProdutosPaginados,
  cadastrarProdutoApi,
  formatarPreco,
} from "../services/produtoApi";

export type { Produto, BigDecimal };

// Chaves de persistência do segundo dado (Aula 16)
const CHAVE_HISTORICO_BUSCA = "@compre_bem:historico_pesquisa";
const CHAVE_ULTIMA_BUSCA = "@compre_bem:ultima_busca";

const TAMANHO_PAGINA_PADRAO = 20;

interface TelaListaProdutosProps {
  navigation: any;
  favoritos: number[];
  onToggleFavorito: (id: number) => void;
}

export default function TelaListaProdutos({
  navigation,
  favoritos,
  onToggleFavorito,
}: TelaListaProdutosProps) {
  // Estados da listagem paginada vinda da API
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [ultimaPagina, setUltimaPagina] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [erroApi, setErroApi] = useState("");

  // Estados da Busca e Histórico
  const [textoBusca, setTextoBusca] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState("");
  const [historicoBusca, setHistoricoBusca] = useState<string[]>([]);
  const [filtroFavoritos, setFiltroFavoritos] = useState(false);
  const [inicializado, setInicializado] = useState(false);

  // Controle de exibição do formulário de cadastro
  const [exibirCadastro, setExibirCadastro] = useState(false);
  const [salvandoProduto, setSalvandoProduto] = useState(false);

  // Estados do formulário de cadastro padronizados com o Backend
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagem, setImagem] = useState("");
  const [erro, setErro] = useState("");

  const inputPrecoRef = useRef<TextInput>(null);
  const inputQuantidadeRef = useRef<TextInput>(null);
  const inputCategoriaRef = useRef<TextInput>(null);
  const inputDescricaoRef = useRef<TextInput>(null);
  const inputImagemRef = useRef<TextInput>(null);

  // Função para buscar uma página na API
  const carregarPagina = useCallback(
    async (page: number, termoBusca: string, substituirLista: boolean = false) => {
      try {
        setErroApi("");
        if (page === 0 && substituirLista) {
          setCarregandoInicial(true);
        } else if (page > 0) {
          setCarregandoMais(true);
        }

        const resposta = await listarProdutosPaginados(
          page,
          TAMANHO_PAGINA_PADRAO,
          termoBusca
        );

        setProdutos((listaAnterior) => {
          if (substituirLista || page === 0) {
            return resposta.content;
          }
          // Evita duplicatas ao concatenar páginas no scroll infinito
          const idsExistentes = new Set(listaAnterior.map((p) => p.produtoId));
          const novosItens = resposta.content.filter(
            (p) => !idsExistentes.has(p.produtoId)
          );
          return [...listaAnterior, ...novosItens];
        });

        setPaginaAtual(resposta.number);
        setTotalPaginas(resposta.totalPages);
        setTotalElementos(resposta.totalElements);
        setUltimaPagina(resposta.last);
      } catch (e: any) {
        console.error("Erro ao buscar produtos na API:", e);
        setErroApi(
          "Não foi possível conectar à API em http://localhost:8080. Verifique se o backend está rodando."
        );
      } finally {
        setCarregandoInicial(false);
        setCarregandoMais(false);
        setAtualizando(false);
      }
    },
    []
  );

  // 1. Carrega dados persistidos ao montar a tela e faz a primeira busca na API
  useEffect(() => {
    async function inicializarTela() {
      let termoInicial = "";
      try {
        const historicoSalvo = await AsyncStorage.getItem(CHAVE_HISTORICO_BUSCA);
        if (historicoSalvo !== null) {
          const lista = JSON.parse(historicoSalvo);
          if (Array.isArray(lista)) {
            setHistoricoBusca(lista);
          }
        }

        const ultimaBuscaSalva = await AsyncStorage.getItem(CHAVE_ULTIMA_BUSCA);
        if (ultimaBuscaSalva !== null && ultimaBuscaSalva.trim() !== "") {
          termoInicial = ultimaBuscaSalva.trim();
          setTextoBusca(termoInicial);
          setBuscaAtiva(termoInicial);
        }
      } catch (e) {
        console.error("Erro ao carregar dados de busca do AsyncStorage:", e);
      } finally {
        setInicializado(true);
        await carregarPagina(0, termoInicial, true);
      }
    }

    inicializarTela();
  }, [carregarPagina]);

  // 2. Executa a pesquisa na API (/api/v1/produtos?busca=...), reiniciando na página 0
  async function executarPesquisa(termo: string) {
    const termoLimpo = termo.trim();
    setBuscaAtiva(termoLimpo);
    setTextoBusca(termoLimpo);
    Keyboard.dismiss();

    await carregarPagina(0, termoLimpo, true);

    if (!termoLimpo) {
      try {
        await AsyncStorage.removeItem(CHAVE_ULTIMA_BUSCA);
      } catch (e) {
        console.error("Erro ao remover última busca:", e);
      }
      return;
    }

    const novoHistorico = [
      termoLimpo,
      ...historicoBusca.filter(
        (item) => item.toLowerCase() !== termoLimpo.toLowerCase()
      ),
    ].slice(0, 5);

    setHistoricoBusca(novoHistorico);

    try {
      await AsyncStorage.setItem(
        CHAVE_HISTORICO_BUSCA,
        JSON.stringify(novoHistorico)
      );
      await AsyncStorage.setItem(CHAVE_ULTIMA_BUSCA, termoLimpo);
    } catch (e) {
      console.error("Erro ao salvar dados de busca no AsyncStorage:", e);
    }
  }

  // Limpa a busca ativa e recarrega a primeira página completa da API
  async function limparPesquisa() {
    setTextoBusca("");
    setBuscaAtiva("");
    try {
      await AsyncStorage.removeItem(CHAVE_ULTIMA_BUSCA);
    } catch (e) {
      console.error("Erro ao limpar última busca:", e);
    }
    await carregarPagina(0, "", true);
  }

  // Limpa todo o histórico de pesquisas persistido
  async function limparTodoHistorico() {
    setHistoricoBusca([]);
    try {
      await AsyncStorage.removeItem(CHAVE_HISTORICO_BUSCA);
    } catch (e) {
      console.error("Erro ao limpar histórico de busca:", e);
    }
  }

  // Scroll Infinito: carrega a próxima página quando chega ao fim da lista
  function carregarProximaPagina() {
    if (
      !inicializado ||
      carregandoInicial ||
      carregandoMais ||
      ultimaPagina ||
      erroApi !== ""
    ) {
      return;
    }
    carregarPagina(paginaAtual + 1, buscaAtiva, false);
  }

  // Pull-to-refresh para atualizar a lista a partir da página 0
  function atualizarLista() {
    setAtualizando(true);
    carregarPagina(0, buscaAtiva, true);
  }

  // Filtragem local apenas quando o botão de "Favoritos" estiver ativo
  // (A busca por nome já vem filtrada diretamente do Backend)
  const produtosExibidos = useMemo(() => {
    if (!filtroFavoritos) {
      return produtos;
    }
    return produtos.filter((item: Produto) =>
      favoritos.includes(item.produtoId)
    );
  }, [produtos, filtroFavoritos, favoritos]);

  // Valida o formulário e envia POST /api/v1/produtos para o Backend
  async function validarESalvar() {
    if (nome.trim() === "") {
      setErro("O nome não pode ficar vazio.");
      return;
    }

    const precoBigDecimal: BigDecimal = Number(preco.trim().replace(",", "."));
    if (preco.trim() === "" || isNaN(precoBigDecimal) || precoBigDecimal <= 0) {
      setErro("O preço precisa ser um número maior que zero (ex.: 89,90).");
      return;
    }

    const quantidadeNumerica = Number(quantidade.trim());
    if (
      quantidade.trim() === "" ||
      isNaN(quantidadeNumerica) ||
      !Number.isInteger(quantidadeNumerica) ||
      quantidadeNumerica < 0
    ) {
      setErro(
        "A quantidade precisa ser um número inteiro maior ou igual a zero (ex.: 10)."
      );
      return;
    }

    try {
      setSalvandoProduto(true);
      setErro("");

      await cadastrarProdutoApi({
        nome: nome.trim(),
        preco: precoBigDecimal,
        quantidade: quantidadeNumerica,
        categoria: categoria.trim() || "Geral",
        descricao:
          descricao.trim() || "Produto cadastrado pelo aplicativo mobile.",
        imagem:
          imagem.trim() ||
          `https://placehold.co/400x400/2e7d32/ffffff.png?text=${encodeURIComponent(
            nome.trim()
          )}`,
      });

      setNome("");
      setPreco("");
      setQuantidade("");
      setCategoria("");
      setDescricao("");
      setImagem("");
      setExibirCadastro(false);
      Keyboard.dismiss();

      // Recarrega a lista a partir da página 0 para refletir o novo produto
      await carregarPagina(0, buscaAtiva, true);
    } catch (e: any) {
      setErro(e.message || "Erro ao salvar produto na API.");
    } finally {
      setSalvandoProduto(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* SEÇÃO PRINCIPAL DE BUSCA COM TEXTBOX E BOTÃO DE PESQUISA */}
      <View style={styles.cardBusca}>
        <Text style={styles.tituloSecao}>🔍 Pesquisar Produtos na API</Text>

        {/* Linha do Textbox de Busca */}
        <View style={styles.buscaRow}>
          <TextInput
            style={styles.inputBusca}
            placeholder="Ex.: Cadeira, Mesa, LED..."
            placeholderTextColor="#888"
            value={textoBusca}
            onChangeText={setTextoBusca}
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => executarPesquisa(textoBusca)}
          />

          <TouchableOpacity
            style={styles.botaoPesquisar}
            onPress={() => executarPesquisa(textoBusca)}
          >
            <Text style={styles.botaoPesquisarTexto}>Buscar</Text>
          </TouchableOpacity>

          {buscaAtiva.length > 0 && (
            <TouchableOpacity
              style={styles.botaoLimparBusca}
              onPress={limparPesquisa}
            >
              <Text style={styles.botaoLimparBuscaTexto}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Indicador de Filtro Ativo */}
        {buscaAtiva.length > 0 && (
          <View style={styles.buscaAtivaRow}>
            <Text style={styles.buscaAtivaTexto}>
              Filtrando por:{" "}
              <Text style={styles.buscaAtivaDestaque}>"{buscaAtiva}"</Text> (
              {totalElementos} encontrados)
            </Text>
            <TouchableOpacity onPress={limparPesquisa}>
              <Text style={styles.buscaAtivaLimpar}>Limpar filtro</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Histórico de Pesquisas Persistido (Aula 16) */}
        <View style={styles.historicoContainer}>
          <View style={styles.historicoHeader}>
            <Text style={styles.historicoTitulo}>
              🕒 Histórico de Pesquisas:
            </Text>
            {historicoBusca.length > 0 && (
              <TouchableOpacity onPress={limparTodoHistorico}>
                <Text style={styles.historicoLimparTexto}>
                  Limpar histórico
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {historicoBusca.length === 0 ? (
            <Text style={styles.historicoVazioTexto}>
              Nenhuma busca recente. Digite acima e clique em "Buscar".
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.historicoScroll}
            >
              {historicoBusca.map((termo, index) => {
                const isAtivo =
                  buscaAtiva.toLowerCase() === termo.toLowerCase();

                return (
                  <TouchableOpacity
                    key={`${termo}-${index}`}
                    style={[
                      styles.chipHistorico,
                      isAtivo && styles.chipHistoricoAtivo,
                    ]}
                    onPress={() => executarPesquisa(termo)}
                  >
                    <Text
                      style={[
                        styles.chipHistoricoTexto,
                        isAtivo && styles.chipHistoricoTextoAtivo,
                      ]}
                    >
                      🔍 {termo}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>

      {/* BOTÃO PARA EXPANDIR/RECOLHER FORMULÁRIO DE CADASTRO */}
      <View style={styles.cadastroToggleContainer}>
        <TouchableOpacity
          style={styles.botaoToggleCadastro}
          onPress={() => setExibirCadastro(!exibirCadastro)}
        >
          <Text style={styles.botaoToggleCadastroTexto}>
            {exibirCadastro
              ? "▲ Ocultar Formulário de Cadastro"
              : "➕ Cadastrar Novo Produto"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* FORMULÁRIO DE CADASTRO EXPANSÍVEL */}
      {exibirCadastro && (
        <View style={styles.cadastroContainer}>
          <Text style={styles.subtitulo}>Cadastrar Novo Produto</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do produto *"
            value={nome}
            onChangeText={setNome}
            returnKeyType="next"
            onSubmitEditing={() => inputPrecoRef.current?.focus()}
          />
          <View style={styles.formRow}>
            <TextInput
              ref={inputPrecoRef}
              style={[styles.input, styles.inputMetade]}
              placeholder="Preço (ex.: 89,90) *"
              value={preco}
              onChangeText={setPreco}
              keyboardType="decimal-pad"
              returnKeyType="next"
              onSubmitEditing={() => inputQuantidadeRef.current?.focus()}
            />
            <TextInput
              ref={inputQuantidadeRef}
              style={[styles.input, styles.inputMetade]}
              placeholder="Quantidade *"
              value={quantidade}
              onChangeText={setQuantidade}
              keyboardType="number-pad"
              returnKeyType="next"
              onSubmitEditing={() => inputCategoriaRef.current?.focus()}
            />
          </View>
          <TextInput
            ref={inputCategoriaRef}
            style={styles.input}
            placeholder="Categoria (ex.: Móveis, Escritório)"
            value={categoria}
            onChangeText={setCategoria}
            returnKeyType="next"
            onSubmitEditing={() => inputDescricaoRef.current?.focus()}
          />
          <TextInput
            ref={inputDescricaoRef}
            style={styles.input}
            placeholder="Descrição do produto"
            value={descricao}
            onChangeText={setDescricao}
            returnKeyType="next"
            onSubmitEditing={() => inputImagemRef.current?.focus()}
          />
          <TextInput
            ref={inputImagemRef}
            style={styles.input}
            placeholder="URL da Imagem (opcional)"
            value={imagem}
            onChangeText={setImagem}
            returnKeyType="done"
            onSubmitEditing={validarESalvar}
          />

          {erro !== "" && <Text style={styles.erro}>{erro}</Text>}

          <TouchableOpacity
            style={styles.botaoCadastrar}
            onPress={validarESalvar}
            disabled={salvandoProduto}
          >
            <Text style={styles.botaoCadastrarTexto}>
              {salvandoProduto ? "Salvando..." : "Salvar Produto"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SEÇÃO DA LISTA DE PRODUTOS */}
      <View style={styles.listaSecao}>
        {/* Filtros: Todos vs Favoritos + Info de Paginação */}
        <View style={styles.filtrosRow}>
          <TouchableOpacity
            style={[
              styles.filtroBotao,
              !filtroFavoritos && styles.filtroBotaoAtivo,
            ]}
            onPress={() => setFiltroFavoritos(false)}
          >
            <Text
              style={[
                styles.filtroBotaoTexto,
                !filtroFavoritos && styles.filtroBotaoTextoAtivo,
              ]}
            >
              Catálogo ({produtos.length}/{totalElementos})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filtroBotao,
              filtroFavoritos && styles.filtroBotaoAtivo,
            ]}
            onPress={() => setFiltroFavoritos(true)}
          >
            <Text
              style={[
                styles.filtroBotaoTexto,
                filtroFavoritos && styles.filtroBotaoTextoAtivo,
              ]}
            >
              ❤️ Favoritos ({favoritos.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mensagem de erro de conexão com botão de tentar novamente */}
        {erroApi !== "" && (
          <View style={styles.erroApiContainer}>
            <Text style={styles.erroApiTexto}>{erroApi}</Text>
            <TouchableOpacity
              style={styles.botaoTentarNovamente}
              onPress={() => carregarPagina(0, buscaAtiva, true)}
            >
              <Text style={styles.botaoTentarNovamenteTexto}>
                🔄 Tentar Novamente
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Inicial */}
        {carregandoInicial ? (
          <View style={styles.loadingCentral}>
            <ActivityIndicator size="large" color="#2e7d32" />
            <Text style={styles.loadingTexto}>
              Carregando catálogo da API...
            </Text>
          </View>
        ) : (
          /* Listagem com FlatList e Scroll Infinito */
          <FlatList
            data={produtosExibidos}
            keyExtractor={(item) => item.produtoId.toString()}
            contentContainerStyle={styles.listaContent}
            onEndReached={carregarProximaPagina}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl
                refreshing={atualizando}
                onRefresh={atualizarLista}
                colors={["#2e7d32"]}
              />
            }
            ListEmptyComponent={
              <View style={styles.vazioContainer}>
                <Text style={styles.vazioTexto}>
                  {filtroFavoritos
                    ? "Nenhum produto favoritado nas páginas carregadas."
                    : buscaAtiva
                    ? `Nenhum produto encontrado para "${buscaAtiva}".`
                    : "Nenhum produto cadastrado."}
                </Text>
                {buscaAtiva !== "" && (
                  <TouchableOpacity
                    style={styles.botaoLimparVazio}
                    onPress={limparPesquisa}
                  >
                    <Text style={styles.botaoLimparVazioTexto}>
                      Limpar pesquisa
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            ListFooterComponent={
              carregandoMais ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator size="small" color="#2e7d32" />
                  <Text style={styles.footerTexto}>
                    Carregando página {paginaAtual + 2} de {totalPaginas}...
                  </Text>
                </View>
              ) : produtosExibidos.length > 0 ? (
                <View style={styles.footerLoading}>
                  <Text style={styles.footerTexto}>
                    Página {paginaAtual + 1} de {Math.max(1, totalPaginas)} •
                    Exibindo {produtos.length} de {totalElementos} produtos
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const isFavorito = favoritos.includes(item.produtoId);

              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate("DetalheProduto", {
                      produtoId: item.produtoId,
                      produto: item,
                    })
                  }
                >
                  <View style={styles.cardRow}>
                    {item.imagem ? (
                      <Image
                        source={{ uri: item.imagem }}
                        style={styles.cardImagem}
                      />
                    ) : null}

                    <View style={styles.cardInfo}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardNome} numberOfLines={1}>
                          {item.nome}
                        </Text>
                        <TouchableOpacity
                          style={styles.botaoFavorito}
                          onPress={() => onToggleFavorito(item.produtoId)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={styles.iconeFavorito}>
                            {isFavorito ? "❤️" : "🤍"}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {item.categoria ? (
                        <View style={styles.badgeCategoria}>
                          <Text style={styles.textoCategoria}>
                            {item.categoria}
                          </Text>
                        </View>
                      ) : null}

                      <View style={styles.cardDetalhesRow}>
                        <Text style={styles.cardPreco}>
                          {formatarPreco(item.preco)}
                        </Text>
                        <Text style={styles.cardEstoque}>
                          Estoque: {item.quantidade}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f6" },

  // Card de Pesquisa
  cardBusca: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tituloSecao: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  buscaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputBusca: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#1a1a1a",
  },
  botaoPesquisar: {
    backgroundColor: "#2e7d32",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  botaoPesquisarTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  botaoLimparBusca: {
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  botaoLimparBuscaTexto: {
    color: "#444",
    fontWeight: "bold",
    fontSize: 14,
  },
  buscaAtivaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  buscaAtivaTexto: {
    fontSize: 13,
    color: "#555",
  },
  buscaAtivaDestaque: {
    fontWeight: "bold",
    color: "#2e7d32",
  },
  buscaAtivaLimpar: {
    fontSize: 12,
    color: "#c62828",
    fontWeight: "600",
  },

  // Histórico
  historicoContainer: {
    marginTop: 10,
  },
  historicoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  historicoTitulo: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  historicoLimparTexto: {
    fontSize: 12,
    color: "#c62828",
    fontWeight: "bold",
  },
  historicoVazioTexto: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  historicoScroll: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  chipHistorico: {
    backgroundColor: "#f0f2f5",
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#d0d4dc",
  },
  chipHistoricoAtivo: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },
  chipHistoricoTexto: {
    fontSize: 13,
    color: "#333",
  },
  chipHistoricoTextoAtivo: {
    color: "#fff",
    fontWeight: "bold",
  },

  // Toggle do Cadastro
  cadastroToggleContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  botaoToggleCadastro: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2e7d32",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  botaoToggleCadastroTexto: {
    color: "#2e7d32",
    fontWeight: "600",
    fontSize: 13,
  },

  // Cadastro Form
  subtitulo: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  cadastroContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 10,
    elevation: 2,
  },
  formRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    fontSize: 14,
  },
  inputMetade: {
    flex: 1,
  },
  erro: { color: "#C62828", fontSize: 13, marginBottom: 8 },
  botaoCadastrar: {
    backgroundColor: "#2e7d32",
    padding: 11,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  botaoCadastrarTexto: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  // Lista
  listaSecao: { flex: 1, paddingHorizontal: 16 },
  filtrosRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  filtroBotao: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    alignItems: "center",
  },
  filtroBotaoAtivo: {
    backgroundColor: "#2e7d32",
  },
  filtroBotaoTexto: {
    color: "#444",
    fontWeight: "600",
    fontSize: 13,
  },
  filtroBotaoTextoAtivo: {
    color: "#fff",
  },
  listaContent: { paddingBottom: 24 },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    minHeight: 48,
    justifyContent: "center",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardImagem: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#e8f5e9",
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardNome: { flex: 1, fontSize: 16, fontWeight: "bold", color: "#1a1a1a" },
  botaoFavorito: {
    padding: 4,
    marginLeft: 8,
  },
  iconeFavorito: {
    fontSize: 20,
  },
  badgeCategoria: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  textoCategoria: {
    fontSize: 11,
    color: "#2e7d32",
    fontWeight: "600",
  },
  cardDetalhesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    flexWrap: "wrap",
    rowGap: 4,
  },
  cardPreco: { fontSize: 14, fontWeight: "600", color: "#2e7d32" },
  cardEstoque: { fontSize: 13, color: "#666" },
  loadingCentral: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingTexto: {
    marginTop: 10,
    fontSize: 14,
    color: "#555",
  },
  footerLoading: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  footerTexto: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  erroApiContainer: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ef9a9a",
    alignItems: "center",
  },
  erroApiTexto: {
    color: "#c62828",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  botaoTentarNovamente: {
    backgroundColor: "#c62828",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  botaoTentarNovamenteTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  vazioContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  vazioTexto: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  botaoLimparVazio: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#e0e0e0",
    borderRadius: 6,
  },
  botaoLimparVazioTexto: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
});

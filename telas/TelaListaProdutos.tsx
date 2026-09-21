import React, { useMemo, useRef, useState, useEffect } from "react";
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Produto {
  id: number;
  nome: string;
  preco: string;
  estoque: number;
  descricao?: string;
}

export const produtosIniciais: Produto[] = [
  {
    id: 1,
    nome: "Cadeira Confort Plus",
    preco: "R$ 349,90",
    estoque: 10,
    descricao: "Cadeira ergonômica para escritório.",
  },
  {
    id: 2,
    nome: "Mesa Escritório Slim",
    preco: "R$ 459,00",
    estoque: 5,
    descricao: "Mesa em MDF com acabamento fosco.",
  },
  {
    id: 3,
    nome: "Luminária de Mesa LED",
    preco: "R$ 89,90",
    estoque: 25,
    descricao: "Luminária recarregável com ajuste de brilho.",
  },
];

// Chaves de persistência do segundo dado (Aula 16)
const CHAVE_HISTORICO_BUSCA = "@compre_bem:historico_pesquisa";
const CHAVE_ULTIMA_BUSCA = "@compre_bem:ultima_busca";

interface TelaListaProdutosProps {
  navigation: any;
  produtos: Produto[];
  onAdicionarProduto: (novoProduto: Produto) => void;
  favoritos: number[];
  onToggleFavorito: (id: number) => void;
}

export default function TelaListaProdutos({
  navigation,
  produtos,
  onAdicionarProduto,
  favoritos,
  onToggleFavorito,
}: TelaListaProdutosProps) {
  // Estados da Busca e Histórico
  const [textoBusca, setTextoBusca] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState("");
  const [historicoBusca, setHistoricoBusca] = useState<string[]>([]);
  const [filtroFavoritos, setFiltroFavoritos] = useState(false);

  // Controle de exibição do formulário de cadastro
  const [exibirCadastro, setExibirCadastro] = useState(false);

  // Estados do formulário de cadastro
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [erro, setErro] = useState("");

  const inputPrecoRef = useRef<TextInput>(null);
  const inputEstoqueRef = useRef<TextInput>(null);

  // 1. Carrega dados persistidos ao montar a tela (Aula 16)
  useEffect(() => {
    async function carregarDadosPersistidos() {
      try {
        // Carrega o histórico de pesquisas
        const historicoSalvo = await AsyncStorage.getItem(CHAVE_HISTORICO_BUSCA);
        if (historicoSalvo !== null) {
          const lista = JSON.parse(historicoSalvo);
          if (Array.isArray(lista)) {
            setHistoricoBusca(lista);
          }
        }

        // Carrega a última busca realizada
        const ultimaBuscaSalva = await AsyncStorage.getItem(CHAVE_ULTIMA_BUSCA);
        if (ultimaBuscaSalva !== null && ultimaBuscaSalva.trim() !== "") {
          setTextoBusca(ultimaBuscaSalva);
          setBuscaAtiva(ultimaBuscaSalva);
        }
      } catch (e) {
        console.error("Erro ao carregar dados de busca do AsyncStorage:", e);
      }
    }

    carregarDadosPersistidos();
  }, []);

  // 2. Executa a pesquisa, atualiza os filtros e persiste histórico e última busca
  async function executarPesquisa(termo: string) {
    const termoLimpo = termo.trim();
    setBuscaAtiva(termoLimpo);
    setTextoBusca(termoLimpo);
    Keyboard.dismiss();

    if (!termoLimpo) {
      // Se a busca estiver vazia, remove a última busca persistida
      try {
        await AsyncStorage.removeItem(CHAVE_ULTIMA_BUSCA);
      } catch (e) {
        console.error("Erro ao remover última busca:", e);
      }
      return;
    }

    // Atualiza o histórico: adiciona no início, remove duplicatas e mantém até 5 termos
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

  // Limpa a busca ativa e restaura a lista completa
  async function limparPesquisa() {
    setTextoBusca("");
    setBuscaAtiva("");
    try {
      await AsyncStorage.removeItem(CHAVE_ULTIMA_BUSCA);
    } catch (e) {
      console.error("Erro ao limpar última busca:", e);
    }
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

  // Filtragem dos produtos considerando o termo de busca ativo e o filtro de favoritos
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((item: Produto) => {
      const atendeBusca = buscaAtiva
        ? item.nome.toLowerCase().includes(buscaAtiva.toLowerCase())
        : true;
      const atendeFavoritos = filtroFavoritos
        ? favoritos.includes(item.id)
        : true;
      return atendeBusca && atendeFavoritos;
    });
  }, [produtos, buscaAtiva, filtroFavoritos, favoritos]);

  function validarESalvar() {
    if (nome.trim() === "") {
      setErro("O nome não pode ficar vazio.");
      return;
    }

    const precoNumerico = Number(preco.trim().replace(",", "."));
    if (preco.trim() === "" || isNaN(precoNumerico) || precoNumerico <= 0) {
      setErro("O preço precisa ser um número maior que zero (ex.: 89,90).");
      return;
    }

    const estoqueNumerico = Number(estoque.trim());
    if (
      estoque.trim() === "" ||
      isNaN(estoqueNumerico) ||
      !Number.isInteger(estoqueNumerico) ||
      estoqueNumerico < 0
    ) {
      setErro(
        "O estoque precisa ser um número inteiro maior ou igual a zero (ex.: 10)."
      );
      return;
    }

    onAdicionarProduto({
      id: Date.now(),
      nome,
      preco: `R$ ${precoNumerico.toFixed(2).replace(".", ",")}`,
      estoque: estoqueNumerico,
      descricao: "Produto cadastrado pela equipe da loja.",
    });

    setNome("");
    setPreco("");
    setEstoque("");
    setErro("");
    setExibirCadastro(false);
    Keyboard.dismiss();
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* SEÇÃO PRINCIPAL DE BUSCA COM TEXTBOX E BOTÃO DE PESQUISA */}
      <View style={styles.cardBusca}>
        <Text style={styles.tituloSecao}>🔍 Pesquisar Produtos</Text>

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
              Filtrando por: <Text style={styles.buscaAtivaDestaque}>"{buscaAtiva}"</Text>
            </Text>
            <TouchableOpacity onPress={limparPesquisa}>
              <Text style={styles.buscaAtivaLimpar}>Limpar filtro</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Histórico de Pesquisas Persistido (Aula 16) */}
        <View style={styles.historicoContainer}>
          <View style={styles.historicoHeader}>
            <Text style={styles.historicoTitulo}>🕒 Histórico de Pesquisas:</Text>
            {historicoBusca.length > 0 && (
              <TouchableOpacity onPress={limparTodoHistorico}>
                <Text style={styles.historicoLimparTexto}>Limpar histórico</Text>
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
            placeholder="Nome do produto"
            value={nome}
            onChangeText={setNome}
            returnKeyType="next"
            onSubmitEditing={() => inputPrecoRef.current?.focus()}
          />
          <TextInput
            ref={inputPrecoRef}
            style={styles.input}
            placeholder="Preço (ex.: 89,90)"
            value={preco}
            onChangeText={setPreco}
            keyboardType="decimal-pad"
            returnKeyType="next"
            onSubmitEditing={() => inputEstoqueRef.current?.focus()}
          />
          <TextInput
            ref={inputEstoqueRef}
            style={styles.input}
            placeholder="Quantidade em estoque (ex.: 10)"
            value={estoque}
            onChangeText={setEstoque}
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={validarESalvar}
          />

          {erro !== "" && <Text style={styles.erro}>{erro}</Text>}

          <TouchableOpacity
            style={styles.botaoCadastrar}
            onPress={validarESalvar}
          >
            <Text style={styles.botaoCadastrarTexto}>Salvar Produto</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SEÇÃO DA LISTA DE PRODUTOS */}
      <View style={styles.listaSecao}>
        {/* Filtros: Todos vs Favoritos (Aula 15) */}
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
              Todos ({produtos.length})
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

        {/* Listagem com FlatList */}
        <FlatList
          data={produtosFiltrados}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listaContent}
          ListEmptyComponent={
            <View style={styles.vazioContainer}>
              <Text style={styles.vazioTexto}>
                {filtroFavoritos
                  ? "Nenhum produto favoritado."
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
          renderItem={({ item }) => {
            const isFavorito = favoritos.includes(item.id);

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate("DetalheProduto", { produto: item })
                }
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardNome}>{item.nome}</Text>
                  {/* Botão de Favoritar (Aula 15) */}
                  <TouchableOpacity
                    style={styles.botaoFavorito}
                    onPress={() => onToggleFavorito(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.iconeFavorito}>
                      {isFavorito ? "❤️" : "🤍"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.cardDetalhesRow}>
                  <Text style={styles.cardPreco}>{item.preco}</Text>
                  <Text style={styles.cardEstoque}>
                    Estoque: {item.estoque}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
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
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    fontSize: 14,
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
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    minHeight: 48,
    justifyContent: "center",
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
  cardDetalhesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    flexWrap: "wrap",
    rowGap: 4,
  },
  cardPreco: { fontSize: 14, fontWeight: "600", color: "#2e7d32" },
  cardEstoque: { fontSize: 13, color: "#666" },
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

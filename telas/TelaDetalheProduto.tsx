import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import {
  Produto,
  buscarProdutoPorId,
  formatarPreco,
} from "../services/produtoApi";

interface TelaDetalheProdutoProps {
  route: any;
  navigation?: any;
  favoritos?: number[];
  onToggleFavorito?: (id: number) => void;
}

export default function TelaDetalheProduto({
  route,
  navigation,
  favoritos = [],
  onToggleFavorito,
}: TelaDetalheProdutoProps) {
  const produtoInicial: Produto | undefined = route.params?.produto;
  const idParam: number | undefined =
    route.params?.produtoId ?? produtoInicial?.produtoId;

  const [produto, setProduto] = useState<Produto | null>(
    produtoInicial || null
  );
  const [carregando, setCarregando] = useState<boolean>(true);
  const [naoEncontrado404, setNaoEncontrado404] = useState<boolean>(false);
  const [erroMensagem, setErroMensagem] = useState<string>("");

  // Consulta o endpoint GET /api/v1/produtos/{id} para obter os dados atualizados e validar 404
  useEffect(() => {
    async function carregarDetalhe() {
      if (idParam === undefined || idParam === null) {
        setCarregando(false);
        setNaoEncontrado404(true);
        return;
      }

      try {
        setCarregando(true);
        setNaoEncontrado404(false);
        setErroMensagem("");

        const dadosApi = await buscarProdutoPorId(Number(idParam));
        setProduto(dadosApi);
      } catch (e: any) {
        if (e?.status === 404) {
          setNaoEncontrado404(true);
          setProduto(null);
        } else {
          setErroMensagem(
            e?.message || "Erro ao consultar detalhes do produto na API."
          );
        }
      } finally {
        setCarregando(false);
      }
    }

    carregarDetalhe();
  }, [idParam]);

  if (carregando && !produto) {
    return (
      <SafeAreaView style={styles.containerCentral}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.carregandoTexto}>
          Buscando detalhes do produto...
        </Text>
      </SafeAreaView>
    );
  }

  if (naoEncontrado404 || !produto) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.erroTitulo}>404 - Produto não encontrado</Text>
          <Text style={styles.erroText}>
            O produto solicitado não existe ou foi removido do catálogo.
          </Text>
          {navigation && (
            <TouchableOpacity
              style={styles.botaoVoltar}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.botaoVoltarTexto}>
                ← Voltar para a Lista
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const isFavorito = favoritos.includes(produto.produtoId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {produto.imagem ? (
            <Image
              source={{ uri: produto.imagem }}
              style={styles.imagemProduto}
              resizeMode="cover"
            />
          ) : null}

          <View style={styles.headerRow}>
            <Text style={styles.nome}>{produto.nome}</Text>
            {onToggleFavorito && (
              <TouchableOpacity
                style={styles.botaoFavoritoIcone}
                onPress={() => onToggleFavorito(produto.produtoId)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.iconeFavorito}>
                  {isFavorito ? "❤️" : "🤍"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.codigoId}>ID: #{produto.produtoId}</Text>

          <Text style={styles.preco}>{formatarPreco(produto.preco)}</Text>

          <View style={styles.badgesRow}>
            {produto.categoria ? (
              <View style={styles.badgeCategoria}>
                <Text style={styles.categoriaText}>
                  🏷️ Categoria: {produto.categoria}
                </Text>
              </View>
            ) : null}

            <View style={styles.badgeEstoque}>
              <Text style={styles.estoqueText}>
                📦 Quantidade em Estoque: {produto.quantidade}
              </Text>
            </View>
          </View>

          <Text style={styles.label}>Descrição do Produto:</Text>
          <Text style={styles.descricao}>
            {produto.descricao || "Sem descrição cadastrada."}
          </Text>

          {erroMensagem !== "" && (
            <Text style={styles.avisoOffline}>{erroMensagem}</Text>
          )}

          {onToggleFavorito && (
            <TouchableOpacity
              style={[
                styles.botaoAcaoFavorito,
                isFavorito && styles.botaoAcaoFavoritoAtivo,
              ]}
              onPress={() => onToggleFavorito(produto.produtoId)}
            >
              <Text
                style={[
                  styles.botaoAcaoFavoritoTexto,
                  isFavorito && styles.botaoAcaoFavoritoTextoAtivo,
                ]}
              >
                {isFavorito
                  ? "❤️ Remover dos Favoritos"
                  : "🤍 Adicionar aos Favoritos"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f6" },
  scrollContent: { padding: 16 },
  containerCentral: {
    flex: 1,
    backgroundColor: "#f4f4f6",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  carregandoTexto: {
    marginTop: 10,
    fontSize: 14,
    color: "#555",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    elevation: 3,
  },
  imagemProduto: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: "#e8f5e9",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  nome: { flex: 1, fontSize: 22, fontWeight: "bold", color: "#1a1a1a" },
  codigoId: { fontSize: 12, color: "#888", marginBottom: 8 },
  botaoFavoritoIcone: {
    padding: 4,
    marginLeft: 8,
  },
  iconeFavorito: {
    fontSize: 24,
  },
  preco: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 14,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  badgeCategoria: {
    backgroundColor: "#e3f2fd",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  categoriaText: { color: "#1565c0", fontWeight: "600", fontSize: 13 },
  badgeEstoque: {
    backgroundColor: "#e8f5e9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  estoqueText: { color: "#1b5e20", fontWeight: "500", fontSize: 13 },
  label: { fontSize: 14, fontWeight: "bold", color: "#666", marginBottom: 4 },
  descricao: { fontSize: 15, color: "#444", lineHeight: 22, marginBottom: 20 },
  avisoOffline: {
    fontSize: 12,
    color: "#ef6c00",
    marginBottom: 12,
    fontStyle: "italic",
  },
  botaoAcaoFavorito: {
    borderWidth: 1,
    borderColor: "#2e7d32",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#fff",
  },
  botaoAcaoFavoritoAtivo: {
    backgroundColor: "#ffebee",
    borderColor: "#e57373",
  },
  botaoAcaoFavoritoTexto: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  botaoAcaoFavoritoTextoAtivo: {
    color: "#c62828",
  },
  erroTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#c62828",
    textAlign: "center",
    marginBottom: 8,
  },
  erroText: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 16,
  },
  botaoVoltar: {
    backgroundColor: "#2e7d32",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  botaoVoltarTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

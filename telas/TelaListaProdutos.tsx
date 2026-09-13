import React, { useMemo, useRef, useState } from "react";
import {
  Keyboard,
  TextInput,
  TouchableOpacity,
  Text,
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from "react-native";

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

interface TelaListaProdutosProps {
  navigation: any;
  produtos: Produto[];
  onAdicionarProduto: (novoProduto: Produto) => void;
}

export default function TelaListaProdutos({
  navigation,
  produtos,
  onAdicionarProduto,
}: TelaListaProdutosProps) {
  const [busca, setBusca] = useState("");
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [erro, setErro] = useState("");

  const inputPrecoRef = useRef<TextInput>(null);
  const inputEstoqueRef = useRef<TextInput>(null);

  const produtosFiltrados = useMemo(
    () =>
      produtos.filter((item: Produto) =>
        item.nome.toLowerCase().includes(busca.toLowerCase()),
      ),
    [produtos, busca],
  );

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
        "O estoque precisa ser um número inteiro maior ou igual a zero (ex.: 10).",
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
    Keyboard.dismiss();
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Formulário de Cadastro */}
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
          <Text style={styles.botaoCadastrarTexto}>Cadastrar Produto</Text>
        </TouchableOpacity>
      </View>

      {/* Busca e Lista de Produtos */}
      <View style={styles.listaSecao}>
        <Text style={styles.subtitulo}>Lista de Produtos</Text>
        <TextInput
          style={styles.inputBusca}
          placeholder="Buscar produto pelo nome..."
          placeholderTextColor="#7c7c8a"
          value={busca}
          onChangeText={setBusca}
          autoCorrect={false}
        />

        <FlatList
          data={produtosFiltrados}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listaContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate("DetalheProduto", { produto: item })
              }
            >
              <Text style={styles.cardNome}>{item.nome}</Text>
              <View style={styles.cardDetalhesRow}>
                <Text style={styles.cardPreco}>{item.preco}</Text>
                <Text style={styles.cardEstoque}>Estoque: {item.estoque}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f6" },
  subtitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  cadastroContainer: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
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
  },
  inputBusca: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  erro: { color: "#C62828", fontSize: 13, marginBottom: 8 },
  botaoCadastrar: {
    backgroundColor: "#2e7d32",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  botaoCadastrarTexto: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  listaSecao: { flex: 1, paddingHorizontal: 16 },
  listaContent: { paddingBottom: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    minHeight: 48,
    justifyContent: "center",
  },
  cardNome: { fontSize: 16, fontWeight: "bold", color: "#1a1a1a" },
  cardDetalhesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    flexWrap: "wrap",
    rowGap: 4,
  },
  cardPreco: { fontSize: 14, fontWeight: "600", color: "#2e7d32" },
  cardEstoque: { fontSize: 13, color: "#666" },
});

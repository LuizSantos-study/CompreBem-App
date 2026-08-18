import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList, Button } from 'react-native';
import { useState } from 'react';

type ProdutoType = {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  estoque: number;
};

const PRODUTOS_MOCK: ProdutoType[] = [
  { id: '1', nome: 'Notebook', preco: 3500.00, descricao: '16GB RAM, SSD 512GB', estoque: 10 },
  { id: '2', nome: 'Mouse Vertical', preco: 150.00, descricao: 'Ergonômico sem fio', estoque: 5 },
];

export default function App() {
  return (
    <View style={styles.container}>
      <ListaProdutos />
      <StatusBar style="auto" />
    </View>
  );
}

function ListaProdutos() {
  return (
    <View style={styles.listContainer}>
      <FlatList
        data={PRODUTOS_MOCK}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Produto dados={item} />}
      />
    </View>
  );
}

type ProdutoProps = {
  dados: ProdutoType;
};

function Produto({ dados }: ProdutoProps) {
  const [expandido, setExpandido] = useState(false);

  return (
    <View style={styles.card}>
      <Text style={styles.nome}>{dados.nome}</Text>
      {expandido && <Text style={styles.descricao}>{dados.descricao}</Text>}
      <Text style={styles.preco}>R$ {dados.preco.toFixed(2)}</Text>
      <Text style={styles.estoque}>Estoque: {dados.estoque}</Text>
      <Button title={expandido ? 'Ocultar detalhes' : 'Ver detalhes'} onPress={() => setExpandido(!expandido)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  listContainer: {
    width: '80%',
    flex: 1, // Garante que a FlatList ocupe o espaço disponível para rolagem
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 5, // Sombra no Android
  },
  nome: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  descricao: {
    color: '#666',
    marginVertical: 4,
  },
  preco: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '600',
  },
  estoque: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
});
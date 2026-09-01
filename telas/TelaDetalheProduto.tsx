import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { Produto } from './TelaListaProdutos';

export default function TelaDetalheProduto({ route }: any) {
  const { produto }: { produto: Produto } = route.params || {};

  if (!produto) {
    return (
      <View style={styles.container}>
        <Text style={styles.erroText}>Nenhum produto selecionado.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.nome}>{produto.nome}</Text>
        <Text style={styles.preco}>{produto.preco}</Text>

        <View style={styles.badgeEstoque}>
          <Text style={styles.estoqueText}>📦 Quantidade em Estoque: {produto.estoque}</Text>
        </View>

        <Text style={styles.label}>Descrição do Produto:</Text>
        <Text style={styles.descricao}>
          {produto.descricao || 'Sem descrição cadastrada.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f6', padding: 16 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 3 },
  nome: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 6 },
  preco: { fontSize: 20, fontWeight: '600', color: '#2e7d32', marginBottom: 14 },
  badgeEstoque: { backgroundColor: '#e8f5e9', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 16 },
  estoqueText: { color: '#1b5e20', fontWeight: '500', fontSize: 14 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 4 },
  descricao: { fontSize: 15, color: '#444', lineHeight: 22 },
  erroText: { fontSize: 16, color: '#c62828', textAlign: 'center', marginTop: 20 },
});
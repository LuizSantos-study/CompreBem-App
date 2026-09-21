import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { Produto } from './TelaListaProdutos';

interface TelaDetalheProdutoProps {
  route: any;
  favoritos?: number[];
  onToggleFavorito?: (id: number) => void;
}

export default function TelaDetalheProduto({
  route,
  favoritos = [],
  onToggleFavorito,
}: TelaDetalheProdutoProps) {
  const { produto }: { produto: Produto } = route.params || {};

  if (!produto) {
    return (
      <View style={styles.container}>
        <Text style={styles.erroText}>Nenhum produto selecionado.</Text>
      </View>
    );
  }

  const isFavorito = favoritos.includes(produto.id);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.nome}>{produto.nome}</Text>
          {onToggleFavorito && (
            <TouchableOpacity
              style={styles.botaoFavoritoIcone}
              onPress={() => onToggleFavorito(produto.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.iconeFavorito}>
                {isFavorito ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.preco}>{produto.preco}</Text>

        <View style={styles.badgeEstoque}>
          <Text style={styles.estoqueText}>📦 Quantidade em Estoque: {produto.estoque}</Text>
        </View>

        <Text style={styles.label}>Descrição do Produto:</Text>
        <Text style={styles.descricao}>
          {produto.descricao || 'Sem descrição cadastrada.'}
        </Text>

        {onToggleFavorito && (
          <TouchableOpacity
            style={[
              styles.botaoAcaoFavorito,
              isFavorito && styles.botaoAcaoFavoritoAtivo,
            ]}
            onPress={() => onToggleFavorito(produto.id)}
          >
            <Text
              style={[
                styles.botaoAcaoFavoritoTexto,
                isFavorito && styles.botaoAcaoFavoritoTextoAtivo,
              ]}
            >
              {isFavorito ? '❤️ Remover dos Favoritos' : '🤍 Adicionar aos Favoritos'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f6', padding: 16 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 3 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nome: { flex: 1, fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  botaoFavoritoIcone: {
    padding: 4,
    marginLeft: 8,
  },
  iconeFavorito: {
    fontSize: 24,
  },
  preco: { fontSize: 20, fontWeight: '600', color: '#2e7d32', marginBottom: 14 },
  badgeEstoque: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  estoqueText: { color: '#1b5e20', fontWeight: '500', fontSize: 14 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 4 },
  descricao: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 20 },
  botaoAcaoFavorito: {
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#fff',
  },
  botaoAcaoFavoritoAtivo: {
    backgroundColor: '#ffebee',
    borderColor: '#e57373',
  },
  botaoAcaoFavoritoTexto: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  botaoAcaoFavoritoTextoAtivo: {
    color: '#c62828',
  },
  erroText: { fontSize: 16, color: '#c62828', textAlign: 'center', marginTop: 20 },
});
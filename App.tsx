import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import TelaListaProdutos, { produtosIniciais, Produto } from './telas/TelaListaProdutos';
import TelaDetalheProduto from './telas/TelaDetalheProduto';

const Stack = createNativeStackNavigator();

// Chave da persistência de Favoritos (Aula 15)
const CHAVE_FAVORITOS = '@compre_bem:favoritos';

export default function App() {
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais);
  const [favoritos, setFavoritos] = useState<number[]>([]);

  // Carrega os favoritos persistidos ao iniciar o aplicativo
  useEffect(() => {
    async function carregarFavoritos() {
      try {
        const dados = await AsyncStorage.getItem(CHAVE_FAVORITOS);
        if (dados !== null) {
          setFavoritos(JSON.parse(dados));
        }
      } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
      }
    }

    carregarFavoritos();
  }, []);

  // Alterna o status de favorito e persiste a nova lista no AsyncStorage
  async function toggleFavorito(produtoId: number) {
    try {
      const novosFavoritos = favoritos.includes(produtoId)
        ? favoritos.filter((id) => id !== produtoId)
        : [...favoritos, produtoId];

      setFavoritos(novosFavoritos);
      await AsyncStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(novosFavoritos));
    } catch (error) {
      console.error('Erro ao salvar favoritos:', error);
    }
  }

  function adicionarProduto(novoProduto: Produto) {
    setProdutos((atual) => [...atual, novoProduto]);
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ListaProdutos">
        <Stack.Screen 
          name="ListaProdutos" 
          options={{ title: 'Compre Bem - Loja' }}
        >
          {(props) => (
            <TelaListaProdutos 
              {...props} 
              produtos={produtos} 
              onAdicionarProduto={adicionarProduto} 
              favoritos={favoritos}
              onToggleFavorito={toggleFavorito}
            />
          )}
        </Stack.Screen>

        <Stack.Screen 
          name="DetalheProduto" 
          options={{ title: 'Detalhes do Produto' }} 
        >
          {(props) => (
            <TelaDetalheProduto 
              {...props}
              favoritos={favoritos}
              onToggleFavorito={toggleFavorito}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
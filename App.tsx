import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import TelaListaProdutos, { produtosIniciais, Produto } from './telas/TelaListaProdutos';
import TelaDetalheProduto from './telas/TelaDetalheProduto';

const Stack = createNativeStackNavigator();

export default function App() {
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais);

  function adicionarProduto(novoProduto: Produto) {
    setProdutos((atual) => [...atual, novoProduto]);
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ListaProdutos">
        <Stack.Screen 
          name="ListaProdutos" 
          options={{ title: 'Compre Bem - Lista de Produtos' }}
        >
          {(props) => (
            <TelaListaProdutos 
              {...props} 
              produtos={produtos} 
              onAdicionarProduto={adicionarProduto} 
            />
          )}
        </Stack.Screen>

        <Stack.Screen 
          name="DetalheProduto" 
          component={TelaDetalheProduto} 
          options={{ title: 'Detalhes do Produto' }} 
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
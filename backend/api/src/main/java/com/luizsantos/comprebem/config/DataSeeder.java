package com.luizsantos.comprebem.config;

import com.luizsantos.comprebem.model.Produto;
import com.luizsantos.comprebem.repository.ProdutoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final ProdutoRepository produtoRepository;

    public DataSeeder(ProdutoRepository produtoRepository) {
        this.produtoRepository = produtoRepository;
    }

    @Override
    public void run(String... args) {
        if (produtoRepository.count() == 0) {
            List<Produto> produtosIniciais = new ArrayList<>();

            String[] nomesBase = {
                "Cadeira Confort Plus",
                "Mesa Escritório Slim",
                "Luminária de Mesa LED",
                "Teclado Mecânico RGB",
                "Monitor UltraWide 29",
                "Suporte Articulado Monitor"
            };

            String[] categorias = {
                "Móveis",
                "Escritório",
                "Iluminação",
                "Periféricos",
                "Monitores",
                "Acessórios"
            };

            for (int i = 1; i <= 60; i++) {
                int idx = (i - 1) % nomesBase.length;
                String nome = nomesBase[idx] + " #" + i;
                String categoria = categorias[idx];
                BigDecimal preco = BigDecimal.valueOf(10.0 * i + 9.90);
                Produto produto = new Produto(
                        nome,
                        preco,
                        categoria,
                        "Descrição detalhada do " + nome + " (Produto " + i + ").",
                        "https://placehold.co/400x400/2e7d32/ffffff.png?text=Produto+" + i,
                        (i * 3) % 50 + 1
                );
                produtosIniciais.add(produto);
            }

            produtoRepository.saveAll(produtosIniciais);
            System.out.println("✅ DataSeeder: 60 produtos inseridos com sucesso no banco H2!");
        }
    }
}

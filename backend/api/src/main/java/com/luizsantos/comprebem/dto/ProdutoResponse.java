package com.luizsantos.comprebem.dto;

import com.luizsantos.comprebem.model.Produto;
import java.math.BigDecimal;

public record ProdutoResponse(
        Long produtoId,
        String nome,
        String descricao,
        BigDecimal preco,
        String categoria,
        String imagem,
        Integer quantidade
) {
    public static ProdutoResponse toDto(Produto produto) {
        return new ProdutoResponse(
                produto.getId(),
                produto.getNome(),
                produto.getDescricao(),
                produto.getPreco(),
                produto.getCategoria(),
                produto.getImagem(),
                produto.getQuantidade()
        );
    }
}

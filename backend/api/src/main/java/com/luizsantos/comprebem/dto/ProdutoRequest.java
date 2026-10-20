package com.luizsantos.comprebem.dto;

import com.luizsantos.comprebem.model.Produto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProdutoRequest(
        @NotBlank(message = "O nome do produto é obrigatório")
        @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres")
        String nome,

        @Size(max = 500, message = "A descrição deve ter no máximo 500 caracteres")
        String descricao,

        @NotNull(message = "O preço é obrigatório")
        @Positive(message = "O preço deve ser maior que zero")
        BigDecimal preco,

        String categoria,

        String imagem,

        @NotNull(message = "A quantidade é obrigatória")
        @PositiveOrZero(message = "A quantidade não pode ser negativa")
        Integer quantidade
) {
    public Produto toEntity() {
        return new Produto(
                this.nome,
                this.preco,
                this.categoria,
                this.descricao,
                this.imagem,
                this.quantidade
        );
    }
}

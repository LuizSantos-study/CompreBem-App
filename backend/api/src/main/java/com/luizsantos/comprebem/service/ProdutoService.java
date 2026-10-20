package com.luizsantos.comprebem.service;

import com.luizsantos.comprebem.dto.ProdutoRequest;
import com.luizsantos.comprebem.dto.ProdutoResponse;
import com.luizsantos.comprebem.model.Produto;
import com.luizsantos.comprebem.repository.ProdutoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ProdutoService {

    private final ProdutoRepository produtoRepository;

    public ProdutoService(ProdutoRepository produtoRepository) {
        this.produtoRepository = produtoRepository;
    }

    // Listagem simples retornando List<ProdutoResponse>
    public List<ProdutoResponse> findAll() {
        return produtoRepository.findAll()
                .stream()
                .map(ProdutoResponse::toDto)
                .toList();
    }

    // Listagem paginada (respeita page, size=20 e limite máximo=50)
    public Page<ProdutoResponse> findAllPaginado(String busca, Pageable pageable) {
        if (busca != null && !busca.trim().isEmpty()) {
            return produtoRepository.findByFiltro(busca.trim(), pageable)
                    .map(ProdutoResponse::toDto);
        }
        return produtoRepository.findAll(pageable)
                .map(ProdutoResponse::toDto);
    }

    // Busca por ID lançando 404 Not Found caso não exista
    public ProdutoResponse findById(UUID id) {
        Produto produto = produtoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));
        return ProdutoResponse.toDto(produto);
    }

    // Busca por filtro usando a query JPQL do Repository
    public List<ProdutoResponse> findByFiltro(String filtro) {
        return produtoRepository.findByFiltro(filtro)
                .stream()
                .map(ProdutoResponse::toDto)
                .toList();
    }

    // Cadastra um novo produto
    public ProdutoResponse save(ProdutoRequest request) {
        Produto novoProduto = request.toEntity();
        Produto salvo = produtoRepository.save(novoProduto);
        return ProdutoResponse.toDto(salvo);
    }

    // Atualiza um produto existente pelo UUID
    public ProdutoResponse update(UUID produtoId, ProdutoRequest request) {
        Produto existente = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));

        existente.setNome(request.nome());
        existente.setDescricao(request.descricao());
        existente.setPreco(request.preco());
        existente.setCategoria(request.categoria());
        existente.setImagem(request.imagem());
        existente.setQuantidade(request.quantidade());

        Produto atualizado = produtoRepository.save(existente);
        return ProdutoResponse.toDto(atualizado);
    }

    // Remove um produto pelo UUID
    public void delete(UUID produtoId) {
        if (!produtoRepository.existsById(produtoId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado");
        }
        produtoRepository.deleteById(produtoId);
    }
}

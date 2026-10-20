package com.luizsantos.comprebem.controller;

import com.luizsantos.comprebem.dto.ProdutoRequest;
import com.luizsantos.comprebem.dto.ProdutoResponse;
import com.luizsantos.comprebem.service.ProdutoService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/produtos")
@CrossOrigin("*")
public class ProdutoController {

    private final ProdutoService produtoService;

    public ProdutoController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    // Listagem paginada padrão (GET /api/v1/produtos?page=0&size=20&busca=...)
    @GetMapping
    public ResponseEntity<Page<ProdutoResponse>> findAllPaginado(
            @RequestParam(required = false) String busca,
            @PageableDefault(page = 0, size = 20) Pageable pageable) {
        return ResponseEntity.ok(produtoService.findAllPaginado(busca, pageable));
    }

    // Listagem completa sem paginação (GET /api/v1/produtos/todos)
    @GetMapping("/todos")
    public List<ProdutoResponse> findAll() {
        return produtoService.findAll();
    }

    // Busca por ID (GET /api/v1/produtos/{id}) - Retorna 404 se não existir
    @GetMapping("/{id}")
    public ProdutoResponse findById(@PathVariable UUID id) {
        return produtoService.findById(id);
    }

    // Busca por filtro (GET /api/v1/produtos/filtro?filtro=...)
    @GetMapping("/filtro")
    public List<ProdutoResponse> findByFiltro(@RequestParam String filtro) {
        return produtoService.findByFiltro(filtro);
    }

    // Cadastro de produto (POST /api/v1/produtos)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProdutoResponse save(@Valid @RequestBody ProdutoRequest produto) {
        return produtoService.save(produto);
    }

    // Atualização de produto (PUT /api/v1/produtos/{produtoId})
    @PutMapping("/{produtoId}")
    public ProdutoResponse update(@PathVariable UUID produtoId, @Valid @RequestBody ProdutoRequest produto) {
        return produtoService.update(produtoId, produto);
    }

    // Exclusão de produto (DELETE /api/v1/produtos/{produtoId})
    @DeleteMapping("/{produtoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID produtoId) {
        produtoService.delete(produtoId);
    }
}
